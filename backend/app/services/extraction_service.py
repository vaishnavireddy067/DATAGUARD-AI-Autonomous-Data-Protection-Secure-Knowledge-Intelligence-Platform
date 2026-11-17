import os
import csv
import io
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

async def extract_document_content(file_path: str, file_type: str) -> Tuple[str, Dict[str, Any]]:
    """
    Extracts real text and structured metadata from PDF, DOCX, TXT, CSV, and XLSX.
    Returns:
        (extracted_text, metadata_dict)
    """
    file_type = file_type.lower().strip()
    metadata: Dict[str, Any] = {"file_type": file_type}
    extracted_text = ""

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found at path: {file_path}")

    file_size = os.path.getsize(file_path)
    metadata["file_size_bytes"] = file_size

    try:
        if file_type == "pdf":
            import pypdf
            reader = pypdf.PdfReader(file_path)
            num_pages = len(reader.pages)
            metadata["page_count"] = num_pages
            text_parts = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
            extracted_text = "\n\n".join(text_parts)

        elif file_type == "docx":
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            table_text = []
            for table in doc.tables:
                for row in table.rows:
                    row_data = [cell.text.strip() for cell in row.cells]
                    table_text.append(" | ".join(row_data))
            
            combined = paragraphs + table_text
            metadata["paragraph_count"] = len(paragraphs)
            metadata["table_count"] = len(doc.tables)
            extracted_text = "\n".join(combined)

        elif file_type == "txt":
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    extracted_text = f.read()
            except UnicodeDecodeError:
                with open(file_path, "r", encoding="latin-1") as f:
                    extracted_text = f.read()
            metadata["line_count"] = len(extracted_text.splitlines())

        elif file_type == "csv":
            rows = []
            headers = []
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    reader = csv.reader(f)
                    for i, row in enumerate(reader):
                        if i == 0:
                            headers = row
                        if row:
                            rows.append(" | ".join(row))
            except Exception as e:
                logger.error(f"Error reading CSV: {e}")
                raise

            metadata["headers"] = headers
            metadata["row_count"] = len(rows)
            extracted_text = "\n".join(rows)

        elif file_type == "xlsx":
            import openpyxl
            wb = openpyxl.load_workbook(file_path, data_only=True)
            sheet_names = wb.sheetnames
            metadata["sheet_names"] = sheet_names
            all_sheets_text = []
            
            for sheet_name in sheet_names:
                sheet = wb[sheet_name]
                sheet_lines = [f"=== Sheet: {sheet_name} ==="]
                for row in sheet.iter_rows(values_only=True):
                    row_str = " | ".join([str(val) if val is not None else "" for val in row])
                    if row_str.replace("|", "").strip():
                        sheet_lines.append(row_str)
                all_sheets_text.append("\n".join(sheet_lines))
                
            extracted_text = "\n\n".join(all_sheets_text)
            metadata["total_sheets"] = len(sheet_names)

        else:
            # Fallback text read
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()

    except Exception as exc:
        logger.error(f"Extraction failed for {file_path} ({file_type}): {exc}")
        raise RuntimeError(f"Failed to extract text from {file_type.upper()} file: {str(exc)}")

    word_count = len(extracted_text.split())
    metadata["word_count"] = word_count
    return extracted_text.strip(), metadata

