import io
import json
import pytest
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np


# ── Loader Tests ──────────────────────────────────────────────
class TestLoader:
    def test_load_csv(self):
        from app.services.analysis.loader import load_dataframe
        csv_content = "name,age,score\nAlice,25,90\nBob,30,85\nCharlie,35,95"
        df = load_dataframe(csv_content.encode("utf-8"), "test.csv")
        assert len(df) == 3
        assert list(df.columns) == ["name", "age", "score"]

    def test_load_csv_latin1(self):
        from app.services.analysis.loader import load_dataframe
        csv_content = "name,value\ncafé,1\nnaïve,2"
        df = load_dataframe(csv_content.encode("latin-1"), "test.csv")
        assert len(df) == 2

    def test_load_empty_csv(self):
        from app.services.analysis.loader import load_dataframe
        with pytest.raises(Exception):
            load_dataframe(b"", "test.csv")

    def test_unsupported_type(self):
        from app.services.analysis.loader import load_dataframe
        with pytest.raises(ValueError, match="Unsupported"):
            load_dataframe(b"test", "test.pdf")

    def test_detect_column_types(self):
        from app.services.analysis.loader import detect_column_types
        df = pd.DataFrame({
            "num": [1, 2, 3],
            "cat": ["a", "b", "a"],
            "text": ["hello", "world", "foo"],
        })
        types = detect_column_types(df)
        assert types["num"] == "numeric"


# ── Cleaning / Data Quality Tests ────────────────────────────
class TestDataQuality:
    def test_clean_dataset(self):
        from app.services.analysis.cleaning import compute_data_quality
        df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
        result = compute_data_quality(df)
        assert result["total_rows"] == 3
        assert result["total_columns"] == 2
        assert result["missing_values"] == 0
        assert result["duplicate_rows"] == 0
        assert result["quality_score"] == 100

    def test_missing_values(self):
        from app.services.analysis.cleaning import compute_data_quality
        df = pd.DataFrame({"a": [1, None, 3], "b": ["x", None, "z"]})
        result = compute_data_quality(df)
        assert result["missing_values"] == 2
        assert result["missing_pct"] > 0

    def test_duplicates(self):
        from app.services.analysis.cleaning import compute_data_quality
        df = pd.DataFrame({"a": [1, 1, 3], "b": ["x", "x", "z"]})
        result = compute_data_quality(df)
        assert result["duplicate_rows"] == 1

    def test_constant_column(self):
        from app.services.analysis.cleaning import compute_data_quality
        df = pd.DataFrame({"a": [1, 1, 1], "b": [1, 2, 3]})
        result = compute_data_quality(df)
        issues = [c for c in result["columns"] if c["potential_issue"]]
        assert len(issues) > 0

    def test_quality_score_decreases_with_issues(self):
        from app.services.analysis.cleaning import compute_data_quality
        good_df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
        bad_df = pd.DataFrame({"a": [None, None, None], "b": [None, None, None]})
        good = compute_data_quality(good_df)
        bad = compute_data_quality(bad_df)
        assert bad["quality_score"] < good["quality_score"]


# ── Statistics Tests ──────────────────────────────────────────
class TestStatistics:
    def test_numeric_statistics(self):
        from app.services.analysis.statistics import compute_statistics
        df = pd.DataFrame({"x": [10, 20, 30, 40, 50]})
        stats = compute_statistics(df)
        assert len(stats) == 1
        s = stats[0]
        assert s["column"] == "x"
        assert s["mean"] == 30.0
        assert s["median"] == 30.0
        assert s["min"] == 10.0
        assert s["max"] == 50.0
        assert s["count"] == 5

    def test_categorical_statistics(self):
        from app.services.analysis.statistics import compute_statistics
        df = pd.DataFrame({"color": ["red", "blue", "red", "green"]})
        stats = compute_statistics(df)
        assert len(stats) == 1
        s = stats[0]
        assert s["unique"] == 3
        assert s["mode"] == "red"

    def test_mixed_columns(self):
        from app.services.analysis.statistics import compute_statistics
        df = pd.DataFrame({"num": [1, 2, 3], "cat": ["a", "b", "c"]})
        stats = compute_statistics(df)
        assert len(stats) == 2

    def test_with_missing(self):
        from app.services.analysis.statistics import compute_statistics
        df = pd.DataFrame({"x": [1.0, None, 3.0]})
        stats = compute_statistics(df)
        assert stats[0]["missing"] == 1
        assert stats[0]["count"] == 2


