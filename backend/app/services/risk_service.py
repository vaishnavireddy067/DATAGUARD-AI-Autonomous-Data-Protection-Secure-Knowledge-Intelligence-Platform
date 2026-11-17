from typing import List, Dict, Any, Tuple

def calculate_risk(findings: List[Dict[str, Any]]) -> Tuple[float, str, str]:
    """
    Computes a transparent rule-based risk score, risk level, and rationale.
    Returns:
        (risk_score, risk_level, risk_explanation)
    """
    if not findings:
        return 0.0, "LOW", "Document contains no detected sensitive personal or financial identifiers. Risk level is minimal."

    base_score = 0.0
    categories = set()
    total_findings_count = 0
    high_critical_count = 0
    reasons = []

    for f in findings:
        dtype = f["data_type"]
        count = f["count"]
        level = f["risk_level"]
        categories.add(dtype)
        total_findings_count += count

        if dtype == "EMAIL":
            pts = min(count * 5.0, 20.0)
            base_score += pts
            reasons.append(f"{count} email address(es) (+{pts:.1f} pts)")
        elif dtype == "PHONE_NUMBER":
            pts = min(count * 6.0, 25.0)
            base_score += pts
            reasons.append(f"{count} phone number(s) (+{pts:.1f} pts)")
        elif dtype == "PAN_CARD":
            pts = min(count * 15.0, 45.0)
            base_score += pts
            high_critical_count += count
            reasons.append(f"{count} PAN identifier(s) (+{pts:.1f} pts)")
        elif dtype == "BANK_ACCOUNT":
            pts = min(count * 18.0, 50.0)
            base_score += pts
            high_critical_count += count
            reasons.append(f"{count} bank account number(s) (+{pts:.1f} pts)")
        elif dtype == "AADHAAR_SYNTHETIC":
            pts = min(count * 25.0, 60.0)
            base_score += pts
            high_critical_count += count
            reasons.append(f"{count} synthetic national ID pattern(s) (+{pts:.1f} pts)")
        elif dtype == "SENSITIVE_COLUMN":
            pts = min(count * 10.0, 30.0)
            base_score += pts
            high_critical_count += count
            reasons.append(f"{count} sensitive dataset column(s) (+{pts:.1f} pts)")

    # Category diversity multiplier (exposure across multiple sensitive vectors)
    if len(categories) >= 3:
        diversity_pts = 15.0
        base_score += diversity_pts
        reasons.append(f"Multi-category risk factor: {len(categories)} distinct sensitive vectors (+{diversity_pts:.1f} pts)")
    elif len(categories) == 2:
        diversity_pts = 8.0
        base_score += diversity_pts
        reasons.append(f"Combined risk factor: 2 sensitive vectors (+{diversity_pts:.1f} pts)")

    # Volume multiplier
    if total_findings_count > 10:
        vol_pts = 10.0
        base_score += vol_pts
        reasons.append(f"High volume exposure (>10 entities, +{vol_pts:.1f} pts)")

    risk_score = round(min(max(base_score, 10.0), 100.0), 1)

    # Determine risk level
    if risk_score >= 80.0 or high_critical_count >= 3 or "AADHAAR_SYNTHETIC" in categories:
        risk_level = "CRITICAL"
        category_summary = f"CRITICAL risk assessed ({risk_score}/100) due to high concentration of government/financial identifiers or high finding volume."
    elif risk_score >= 55.0 or high_critical_count >= 1:
        risk_level = "HIGH"
        category_summary = f"HIGH risk assessed ({risk_score}/100) due to financial/taxation records or multi-category personal data."
    elif risk_score >= 25.0:
        risk_level = "MEDIUM"
        category_summary = f"MEDIUM risk assessed ({risk_score}/100) due to personal contact data (emails, phone numbers)."
    else:
        risk_level = "LOW"
        category_summary = f"LOW risk assessed ({risk_score}/100) with minimal sensitive exposure."

    risk_explanation = f"{category_summary} Factors: {'; '.join(reasons)}."
    return risk_score, risk_level, risk_explanation

