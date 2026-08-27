import pandas as pd
import numpy as np


def compute_statistics(df: pd.DataFrame) -> list:
    results = []

    for col in df.columns:
        stat = {
            "column": col,
            "dtype": str(df[col].dtype),
            "count": int(df[col].count()),
            "missing": int(df[col].isnull().sum()),
            "missing_pct": round(df[col].isnull().sum() / len(df) * 100, 2) if len(df) > 0 else 0,
            "unique": int(df[col].nunique()),
        }

        if pd.api.types.is_numeric_dtype(df[col]):
            series = df[col].dropna()
            if len(series) > 0:
                stat.update({
                    "mean": round(float(series.mean()), 4),
                    "median": round(float(series.median()), 4),
                    "std": round(float(series.std()), 4) if len(series) > 1 else 0,
                    "variance": round(float(series.var()), 4) if len(series) > 1 else 0,
                    "min": round(float(series.min()), 4),
                    "max": round(float(series.max()), 4),
                    "q1": round(float(series.quantile(0.25)), 4),
                    "q3": round(float(series.quantile(0.75)), 4),
                    "iqr": round(float(series.quantile(0.75) - series.quantile(0.25)), 4),
                })
                mode_val = series.mode()
                if len(mode_val) > 0:
                    stat["mode"] = round(float(mode_val.iloc[0]), 4)
                    stat["frequency"] = int((series == mode_val.iloc[0]).sum())
        else:
            non_null = df[col].dropna()
            if len(non_null) > 0:
                mode_val = non_null.mode()
                stat.update({
                    "mode": str(mode_val.iloc[0]) if len(mode_val) > 0 else None,
                    "frequency": int((non_null == mode_val.iloc[0]).sum()) if len(mode_val) > 0 else 0,
                })

        results.append(stat)

    return results