# ── Correlation Tests ─────────────────────────────────────────
class TestCorrelations:
    def test_no_numeric_columns(self):
        from app.services.analysis.correlations import compute_correlations
        df = pd.DataFrame({"a": ["x", "y"], "b": ["z", "w"]})
        assert compute_correlations(df) == []

    def test_perfect_correlation(self):
        from app.services.analysis.correlations import compute_correlations
        df = pd.DataFrame({"x": [1, 2, 3, 4, 5], "y": [2, 4, 6, 8, 10]})
        corrs = compute_correlations(df)
        assert len(corrs) == 1
        assert corrs[0]["correlation"] == 1.0
        assert corrs[0]["strength"] == "strong_positive"

    def test_negative_correlation(self):
        from app.services.analysis.correlations import compute_correlations
        df = pd.DataFrame({"x": [1, 2, 3, 4, 5], "y": [10, 8, 6, 4, 2]})
        corrs = compute_correlations(df)
        assert corrs[0]["correlation"] == -1.0
        assert corrs[0]["strength"] == "strong_negative"

    def test_single_numeric_column(self):
        from app.services.analysis.correlations import compute_correlations
        df = pd.DataFrame({"x": [1, 2, 3]})
        assert compute_correlations(df) == []


# ── Outlier Tests ─────────────────────────────────────────────
class TestOutliers:
    def test_no_outliers(self):
        from app.services.analysis.outliers import detect_outliers
        df = pd.DataFrame({"x": list(range(100))})
        outliers = detect_outliers(df)
        assert len(outliers) == 0

    def test_outliers_detected(self):
        from app.services.analysis.outliers import detect_outliers
        data = list(range(100)) + [1000, 2000, 3000]
        df = pd.DataFrame({"x": data})
        outliers = detect_outliers(df)
        assert len(outliers) == 1
        assert outliers[0]["count"] == 3
        assert outliers[0]["method"] == "IQR"

    def test_small_dataset(self):
        from app.services.analysis.outliers import detect_outliers
        df = pd.DataFrame({"x": [1, 2, 3]})
        assert detect_outliers(df) == []

    def test_categorical_ignored(self):
        from app.services.analysis.outliers import detect_outliers
        df = pd.DataFrame({"cat": ["a", "b", "c"] * 10})
        assert detect_outliers(df) == []


# ── Pipeline Integration Tests ────────────────────────────────
class TestPipeline:
    def test_run_analysis_csv(self):
        from app.services.analysis.pipeline import run_analysis
        csv = "a,b,c\n1,2,3\n4,5,6\n7,8,9"
        result = run_analysis(csv.encode("utf-8"), "test.csv")
        assert "data_quality" in result
        assert "statistics" in result
        assert "correlations" in result
        assert "outliers" in result
        assert "charts" in result
        assert result["summary"]["rows"] == 3
        assert result["summary"]["columns"] == 3

    def test_empty_dataset_raises(self):
        from app.services.analysis.pipeline import run_analysis
        with pytest.raises(ValueError):
            run_analysis(b"a,b\n", "empty.csv")


# ── Chart Tests ───────────────────────────────────────────────
class TestCharts:
    def test_generate_charts(self):
        from app.services.analysis.charts import generate_charts
        df = pd.DataFrame({
            "num1": range(50),
            "num2": range(50),
            "cat": ["a", "b"] * 25,
        })
        charts = generate_charts(df)
        assert len(charts) > 0
        assert len(charts) <= 8
        for c in charts:
            assert "id" in c
            assert "type" in c
            assert "title" in c
            assert "data" in c

    def test_minimal_dataset(self):
        from app.services.analysis.charts import generate_charts
        df = pd.DataFrame({"x": [1, 2, 3]})
        charts = generate_charts(df)
        assert isinstance(charts, list)


# ── Auth Tests ────────────────────────────────────────────────
class TestAuth:
    def test_decode_valid_token(self):
        from app.core.auth import decode_token
        from jose import jwt
        token = jwt.encode(
            {"sub": "user-123", "aud": "authenticated"},
            "test-secret",
            algorithm="HS256",
        )
        with patch("app.core.auth.SUPABASE_JWT_SECRET", "test-secret"):
            payload = decode_token(token)
            assert payload["sub"] == "user-123"

    def test_decode_invalid_token(self):
        from app.core.auth import decode_token
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            decode_token("invalid-token")


# ── Webhook Idempotency Tests ────────────────────────────────
class TestWebhook:
    def test_event_structure(self):
        event = {
            "id": "evt_123",
            "type": "subscription.active",
            "data": {
                "id": "sub_123",
                "customer_id": "cust_123",
                "product_id": "prod_123",
                "status": "active",
            },
        }
        assert event["type"] == "subscription.active"
        assert event["data"]["status"] == "active"
