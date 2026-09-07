from django.db import models
from apps.projects.models import Project


class Lead(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="leads")
    company_name = models.CharField(max_length=255)
    normalized_company_name = models.CharField(max_length=255, blank=True)
    website = models.URLField(max_length=255, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    employees = models.IntegerField(null=True, blank=True)
    revenue = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    technologies = models.JSONField(default=list)
    hiring = models.BooleanField(default=False)
    employee_growth = models.FloatField(null=True, blank=True)
    funding_date = models.DateField(null=True, blank=True)
    data_quality_score = models.IntegerField(default=0)
    lead_score = models.IntegerField(default=0)
    priority = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "lead_score"]),
            models.Index(fields=["project", "priority"]),
            models.Index(fields=["project", "industry"]),
            models.Index(fields=["project", "country"]),
            models.Index(fields=["normalized_company_name"]),
            models.Index(fields=["website"]),
        ]


class Contact(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True)
    normalized_title = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    linkedin_url = models.URLField(blank=True)


class LeadSignal(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="signals")
    type = models.CharField(max_length=50)
    value = models.JSONField(default=dict)
    confidence = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)


class LeadScore(models.Model):
    lead = models.OneToOneField(
        Lead, on_delete=models.CASCADE, related_name="score_detail"
    )
    total_score = models.IntegerField()
    industry_score = models.IntegerField()
    employee_score = models.IntegerField()
    revenue_score = models.IntegerField()
    geography_score = models.IntegerField()
    technology_score = models.IntegerField()
    signal_score = models.IntegerField()
    persona_score = models.IntegerField()
    data_quality_score = models.IntegerField()
    explanation = models.TextField(blank=True)
    recommended_action = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ImportJob(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="imports"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
    )
    total_rows = models.IntegerField(default=0)
    valid_rows = models.IntegerField(default=0)
    duplicate_rows = models.IntegerField(default=0)
    invalid_rows = models.IntegerField(default=0)
    errors = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
