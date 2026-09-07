from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ICPProfile(models.Model):
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name="icp"
    )
    industries = models.JSONField(default=list)  # e.g., ["SaaS"]
    countries = models.JSONField(default=list)  # e.g., ["US"]
    min_employees = models.IntegerField(null=True, blank=True)
    max_employees = models.IntegerField(null=True, blank=True)
    min_revenue = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    max_revenue = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    technologies = models.JSONField(default=list)  # e.g., ["HubSpot"]
    target_titles = models.JSONField(default=list)  # e.g., ["CEO", "VP Sales"]
