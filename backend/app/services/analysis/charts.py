import pandas as pd
import numpy as np
import plotly
import plotly.express as px
import plotly.graph_objects as go
import json
import uuid


def generate_charts(df: pd.DataFrame) -> list:
    charts = []
    max_charts = 8

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    datetime_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()

    # 1. Histograms for first 2 numeric columns
    for col in numeric_cols[:2]:
        fig = px.histogram(df, x=col, nbins=30, title=f"Distribution of {col}")
        fig.update_layout(template="plotly_white", margin=dict(l=40, r=20, t=40, b=40))
        charts.append({
            "id": str(uuid.uuid4()),
            "type": "histogram",
            "title": f"Distribution of {col}",
            "data": json.loads(plotly.io.to_json(fig)),
            "config": {"column": col},
        })
        if len(charts) >= max_charts:
            return charts

    # 2. Bar charts for first categorical column
    for col in categorical_cols[:1]:
        value_counts = df[col].value_counts().head(15)
        fig = px.bar(
            x=value_counts.index.astype(str),
            y=value_counts.values,
            title=f"Top Values in {col}",
            labels={"x": col, "y": "Count"},
        )
        fig.update_layout(template="plotly_white", margin=dict(l=40, r=20, t=40, b=40))
        charts.append({
            "id": str(uuid.uuid4()),
            "type": "bar",
            "title": f"Top Values in {col}",
            "data": json.loads(plotly.io.to_json(fig)),
            "config": {"column": col},
        })
        if len(charts) >= max_charts:
            return charts

    # 3. Box plots for first numeric column
    if numeric_cols:
        col = numeric_cols[0]
        fig = px.box(df, y=col, title=f"Box Plot of {col}")
        fig.update_layout(template="plotly_white", margin=dict(l=40, r=20, t=40, b=40))
        charts.append({
            "id": str(uuid.uuid4()),
            "type": "box",
            "title": f"Box Plot of {col}",
            "data": json.loads(plotly.io.to_json(fig)),
            "config": {"column": col},
        })
        if len(charts) >= max_charts:
            return charts

    # 4. Scatter plot for first 2 numeric columns
    if len(numeric_cols) >= 2:
        fig = px.scatter(
            df, x=numeric_cols[0], y=numeric_cols[1],
            title=f"{numeric_cols[0]} vs {numeric_cols[1]}",
            opacity=0.6,
        )
        fig.update_layout(template="plotly_white", margin=dict(l=40, r=20, t=40, b=40))
        charts.append({
            "id": str(uuid.uuid4()),
            "type": "scatter",
            "title": f"{numeric_cols[0]} vs {numeric_cols[1]}",
            "data": json.loads(plotly.io.to_json(fig)),
            "config": {"x": numeric_cols[0], "y": numeric_cols[1]},
        })
        if len(charts) >= max_charts:
            return charts

    # 5. Correlation heatmap
    if len(numeric_cols) >= 3:
        corr = df[numeric_cols[:8]].corr()
        fig = px.imshow(
            corr,
            text_auto=".2f",
            color_continuous_scale="RdBu_r",
            title="Correlation Heatmap",
        )
        fig.update_layout(template="plotly_white", margin=dict(l=40, r=20, t=40, b=40))
        charts.append({
            "id": str(uuid.uuid4()),
            "type": "heatmap",
            "title": "Correlation Heatmap",
            "data": json.loads(plotly.io.to_json(fig)),
            "config": {},
        })

    return charts
