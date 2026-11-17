import re
from typing import Tuple
from app.services.detection_service import (
    EMAIL_REGEX, PHONE_REGEX, PAN_REGEX, AADHAAR_REGEX, BANK_ACC_REGEX,
    mask_email, mask_phone, mask_pan, mask_aadhaar, mask_bank_acc
)

def apply_masking_to_text(text: str) -> str:
    """
    Applies masking to sensitive entities within the text.
    vaishnavi@gmail.com -> vai***@gmail.com
    +91 9876543210 -> +91 98765*****
    """
    if not text:
        return ""

    # Mask emails
    def email_sub(match):
        return mask_email(match.group(0))
    text = EMAIL_REGEX.sub(email_sub, text)

    # Mask phones
    def phone_sub(match):
        return mask_phone(match.group(0))
    text = PHONE_REGEX.sub(phone_sub, text)

    # Mask PAN
    def pan_sub(match):
        return mask_pan(match.group(0))
    text = PAN_REGEX.sub(pan_sub, text)

    # Mask Aadhaar
    def aadhaar_sub(match):
        return mask_aadhaar(match.group(0))
    text = AADHAAR_REGEX.sub(aadhaar_sub, text)

    # Mask Bank account numbers
    def bank_sub(match):
        prefix = match.group(0)[:match.start(1) - match.start(0)]
        acc_no = match.group(1)
        return prefix + mask_bank_acc(acc_no)
    text = BANK_ACC_REGEX.sub(bank_sub, text)

    return text

def apply_redaction_to_text(text: str) -> str:
    """
    Replaces sensitive entities with [REDACTED] markers.
    Phone: +91 9876543210 -> Phone: [REDACTED]
    """
    if not text:
        return ""

    text = EMAIL_REGEX.sub("[REDACTED_EMAIL]", text)
    text = PHONE_REGEX.sub("[REDACTED_PHONE]", text)
    text = PAN_REGEX.sub("[REDACTED_PAN]", text)
    text = AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", text)
    
    def bank_redact(match):
        prefix = match.group(0)[:match.start(1) - match.start(0)]
        return prefix + "[REDACTED_ACCOUNT]"
    text = BANK_ACC_REGEX.sub(bank_redact, text)

    return text

