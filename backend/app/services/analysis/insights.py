from openai import OpenAI
from app.core.config import settings
import json

client = OpenAI(api_key=settings.openai_api_key)


def generate_ai_insights(
    data_quality: dict,
    statistics: list,
    correlations: list,
    outliers: list,
    file_name: str,
) -> dict:
    numeric_stats = [s for s in statistics if s.get("mean") is not None]
    cat_stats = [s for s in statistics if s.get("mean") is None]

    stats_summary = []
    for s in numeric_stats[:15]:
        stats_summary.append(
            f"{s['column']}: mean={s.get('mean','N/A')}, median={s.get('median','N/A')}, "
            f"std={s.get('std','N/A')}, min={s.get('min','N/A')}, max={s.get('max','N/A')}"
        )

    corr_summary = [
        f"{c['col1']} ↔ {c['col2']}: {c['correlation']} ({c['strength']})"
        for c in correlations[:10]
    ]

    outlier_summary = [
        f"{o['column']}: {o['count']} outliers ({o['percentage']}%)" for o in outliers[:10]
    ]

    prompt = f"""You are a data analysis expert. Analyze the following dataset summary and provide insights.

Dataset: {file_name}
Rows: {data_quality.get('total_rows', 0)}
Columns: {data_quality.get('total_columns', 0)}
Quality Score: {data_quality.get('quality_score', 0)}/100
Missing Values: {data_quality.get('missing_values', 0)} ({data_quality.get('missing_pct', 0)}%)
Duplicate Rows: {data_quality.get('duplicate_rows', 0)} ({data_quality.get('duplicate_pct', 0)}%)

Numeric Statistics:
{chr(10).join(stats_summary) if stats_summary else 'No numeric columns'}

Correlations:
{chr(10).join(corr_summary) if corr_summary else 'No significant correlations'}

Outliers:
{chr(10).join(outlier_summary) if outlier_summary else 'No outliers detected'}

IMPORTANT RULES:
- Only make claims supported by the provided statistical results.
- Do NOT invent numbers or facts not present in the data.
- Distinguish correlation from causation. Use language like "association" not "causes".
- Do NOT provide financial trading advice.
- If evidence is insufficient for a claim, say so.

Return a JSON object with these fields:
{{
  "executive_summary": "A 2-3 sentence overview of the dataset",
  "key_findings": ["finding1", "finding2", ...],
  "data_quality_observations": ["observation1", ...],
  "important_relationships": ["relationship1", ...],
  "potential_risks": ["risk1", ...],
  "recommendations": ["recommendation1", ...]
}}

Return ONLY valid JSON, no markdown."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500,
        )

        content = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            if content.endswith("```"):
                content = content[:-3]

        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "executive_summary": "AI insights could not be parsed. Please try again.",
            "key_findings": [],
            "data_quality_observations": [],
            "important_relationships": [],
            "potential_risks": [],
            "recommendations": [],
        }
    except Exception as e:
        return {
            "executive_summary": f"AI insights generation failed: {str(e)}",
            "key_findings": [],
            "data_quality_observations": [],
            "important_relationships": [],
            "potential_risks": [],
            "recommendations": [],
        }
