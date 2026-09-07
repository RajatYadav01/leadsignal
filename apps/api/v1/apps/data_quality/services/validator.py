import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def is_valid_email(email):
    return bool(EMAIL_REGEX.match(email))


def validate_lead_row(row):
    errors = []
    if not row.get("company_name"):
        errors.append("Missing company_name")
    if not row.get("website"):
        errors.append("Missing website")
    if row.get("email") and not is_valid_email(row["email"]):
        errors.append("Invalid email format")
    # Add other checks: employees numeric, revenue numeric, etc.
    return errors
