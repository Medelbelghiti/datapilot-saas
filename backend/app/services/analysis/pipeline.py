from app.services.analysis.loader import load_dataframe
from app.services.analysis.cleaning import compute_data_quality
from app.services.analysis.statistics import compute_statistics
from app.services.analysis.correlations import compute_correlations
from app.services.analysis.outliers import detect_outliers
from app.services.analysis.charts import generate_charts


def run_analysis(file_content: bytes, filename: str) -> dict:
    df = load_dataframe(file_content, filename)

    if df.empty:
        raise ValueError("The uploaded file contains no data")

    if len(df.columns) > 500:
        raise ValueError("Too many columns (max 500)")

    if len(df) > 1_000_000:
        df = df.head(1_000_000)

    data_quality = compute_data_quality(df)
    statistics = compute_statistics(df)
    correlations = compute_correlations(df)
    outliers = detect_outliers(df)
    charts = generate_charts(df)

    return {
        "data_quality": data_quality,
        "statistics": statistics,
        "correlations": correlations,
        "outliers": outliers,
        "charts": charts,
        "summary": {
            "rows": len(df),
            "columns": len(df.columns),
            "file_name": filename,
        },
    }
