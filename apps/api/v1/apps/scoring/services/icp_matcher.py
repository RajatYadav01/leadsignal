from apps.data_quality.services.normalizer import normalize_title


def match_icp(lead, icp):
    """Return dict of boolean matches."""
    matches = {}
    matches["industry"] = lead.industry in icp.industries
    matches["geography"] = lead.country in icp.countries
    matches["employees"] = (
        (
            (icp.min_employees is None or lead.employees >= icp.min_employees)
            and (icp.max_employees is None or lead.employees <= icp.max_employees)
        )
        if lead.employees is not None
        else False
    )
    matches["revenue"] = (
        (
            (icp.min_revenue is None or lead.revenue >= icp.min_revenue)
            and (icp.max_revenue is None or lead.revenue <= icp.max_revenue)
        )
        if lead.revenue is not None
        else False
    )
    matches["technology"] = any(tech in icp.technologies for tech in lead.technologies)
    # Persona: any contact title matches icp.target_titles (fuzzy)
    persona_match = False
    for contact in lead.contacts.all():
        norm = normalize_title(contact.title)
        if any(
            norm in normalize_title(t) or normalize_title(t) in norm
            for t in icp.target_titles
        ):
            persona_match = True
            break
    matches["persona"] = persona_match
    return matches
