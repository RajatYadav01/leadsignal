from apps.data_quality.services.quality_scorer import compute_data_quality_score
from apps.scoring.services.lead_scorer import LeadScorer
from apps.intelligence.services.signal_detector import detect_signals
from apps.intelligence.services.recommendation_engine import get_recommendation
from apps.intelligence.services.explanation_generator import generate_explanation
from apps.leads.models import Lead, LeadScore, LeadSignal


def run_analysis(project):
    icp = project.icp
    for lead in project.leads.all():
        # Data quality
        lead.data_quality_score = compute_data_quality_score(lead)
        lead.save()

        # Detect signals (create LeadSignal objects)
        signals = detect_signals(lead, icp)
        for sig in signals:
            sig.save()

        # Score
        scorer = LeadScorer()
        total, breakdown = scorer.score(lead, icp, signals)
        lead.lead_score = total
        lead.priority = scorer.classify_priority(total)
        lead.save()

        # Create LeadScore
        LeadScore.objects.update_or_create(
            lead=lead,
            defaults={
                "total_score": total,
                "industry_score": breakdown["industry"],
                "employee_score": breakdown["employees"],
                "revenue_score": breakdown["revenue"],
                "geography_score": breakdown["geography"],
                "technology_score": breakdown["technology"],
                "signal_score": breakdown["signals"],
                "persona_score": breakdown["persona"],
                "data_quality_score": breakdown["quality"],
                "recommended_action": get_recommendation(lead, signals, icp),
                "explanation": generate_explanation(lead, icp, breakdown, signals),
            },
        )
