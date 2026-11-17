import re
from typing import List, Dict, Any, Tuple

# Sensitive column detection keywords
SENSITIVE_COLUMN_KEYWORDS = [
    "email", "phone", "mobile", "contact", "salary", "compensation", "account",
    "acc_no", "pan", "aadhaar", "ssn", "tax", "dob", "birth", "credit_card",
    "password", "secret", "token", "address"
]

# Regular expression patterns for sensitive data
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b')
PHONE_REGEX = re.compile(r'(?:(?:\+|00)91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b')
PAN_REGEX = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b')
# Aadhaar pattern (12 digits, often formatted as 4-4-4, starting with 2-9)
# STRICT NOTE: For demo/synthetic datasets only; strictly non-regulatory.
AADHAAR_REGEX = re.compile(r'\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b')
BANK_ACC_REGEX = re.compile(r'(?:acc(?:ount)?[\s#:\.]*(?:no\.?|num(?:ber)?)?[\s#:\.]*|a\/c[\s#:\.]*|bank[\s#:\.]*)(\b\d{9,18}\b)', re.IGNORECASE)

def mask_email(email: str) -> str:
    """Mask email: vaishnavi@gmail.com -> vai***@gmail.com"""
    if "@" not in email:
        return "[MASKED_EMAIL]"
    parts = email.split("@")
    name, domain = parts[0], parts[1]
    if len(name) <= 3:
        masked_name = name[0] + "***"
    else:
        masked_name = name[:3] + "***"
    return f"{masked_name}@{domain}"

def mask_phone(phone: str) -> str:
    """Mask phone: +91 9876543210 -> +91 98765*****"""
    digits = re.sub(r'\D', '', phone)
    if len(digits) >= 10:
        return f"+91 {digits[-10:-5]}*****"
    return phone[:3] + "*****" if len(phone) > 4 else "[MASKED_PHONE]"

def mask_pan(pan: str) -> str:
    """Mask PAN: ABCDE1234F -> ABC*****4F"""
    if len(pan) == 10:
        return f"{pan[:3]}*****{pan[-2:]}"
    return "[MASKED_PAN]"

def mask_aadhaar(aadhaar: str) -> str:
    """Mask Aadhaar: 2345 6789 1234 -> XXXX-XXXX-1234"""
    clean_digits = re.sub(r'\D', '', aadhaar)
    if len(clean_digits) == 12:
        return f"XXXX-XXXX-{clean_digits[-4:]}"
    return "XXXX-XXXX-****"

def mask_bank_acc(acc: str) -> str:
    """Mask Bank Account: 123456789012 -> XXXX-XXXX-9012"""
    clean_digits = re.sub(r'\D', '', acc)
    if len(clean_digits) >= 4:
        return f"XXXX-XXXX-{clean_digits[-4:]}"
    return "XXXX-XXXX-****"

def detect_sensitive_data(text: str, metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Scans the extracted text and metadata for sensitive information.
    Returns aggregated findings with masked values, count, and risk level.
    """
    findings: List[Dict[str, Any]] = []

    if not text:
        return findings

    # 1. Detect Emails
    emails = EMAIL_REGEX.findall(text)
    if emails:
        sample_email = emails[0]
        masked_sample = mask_email(sample_email)
        findings.append({
            "data_type": "EMAIL",
            "detected_value_masked": masked_sample,
            "count": len(emails),
            "risk_level": "MEDIUM",
            "details": f"Identified {len(emails)} email address(es). Sample: {masked_sample}"
        })

    # 2. Detect Phone Numbers
    phones = PHONE_REGEX.findall(text)
    if phones:
        sample_phone = phones[0]
        masked_sample = mask_phone(sample_phone)
        findings.append({
            "data_type": "PHONE_NUMBER",
            "detected_value_masked": masked_sample,
            "count": len(phones),
            "risk_level": "MEDIUM",
            "details": f"Identified {len(phones)} telephone number(s). Sample: {masked_sample}"
        })

    # 3. Detect PAN Cards
    pans = PAN_REGEX.findall(text)
    if pans:
        sample_pan = pans[0]
        masked_sample = mask_pan(sample_pan)
        findings.append({
            "data_type": "PAN_CARD",
            "detected_value_masked": masked_sample,
            "count": len(pans),
            "risk_level": "HIGH",
            "details": f"Identified {len(pans)} PAN identifier(s). Sample: {masked_sample}"
        })

    # 4. Detect Aadhaar-like identifiers (Synthetic Demo Only)
    aadhaar_matches = AADHAAR_REGEX.findall(text)
    if aadhaar_matches:
        sample_aadhaar = aadhaar_matches[0]
        masked_sample = mask_aadhaar(sample_aadhaar)
        findings.append({
            "data_type": "AADHAAR_SYNTHETIC",
            "detected_value_masked": masked_sample,
            "count": len(aadhaar_matches),
            "risk_level": "CRITICAL",
            "details": f"Identified {len(aadhaar_matches)} Aadhaar-like synthetic identifier(s) (demo pattern only). Sample: {masked_sample}"
        })

    # 5. Detect Bank Account Numbers
    bank_matches = BANK_ACC_REGEX.findall(text)
    if bank_matches:
        sample_acc = bank_matches[0]
        masked_sample = mask_bank_acc(sample_acc)
        findings.append({
            "data_type": "BANK_ACCOUNT",
            "detected_value_masked": masked_sample,
            "count": len(bank_matches),
            "risk_level": "HIGH",
            "details": f"Identified {len(bank_matches)} bank account number pattern(s). Sample: {masked_sample}"
        })

    # 6. Detect Sensitive Column Names in CSV / XLSX metadata
    if metadata and "headers" in metadata:
        headers = metadata.get("headers", [])
        sensitive_cols = [
            h for h in headers
            if any(k in h.lower() for k in SENSITIVE_COLUMN_KEYWORDS)
        ]
        if sensitive_cols:
            findings.append({
                "data_type": "SENSITIVE_COLUMN",
                "detected_value_masked": f"[{', '.join(sensitive_cols[:3])}]",
                "count": len(sensitive_cols),
                "risk_level": "HIGH",
                "details": f"Dataset contains {len(sensitive_cols)} sensitive header columns: {', '.join(sensitive_cols)}"
            })

    return findings
