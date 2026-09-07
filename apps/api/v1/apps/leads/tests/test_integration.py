import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.projects.models import Project, ICPProfile
from apps.leads.models import Lead, Contact


class LeadAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(name="Test Project")
        self.icp = ICPProfile.objects.create(project=self.project)
        self.lead = Lead.objects.create(
            project=self.project, company_name="Acme", lead_score=85, priority="HIGH"
        )
        self.contact = Contact.objects.create(
            lead=self.lead, name="John Smith", email="john@acme.com"
        )

    def test_dashboard_view(self):
        url = reverse("dashboard", kwargs={"project_id": self.project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_leads"], 1)
        self.assertEqual(data["high_priority"], 1)

    def test_lead_list(self):
        url = reverse("lead-list", kwargs={"project_id": self.project.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["company_name"], "Acme")

    def test_lead_detail(self):
        url = reverse("lead-detail", kwargs={"pk": self.lead.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["company_name"], "Acme")
        self.assertEqual(response.data["contacts"][0]["name"], "John Smith")

    def test_icp_update(self):
        url = reverse("icp-detail", kwargs={"project_id": self.project.id})
        data = {
            "industries": ["SaaS", "Fintech"],
            "countries": ["US", "UK"],
            "min_employees": 10,
            "max_employees": 1000,
            "min_revenue": 1000000,
            "max_revenue": 50000000,
            "technologies": ["HubSpot", "Salesforce"],
            "target_titles": ["CEO", "VP"],
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, 200)
        self.icp.refresh_from_db()
        self.assertEqual(self.icp.industries, ["SaaS", "Fintech"])

    # Import test requires file upload; we'll skip for brevity.
