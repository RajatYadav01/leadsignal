from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    ICPDetailView,
    LeadListView,
    LeadDetailView,
    LeadImportView,
    AnalyzeView,
    DashboardView,
    LeadExportView,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")

urlpatterns = [
    path("", include(router.urls)),
    # ICP
    path("projects/<int:project_id>/icp/", ICPDetailView.as_view(), name="icp-detail"),
    # Leads
    path("projects/<int:project_id>/leads/", LeadListView.as_view(), name="lead-list"),
    path("leads/<int:pk>/", LeadDetailView.as_view(), name="lead-detail"),
    # Import
    path(
        "projects/<int:project_id>/leads/import/",
        LeadImportView.as_view(),
        name="lead-import",
    ),
    # Analysis
    path("projects/<int:project_id>/analyze/", AnalyzeView.as_view(), name="analyze"),
    # Dashboard
    path(
        "projects/<int:project_id>/dashboard/",
        DashboardView.as_view(),
        name="dashboard",
    ),
    # Export
    path(
        "projects/<int:project_id>/leads/export/",
        LeadExportView.as_view(),
        name="lead-export",
    ),
]
