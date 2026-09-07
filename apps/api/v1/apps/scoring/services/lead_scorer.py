from .icp_matcher import match_icp


class LeadScorer:
    WEIGHTS = {
        "industry": 20,
        "employees": 10,
        "revenue": 15,
        "geography": 10,
        "technology": 15,
        "signals": 15,
        "persona": 5,
        "quality": 10,
    }

    def score(self, lead, icp, signals):
        matches = match_icp(lead, icp)
        results = {}
        results["industry"] = self.WEIGHTS["industry"] if matches["industry"] else 0
        results["employees"] = self.WEIGHTS["employees"] if matches["employees"] else 0
        results["revenue"] = self.WEIGHTS["revenue"] if matches["revenue"] else 0
        results["geography"] = self.WEIGHTS["geography"] if matches["geography"] else 0
        results["technology"] = (
            self.WEIGHTS["technology"] if matches["technology"] else 0
        )
        results["persona"] = self.WEIGHTS["persona"] if matches["persona"] else 0
        # Signals: up to 15, each signal gives 5 pts, capped
        signal_score = min(
            15,
            len(
                [
                    s
                    for s in signals
                    if s.type
                    in ["HIRING", "EMPLOYEE_GROWTH", "FUNDING", "TECHNOLOGY_MATCH"]
                ]
            )
            * 5,
        )
        results["signals"] = signal_score
        # Data quality: scale from 0-100 to 0-10
        results["quality"] = int(lead.data_quality_score / 10)
        total = sum(results.values())
        return total, results

    def classify_priority(self, score):
        if score >= 80:
            return "HIGH"
        elif score >= 60:
            return "MEDIUM"
        elif score >= 40:
            return "LOW"
        return "POOR"
