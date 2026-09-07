import re
from urllib.parse import urlparse


def normalize_company(name: str) -> str:
    if not name:
        return ""
    # Remove legal suffixes, extra spaces
    name = re.sub(r"\b(inc|llc|ltd|corp|corporation|co)\b\.?", "", name, flags=re.I)
    name = " ".join(name.split())
    return name.strip().lower()


def normalize_country(country: str) -> str:
    if not country:
        return ""
    country = country.strip()
    mapping = {"usa": "United States", "us": "United States", "uk": "United Kingdom"}
    return mapping.get(country.lower(), country.title())


def normalize_title(title: str) -> str:
    if not title:
        return ""
    # Simple: lower, remove punctuation
    title = title.lower()
    title = re.sub(r"[^\w\s]", "", title)
    return title.strip()


def extract_domain(website: str) -> str:
    if not website:
        return ""
    parsed = urlparse(website if "://" in website else "http://" + website)
    domain = parsed.netloc or parsed.path
    domain = domain.replace("www.", "").split("/")[0]
    return domain.lower()
