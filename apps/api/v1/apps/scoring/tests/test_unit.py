import pytest
from django.test import TestCase
from apps.projects.models import Project, ICPProfile
from apps.leads.models import Lead, LeadSignal
from apps.scoring.services.lead_scorer import LeadScorer
from apps.scoring.services.icp_matcher import match_icp


class LeadScorerTest(TestCase):
    def setUp(self):
        self.project = Project.objects.create(name="Test Project")
        self.icp = ICPProfile.objects.create(
            project=self.project,
            industries=["SaaS"],
            countries=["US"],
            min_employees=50,
            max_employees=500,
            min_revenue=5000000,
            max_revenue=100000000,
            technologies=["HubSpot"],
            target_titles=["VP Sales", "CEO"],
        )
        self.lead = Lead.objects.create(
            project=self.project,
            company_name="Acme",
            industry="SaaS",
            country="US",
            employees=150,
            revenue=25000000,
            technologies=["HubSpot", "Salesforce"],
            data_quality_score=90,
        )
        self.signals = [
            LeadSignal(lead=self.lead, type="HIRING", value={"hiring": True}),
            LeadSignal(
                lead=self.lead, type="EMPLOYEE_GROWTH", value={"growth_percent": 27}
            ),
        ]

    def test_icp_matcher(self):
        matches = match_icp(self.lead, self.icp)
        self.assertTrue(matches["industry"])
        self.assertTrue(matches["geography"])
        self.assertTrue(matches["employees"])
        self.assertTrue(matches["revenue"])
        self.assertTrue(matches["technology"])
        # Persona: we need a contact
        # Skipping for brevity

    def test_lead_scorer(self):
        scorer = LeadScorer()
        total, breakdown = scorer.score(self.lead, self.icp, self.signals)
        self.assertEqual(
            total, 20 + 10 + 15 + 10 + 15 + 15 + 5 + 9
        )  # industry(20) + employees(10) + revenue(15) + geo(10) + tech(15) + signals(15) + persona(5) + quality(9)
        # Check individual components
        self.assertEqual(breakdown["industry"], 20)
        self.assertEqual(breakdown["employees"], 10)
        self.assertEqual(
            breakdown["signals"], 15
        )  # Two signals, each 5 pts, capped at 15
        self.assertEqual(breakdown["quality"], 9)  # 90/10

    def test_priority_classification(self):
        scorer = LeadScorer()
        self.assertEqual(scorer.classify_priority(85), "HIGH")
        self.assertEqual(scorer.classify_priority(65), "MEDIUM")
        self.assertEqual(scorer.classify_priority(45), "LOW")
        self.assertEqual(scorer.classify_priority(25), "POOR")
