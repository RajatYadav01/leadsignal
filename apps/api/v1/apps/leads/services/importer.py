from django.utils import timezone
from apps.leads.models import ImportJob, Lead, Contact
from apps.data_quality.services.normalizer import (
    normalize_company,
    normalize_country,
    normalize_title,
)
from apps.data_quality.services.deduplicator import find_duplicates
from apps.data_quality.services.validator import validate_lead_row


def import_csv(file, project):
    import csv
    import io

    job = ImportJob.objects.create(project=project, status="processing")
    rows = []
    errors = []
    # Read CSV
    decoded = file.read().decode("utf-8")
    csv_reader = csv.DictReader(io.StringIO(decoded))
    for idx, row in enumerate(csv_reader, start=1):
        validation_errors = validate_lead_row(row)
        if validation_errors:
            errors.append({"row": idx, "errors": validation_errors})
            continue
        # Normalize
        row["normalized_company_name"] = normalize_company(row.get("company_name", ""))
        row["country"] = normalize_country(row.get("country", ""))
        rows.append(row)

    job.total_rows = len(rows) + len(errors)
    job.invalid_rows = len(errors)

    # Deduplicate (based on normalized data)
    dup_indices = find_duplicates(rows)
    job.duplicate_rows = len(dup_indices)

    # Save valid leads (skip duplicates)
    leads_to_create = []
    contacts_to_create = []
    for idx, row in enumerate(rows):
        if idx in dup_indices:
            continue
        # Create lead
        lead_data = {
            "project": project,
            "company_name": row.get("company_name"),
            "normalized_company_name": row.get("normalized_company_name"),
            "website": row.get("website", ""),
            "industry": row.get("industry", ""),
            "country": row.get("country", ""),
            "employees": int(row["employees"]) if row.get("employees") else None,
            "revenue": float(row["revenue"]) if row.get("revenue") else None,
            "technologies": [
                t.strip() for t in row.get("technologies", "").split(",") if t.strip()
            ],
            "hiring": row.get("hiring", "").lower() in ["true", "1", "yes"],
            "employee_growth": float(row["employee_growth"])
            if row.get("employee_growth")
            else None,
            # funding_date parsing omitted for brevity
        }
        lead = Lead(**lead_data)
        leads_to_create.append(lead)

    # Bulk create leads
    Lead.objects.bulk_create(leads_to_create)
    # After bulk create, need to get them to add contacts
    # Simpler: create leads one by one or use bulk with returning IDs not supported in all DBs
    # We'll loop and save individually for MVP (5k leads is fine)
    # Actually, we can bulk create and then fetch them by company_name+project to add contacts
    # For simplicity, we do a second pass with saving each lead
    # (Optimization: use bulk_create with ignore_conflicts=False, then fetch)
    leads_created = []
    for idx, row in enumerate(rows):
        if idx in dup_indices:
            continue
        lead = Lead(
            project=project,
            company_name=row["company_name"],
            normalized_company_name=row.get("normalized_company_name", ""),
            website=row.get("website", ""),
            industry=row.get("industry", ""),
            country=row.get("country", ""),
            employees=int(row["employees"]) if row.get("employees") else None,
            revenue=float(row["revenue"]) if row.get("revenue") else None,
            technologies=[
                t.strip() for t in row.get("technologies", "").split(",") if t.strip()
            ],
            hiring=row.get("hiring", "").lower() in ["true", "1", "yes"],
            employee_growth=float(row["employee_growth"])
            if row.get("employee_growth")
            else None,
        )
        lead.save()
        leads_created.append(lead)
        # Add contact if present
        if row.get("contact_name") or row.get("email"):
            Contact.objects.create(
                lead=lead,
                name=row.get("contact_name", ""),
                title=row.get("contact_title", ""),
                normalized_title=normalize_title(row.get("contact_title", "")),
                email=row.get("email", ""),
                linkedin_url=row.get("linkedin_url", ""),
            )

    job.valid_rows = len(leads_created)
    job.status = "completed"
    job.completed_at = timezone.now()
    job.errors = errors
    job.save()
    return job
