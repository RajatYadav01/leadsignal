from datetime import datetime, timedelta
from apps.leads.models import LeadSignal


def detect_signals(lead, icp):
    signals = []
    if lead.hiring:
        signals.append(LeadSignal(lead=lead, type="HIRING", value={"hiring": True}))
    if lead.employee_growth and lead.employee_growth >= 20:
        signals.append(
            LeadSignal(
                lead=lead,
                type="EMPLOYEE_GROWTH",
                value={"growth_percent": lead.employee_growth},
            )
        )
    if lead.funding_date and (datetime.now().date() - lead.funding_date) < timedelta(
        days=365
    ):
        signals.append(
            LeadSignal(
                lead=lead,
                type="FUNDING",
                value={"funding_date": lead.funding_date.isoformat()},
            )
        )
    # Technology match (if already matched via ICP, we can add it as a signal)
    if any(tech in icp.technologies for tech in lead.technologies):
        signals.append(
            LeadSignal(
                lead=lead,
                type="TECHNOLOGY_MATCH",
                value={
                    "matched_techs": [
                        t for t in lead.technologies if t in icp.technologies
                    ]
                },
            )
        )
    return signals
