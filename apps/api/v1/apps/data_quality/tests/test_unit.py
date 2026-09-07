import pytest
from apps.data_quality.services.normalizer import (
    normalize_company,
    normalize_country,
    normalize_title,
    extract_domain,
)
from apps.data_quality.services.deduplicator import find_duplicates
from apps.data_quality.services.validator import is_valid_email, validate_lead_row


class TestNormalizer:
    def test_normalize_company(self):
        assert normalize_company("Acme Inc.") == "acme"
        assert normalize_company("Beta Corp") == "beta"
        assert normalize_company("Gamma LLC") == "gamma"
        assert normalize_company("") == ""

    def test_normalize_country(self):
        assert normalize_country("USA") == "United States"
        assert normalize_country("us") == "United States"
        assert normalize_country("UK") == "United Kingdom"
        assert normalize_country("Canada") == "Canada"

    def test_normalize_title(self):
        assert normalize_title("VP of Sales") == "vp of sales"
        assert normalize_title("CEO") == "ceo"
        assert normalize_title("") == ""

    def test_extract_domain(self):
        assert extract_domain("https://acme.com") == "acme.com"
        assert extract_domain("http://www.beta.io") == "beta.io"
        assert extract_domain("gamma.com/path") == "gamma.com"
        assert extract_domain("") == ""


class TestDeduplicator:
    def test_find_duplicates(self):
        leads = [
            {
                "normalized_company_name": "acme",
                "country": "us",
                "website": "acme.com",
                "email": "john@acme.com",
            },
            {
                "normalized_company_name": "acme",
                "country": "us",
                "website": "acme.com",
                "email": "jane@acme.com",
            },
            {
                "normalized_company_name": "beta",
                "country": "uk",
                "website": "beta.co.uk",
                "email": "sarah@beta.com",
            },
        ]
        dup_ids = find_duplicates(leads)
        # Expect first two are duplicates (same domain)
        assert 1 in dup_ids
        assert 0 not in dup_ids
        assert 2 not in dup_ids


class TestValidator:
    def test_is_valid_email(self):
        assert is_valid_email("test@example.com") is True
        assert is_valid_email("invalid") is False
        assert is_valid_email("missing@tld") is False

    def test_validate_lead_row(self):
        row = {"company_name": "Acme", "website": "acme.com", "email": "john@acme.com"}
        errors = validate_lead_row(row)
        assert errors == []

        row_missing = {"website": "acme.com"}
        errors = validate_lead_row(row_missing)
        assert "Missing company_name" in errors

        row_invalid_email = {
            "company_name": "Acme",
            "website": "acme.com",
            "email": "invalid",
        }
        errors = validate_lead_row(row_invalid_email)
        assert "Invalid email format" in errors
