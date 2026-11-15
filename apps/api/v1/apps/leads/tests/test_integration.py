from apps.leads.models import Contact, ImportJob, Lead, LeadScore, LeadSignal
from apps.projects.models import ICPProfile, Project
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class LeadAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(name="Test Project")
        # The Project post-save signal creates its ICP profile automatically.
        self.icp = self.project.icp
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


class ProjectDeletionAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(name="Project to delete")
        self.lead = Lead.objects.create(
            project=self.project,
            company_name="Acme",
            lead_score=85,
            priority="HIGH",
        )
        self.contact = Contact.objects.create(
            lead=self.lead,
            name="John Smith",
            email="john@acme.com",
        )
        self.signal = LeadSignal.objects.create(
            lead=self.lead,
            type="HIRING",
            value={"description": "Recently hiring"},
        )
        self.score = LeadScore.objects.create(
            lead=self.lead,
            total_score=85,
            industry_score=10,
            employee_score=10,
            revenue_score=10,
            geography_score=10,
            technology_score=10,
            signal_score=10,
            persona_score=10,
            data_quality_score=15,
        )
        self.import_job = ImportJob.objects.create(
            project=self.project,
            status="completed",
            total_rows=1,
            valid_rows=1,
        )

    def test_delete_project_cascades_to_all_associated_data(self):
        project_id = self.project.id
        url = reverse("project-detail", kwargs={"pk": project_id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Project.objects.filter(id=project_id).exists())
        self.assertFalse(ICPProfile.objects.filter(project_id=project_id).exists())
        self.assertFalse(Lead.objects.filter(project_id=project_id).exists())
        self.assertFalse(Contact.objects.filter(id=self.contact.id).exists())
        self.assertFalse(LeadSignal.objects.filter(id=self.signal.id).exists())
        self.assertFalse(LeadScore.objects.filter(id=self.score.id).exists())
        self.assertFalse(ImportJob.objects.filter(id=self.import_job.id).exists())

    def test_delete_unknown_project_returns_not_found(self):
        url = reverse("project-detail", kwargs={"pk": 999999})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, 404)


class ProjectUpdateAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            name="Original project",
            description="Original description",
        )

    def test_update_project_name_and_description(self):
        url = reverse("project-detail", kwargs={"pk": self.project.id})
        data = {
            "name": "Updated project",
            "description": "Updated description",
        }

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, 200)
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, "Updated project")
        self.assertEqual(self.project.description, "Updated description")
        self.assertEqual(response.data["name"], "Updated project")
        self.assertEqual(response.data["description"], "Updated description")

    def test_update_project_rejects_blank_name(self):
        url = reverse("project-detail", kwargs={"pk": self.project.id})

        response = self.client.patch(url, {"name": "   "}, format="json")

        self.assertEqual(response.status_code, 400)
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, "Original project")
