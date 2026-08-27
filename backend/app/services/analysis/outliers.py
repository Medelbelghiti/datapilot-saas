import pandas as pd
import numpy as np


def detect_outliers(df: pd.DataFrame) -> list:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    results = []

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 10:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outliers_iqr = series[(series < lower_bound) | (series > upper_bound)]
        count_iqr = len(outliers_iqr)
        pct_iqr = round(count_iqr / len(series) * 100, 2)

        if count_iqr > 0:
            results.append({
                "column": col,
                "count": count_iqr,
                "percentage": pct_iqr,
                "method": "IQR",
            })

    return results
