from apps.data_quality.services.normalizer import normalize_title


def get_recommendation(lead, signals, icp):
    # Rule-based
    hiring_signal = any(s.type == "HIRING" for s in signals)
    vp_sales = any("vp sales" in normalize_title(c.title) for c in lead.contacts.all())
    founder = any(
        "founder" in normalize_title(c.title) or "ceo" in normalize_title(c.title)
        for c in lead.contacts.all()
    )
    if hiring_signal and vp_sales:
        return "Contact VP Sales – emphasize sales team scaling needs."
    if founder and lead.employees and lead.employees < 100:
        return "Contact Founder – likely involved in early purchasing decisions."
    if lead.lead_score >= 80:
        return "High-priority lead – research further and reach out."
    return "Research company before outreach."
