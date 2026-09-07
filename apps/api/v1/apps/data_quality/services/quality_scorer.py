from .validator import is_valid_email


def compute_data_quality_score(lead):
    # lead is a Lead instance
    score = 0
    # Email validity (20)
    if any(
        contact.email and is_valid_email(contact.email)
        for contact in lead.contacts.all()
    ):
        score += 20
    # Company info (20)
    if lead.company_name and lead.website:
        score += 20
    # Contact info (15)
    if lead.contacts.exists():
        score += 15
    # Website (20)
    if lead.website:
        score += 20
    # Completeness (9)
    filled = sum(
        1
        for field in ["industry", "country", "employees", "revenue"]
        if getattr(lead, field)
    )
    score += int((filled / 4) * 9)
    return min(score, 100)
