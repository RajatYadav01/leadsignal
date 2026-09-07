import csv
from rest_framework import generics, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from apps.projects.models import Project, ICPProfile
from .models import Lead, ImportJob
from .serializers import (
    ProjectSerializer,
    ICPProfileSerializer,
    LeadListSerializer,
    LeadDetailSerializer,
    ImportJobSerializer,
)
from .services.importer import import_csv
from .services.analysis_service import run_analysis


# ------------------- Projects -------------------
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    # Allow any user; add authentication later


# ------------------- ICP -------------------
class ICPDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ICPProfileSerializer

    def get_object(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        icp, created = ICPProfile.objects.get_or_create(project=project)
        return icp


# ------------------- Leads -------------------
class LeadListView(generics.ListAPIView):
    serializer_class = LeadListSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["industry", "country", "priority", "hiring"]
    ordering_fields = ["lead_score", "employees", "revenue", "created_at"]
    ordering = ["-lead_score"]

    def get_queryset(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        return (
            Lead.objects.filter(project=project)
            .select_related("score_detail")
            .prefetch_related("contacts", "signals")
        )


class LeadDetailView(generics.RetrieveAPIView):
    serializer_class = LeadDetailSerializer
    queryset = (
        Lead.objects.all()
        .select_related("score_detail")
        .prefetch_related("contacts", "signals")
    )


# ------------------- Import -------------------
class LeadImportView(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        csv_file = request.FILES.get("file")
        if not csv_file:
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        # Validate file size (e.g., 10MB)
        if csv_file.size > 10 * 1024 * 1024:
            return Response(
                {"error": "File too large"}, status=status.HTTP_400_BAD_REQUEST
            )

        import_job = import_csv(csv_file, project)

        # IMPORTANT: Do NOT run analysis automatically.
        # The user must configure ICP first, then click the "Analyze" button.
        serializer = ImportJobSerializer(import_job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ------------------- Analysis Trigger -------------------
class AnalyzeView(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        run_analysis(project)
        # Return summary counts
        leads = project.leads.all()
        stats = {
            "total_leads": leads.count(),
            "valid_leads": leads.filter(data_quality_score__gte=60).count(),
            "icp_matches": leads.filter(lead_score__gte=60).count(),
            "high_priority": leads.filter(priority="HIGH").count(),
        }
        return Response(stats)


# ------------------- Dashboard -------------------
class DashboardView(APIView):
    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        leads = project.leads.all()
        total = leads.count()
        valid = leads.filter(data_quality_score__gte=60).count()
        icp_matches = leads.filter(lead_score__gte=60).count()
        high = leads.filter(priority="HIGH").count()
        return Response(
            {
                "total_leads": total,
                "valid_leads": valid,
                "icp_matches": icp_matches,
                "high_priority": high,
            }
        )


# ------------------- Export -------------------
class LeadExportView(APIView):
    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        queryset = (
            Lead.objects.filter(project=project)
            .select_related("score_detail")
            .prefetch_related("contacts", "signals")
        )
        # Apply filters from request GET
        for key, value in request.GET.items():
            if key.endswith("__gte"):
                field = key[:-4]
                queryset = queryset.filter(**{field + "__gte": value})
            elif key.endswith("__lte"):
                field = key[:-4]
                queryset = queryset.filter(**{field + "__lte": value})
            elif key in ["industry", "country", "priority"]:
                queryset = queryset.filter(**{key: value})
            elif key == "hiring" and value.lower() == "true":
                queryset = queryset.filter(hiring=True)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="leads_{project.name}.csv"'
        )
        writer = csv.writer(response)
        writer.writerow(
            [
                "Company",
                "Website",
                "Contact",
                "Email",
                "Score",
                "Priority",
                "Signals",
                "Recommended Action",
            ]
        )
        for lead in queryset:
            contact = lead.contacts.first()
            signals = [s.type for s in lead.signals.all()]
            action = getattr(lead.score_detail, "recommended_action", "")
            writer.writerow(
                [
                    lead.company_name,
                    lead.website,
                    contact.name if contact else "",
                    contact.email if contact else "",
                    lead.lead_score,
                    lead.priority,
                    ", ".join(signals),
                    action,
                ]
            )
        return response
