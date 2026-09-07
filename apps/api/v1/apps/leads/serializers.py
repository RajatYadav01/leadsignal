from rest_framework import serializers
from apps.projects.models import Project, ICPProfile
from .models import Lead, Contact, LeadSignal, LeadScore, ImportJob


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ICPProfileSerializer(serializers.ModelSerializer):
    # Explicitly define fields to allow null and make them optional
    min_employees = serializers.IntegerField(allow_null=True, required=False)
    max_employees = serializers.IntegerField(allow_null=True, required=False)
    min_revenue = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )
    max_revenue = serializers.DecimalField(
        max_digits=15, decimal_places=2, allow_null=True, required=False
    )

    class Meta:
        model = ICPProfile
        fields = [
            "id",
            "industries",
            "countries",
            "min_employees",
            "max_employees",
            "min_revenue",
            "max_revenue",
            "technologies",
            "target_titles",
        ]
        read_only_fields = ["id"]


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ["id", "name", "title", "normalized_title", "email", "linkedin_url"]


class LeadSignalSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSignal
        fields = ["id", "type", "value", "confidence", "created_at"]


class LeadScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadScore
        fields = [
            "total_score",
            "industry_score",
            "employee_score",
            "revenue_score",
            "geography_score",
            "technology_score",
            "signal_score",
            "persona_score",
            "data_quality_score",
            "explanation",
            "recommended_action",
            "created_at",
        ]


class LeadListSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    signals = LeadSignalSerializer(many=True, read_only=True)
    score_detail = LeadScoreSerializer(read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "company_name",
            "industry",
            "employees",
            "revenue",
            "country",
            "lead_score",
            "priority",
            "contacts",
            "signals",
            "score_detail",
            "created_at",
        ]


class LeadDetailSerializer(LeadListSerializer):
    # Same as list but with all fields
    class Meta(LeadListSerializer.Meta):
        fields = LeadListSerializer.Meta.fields + [
            "normalized_company_name",
            "website",
            "technologies",
            "hiring",
            "employee_growth",
            "funding_date",
            "data_quality_score",
        ]


class ImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportJob
        fields = [
            "id",
            "status",
            "total_rows",
            "valid_rows",
            "duplicate_rows",
            "invalid_rows",
            "errors",
            "created_at",
            "completed_at",
        ]
