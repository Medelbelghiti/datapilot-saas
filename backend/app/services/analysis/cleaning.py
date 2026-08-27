import pandas as pd
import numpy as np


def compute_data_quality(df: pd.DataFrame) -> dict:
    total_rows = len(df)
    total_cols = len(df.columns)
    total_cells = total_rows * total_cols

    missing_values = int(df.isnull().sum().sum())
    missing_pct = round((missing_values / total_cells * 100), 2) if total_cells > 0 else 0

    duplicate_rows = int(df.duplicated().sum())
    duplicate_pct = round((duplicate_rows / total_rows * 100), 2) if total_rows > 0 else 0

    columns_info = []
    for col in df.columns:
        missing = int(df[col].isnull().sum())
        missing_pct_col = round((missing / total_rows * 100), 2) if total_rows > 0 else 0
        unique = int(df[col].nunique())

        potential_issue = None
        if missing_pct_col > 50:
            potential_issue = "High missing values (>50%)"
        elif unique == 1:
            potential_issue = "Constant column (only 1 unique value)"
        elif unique == total_rows and df[col].dtype == "object":
            potential_issue = "Possible identifier column"

        columns_info.append({
            "column": col,
            "dtype": str(df[col].dtype),
            "missing": missing,
            "missing_pct": missing_pct_col,
            "unique": unique,
            "potential_issue": potential_issue,
        })

    # Compute quality score (0-100)
    score = 100
    score -= min(missing_pct * 2, 30)
    score -= min(duplicate_pct, 20)
    constant_cols = sum(1 for c in columns_info if "Constant" in (c["potential_issue"] or ""))
    score -= constant_cols * 3
    score = max(0, min(100, round(score)))

    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "missing_values": missing_values,
        "missing_pct": missing_pct,
        "duplicate_rows": duplicate_rows,
        "duplicate_pct": duplicate_pct,
        "quality_score": score,
        "columns": columns_info,
    }
