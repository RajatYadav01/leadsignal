from .normalizer import extract_domain


def find_duplicates(leads_data):
    """
    leads_data: list of dicts with keys:
        'normalized_company_name', 'country', 'website', 'email'

    Returns a set of indices that are duplicates.
    """
    seen_domains = set()
    seen_companies = set()
    seen_emails = set()
    duplicates = set()

    for idx, lead in enumerate(leads_data):
        website = lead.get("website", "")
        domain = extract_domain(website) if website else ""

        company_name = lead.get("normalized_company_name", "")
        country = lead.get("country", "")
        email = lead.get("email", "")

        is_duplicate = False

        if domain and domain in seen_domains:
            is_duplicate = True

        company_key = (company_name, country)
        if company_name and company_key in seen_companies:
            is_duplicate = True

        if email and email in seen_emails:
            is_duplicate = True

        if is_duplicate:
            duplicates.add(idx)

        if domain:
            seen_domains.add(domain)

        if company_name:
            seen_companies.add(company_key)

        if email:
            seen_emails.add(email)

    return duplicates
