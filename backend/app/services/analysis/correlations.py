import pandas as pd
import numpy as np


def compute_correlations(df: pd.DataFrame) -> list:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) < 2:
        return []

    corr_matrix = df[numeric_cols].corr(method="pearson")
    pairs = []

    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            col1 = numeric_cols[i]
            col2 = numeric_cols[j]
            corr_val = corr_matrix.loc[col1, col2]

            if pd.isna(corr_val):
                continue

            abs_corr = abs(corr_val)
            if abs_corr >= 0.7:
                strength = "strong_positive" if corr_val > 0 else "strong_negative"
            elif abs_corr >= 0.4:
                strength = "moderate_positive" if corr_val > 0 else "moderate_negative"
            else:
                strength = "weak"

            pairs.append({
                "col1": col1,
                "col2": col2,
                "correlation": round(float(corr_val), 4),
                "strength": strength,
            })

    pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)
    return pairs
