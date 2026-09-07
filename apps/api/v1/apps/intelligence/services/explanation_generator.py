import os
import requests
from typing import Dict, List
from django.conf import settings


def generate_explanation(
    lead, icp, score_breakdown: Dict[str, int], signals: List
) -> str:
    """
    Generate a natural-language explanation for a lead's score.
    Tries OpenRouter first; falls back to a template-based explanation.
    """
    # Build the structured explanation (template-based) as fallback
    lines = []
    if score_breakdown.get("industry", 0) > 0:
        lines.append(f"✓ Matches target {', '.join(icp.industries)} industry.")
    if score_breakdown.get("employees", 0) > 0:
        lines.append(f"✓ {lead.employees} employees — within target range.")
    if score_breakdown.get("revenue", 0) > 0:
        lines.append(f"✓ Revenue fits the ICP criteria.")
    if score_breakdown.get("geography", 0) > 0:
        lines.append(f"✓ Located in {lead.country or 'target country'}.")
    if score_breakdown.get("technology", 0) > 0:
        techs = (
            ", ".join(lead.technologies)
            if lead.technologies
            else "relevant technologies"
        )
        lines.append(f"✓ Uses {techs}.")
    if score_breakdown.get("persona", 0) > 0:
        lines.append(f"✓ Contact role matches target persona.")
    if score_breakdown.get("signals", 0) > 0:
        signal_descriptions = []
        for sig in signals:
            if sig.type == "HIRING":
                signal_descriptions.append("actively hiring")
            elif sig.type == "EMPLOYEE_GROWTH":
                growth = sig.value.get("growth_percent", "")
                signal_descriptions.append(
                    f"{growth}% headcount growth" if growth else "growing headcount"
                )
            elif sig.type == "FUNDING":
                signal_descriptions.append("recently raised funding")
            elif sig.type == "TECHNOLOGY_MATCH":
                signal_descriptions.append("uses a relevant technology")
        if signal_descriptions:
            lines.append(f"✓ Signals: {', '.join(signal_descriptions)}.")
    if score_breakdown.get("quality", 0) > 0:
        lines.append(f"✓ Data quality is good.")

    if not lines:
        lines.append("No strong matches found – may not be a good fit.")
    fallback_explanation = " ".join(lines)

    # Try OpenRouter if API key is provided
    api_key = getattr(settings, "OPENROUTER_API_KEY", None)

    if not api_key:
        return fallback_explanation

    # Prepare the prompt
    prompt = f"""
You are a sales intelligence assistant. 
Given the following lead information and ICP (Ideal Customer Profile) criteria, produce a concise, natural-language explanation (1–2 sentences) of why this lead is a good or poor prospect. Highlight specific matches and signals.

Lead:
- Company: {lead.company_name}
- Industry: {lead.industry or "unknown"}
- Employees: {lead.employees or "unknown"}
- Revenue: {lead.revenue or "unknown"}
- Country: {lead.country or "unknown"}
- Technologies: {", ".join(lead.technologies) if lead.technologies else "none"}

ICP Criteria:
- Industries: {", ".join(icp.industries) if icp.industries else "any"}
- Countries: {", ".join(icp.countries) if icp.countries else "any"}
- Employee range: {icp.min_employees or "any"} – {icp.max_employees or "any"}
- Revenue range: {icp.min_revenue or "any"} – {icp.max_revenue or "any"}
- Technologies: {", ".join(icp.technologies) if icp.technologies else "any"}
- Target titles: {", ".join(icp.target_titles) if icp.target_titles else "any"}

Score breakdown (out of 100):
- Industry fit: {score_breakdown.get("industry", 0)}/20
- Employee fit: {score_breakdown.get("employees", 0)}/10
- Revenue fit: {score_breakdown.get("revenue", 0)}/15
- Geography fit: {score_breakdown.get("geography", 0)}/10
- Technology fit: {score_breakdown.get("technology", 0)}/15
- Buying signals: {score_breakdown.get("signals", 0)}/15
- Persona fit: {score_breakdown.get("persona", 0)}/5
- Data quality: {score_breakdown.get("quality", 0)}/10
Total score: {sum(score_breakdown.values())}/100

Signals detected:
{", ".join([f"{sig.type}: {sig.value}" for sig in signals]) if signals else "None"}

Explanation:
"""

    try:
        response = requests.post(
            settings.OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                # Optional: add HTTP-Referer and X-Title for OpenRouter analytics
                "HTTP-Referer": settings.APP_HOST_URL,
                "X-Title": "LeadSignal",
            },
            json={
                "model": settings.OPENROUTER_EXPLANATION_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful sales intelligence assistant.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.5,
                "max_tokens": 80,
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            ai_explanation = data["choices"][0]["message"]["content"].strip()
            # If the explanation is too long, truncate
            if len(ai_explanation) > 500:
                ai_explanation = ai_explanation[:500] + "..."
            return ai_explanation
        else:
            return fallback_explanation
    except Exception as e:
        # Log error (optional) and fallback
        print(f"OpenRouter error: {e}")
        return fallback_explanation
