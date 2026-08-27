import io
import pandas as pd
import numpy as np
from scipy import stats as scipy_stats


def load_dataframe(file_content: bytes, filename: str) -> pd.DataFrame:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "csv":
        for encoding in ["utf-8", "latin-1", "cp1252", "iso-8857-1"]:
            try:
                return pd.read_csv(io.BytesIO(file_content), encoding=encoding)
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue
        raise ValueError("Unable to read CSV file with supported encodings")

    elif ext in ("xlsx", "xls"):
        try:
            return pd.read_excel(io.BytesIO(file_content), engine="openpyxl")
        except Exception:
            return pd.read_excel(io.BytesIO(file_content))
    else:
        raise ValueError(f"Unsupported file type: .{ext}")


def detect_column_types(df: pd.DataFrame) -> dict:
    types = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            types[col] = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            types[col] = "datetime"
        elif pd.api.types.is_bool_dtype(df[col]):
            types[col] = "boolean"
        elif df[col].nunique() / max(len(df), 1) < 0.05:
            types[col] = "categorical"
        else:
            types[col] = "text"
    return types
