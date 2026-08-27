import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from datetime import datetime


def generate_pdf_report(
    file_name: str,
    data_quality: dict,
    statistics: list,
    correlations: list,
    outliers: list,
    ai_insights: dict | None,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle("Title2", parent=styles["Title"], fontSize=22, spaceAfter=6)
    heading_style = ParagraphStyle("Heading2", parent=styles["Heading2"], fontSize=14, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle("Body2", parent=styles["BodyText"], fontSize=10, spaceAfter=4)
    small_style = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=9, textColor=colors.grey)

    # ── Cover ──
    story.append(Spacer(1, 2 * inch))
    story.append(Paragraph("DataPilot AI", title_style))
    story.append(Paragraph("Data Analysis Report", styles["Heading1"]))
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(f"Dataset: <b>{file_name}</b>", body_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}", body_style))
    story.append(PageBreak())

    # ── Executive Summary ──
    story.append(Paragraph("Executive Summary", heading_style))
    if ai_insights and ai_insights.get("executive_summary"):
        story.append(Paragraph(ai_insights["executive_summary"], body_style))
    story.append(Spacer(1, 0.2 * inch))

    # ── Dataset Overview ──
    story.append(Paragraph("Dataset Overview", heading_style))
    overview_data = [
        ["Metric", "Value"],
        ["Rows", str(data_quality.get("total_rows", 0))],
        ["Columns", str(data_quality.get("total_columns", 0))],
        ["Missing Values", f"{data_quality.get('missing_values', 0)} ({data_quality.get('missing_pct', 0)}%)"],
        ["Duplicate Rows", f"{data_quality.get('duplicate_rows', 0)} ({data_quality.get('duplicate_pct', 0)}%)"],
        ["Quality Score", f"{data_quality.get('quality_score', 0)}/100"],
    ]
    t = Table(overview_data, colWidths=[2.5 * inch, 3.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.2 * inch))

    # ── Descriptive Statistics ──
    numeric_stats = [s for s in statistics if s.get("mean") is not None]
    if numeric_stats:
        story.append(Paragraph("Descriptive Statistics (Numeric)", heading_style))
        header = ["Column", "Mean", "Median", "Std Dev", "Min", "Max"]
        rows = [header]
        for s in numeric_stats[:20]:
            rows.append([
                s["column"],
                f"{s.get('mean', '')}",
                f"{s.get('median', '')}",
                f"{s.get('std', '')}",
                f"{s.get('min', '')}",
                f"{s.get('max', '')}",
            ])
        t = Table(rows, colWidths=[1.2 * inch] + [0.95 * inch] * 5)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.2 * inch))

    # ── Key Relationships ──
    if correlations:
        story.append(Paragraph("Key Relationships", heading_style))
        for c in correlations[:10]:
            strength = c["strength"].replace("_", " ").title()
            story.append(Paragraph(
                f"<b>{c['col1']}</b> ↔ <b>{c['col2']}</b>: correlation = {c['correlation']} ({strength})",
                body_style,
            ))
        story.append(Spacer(1, 0.2 * inch))

    # ── Outliers ──
    if outliers:
        story.append(Paragraph("Outliers", heading_style))
        for o in outliers:
            story.append(Paragraph(
                f"<b>{o['column']}</b>: {o['count']} outliers ({o['percentage']}%) detected using {o['method']} method",
                body_style,
            ))
        story.append(Spacer(1, 0.2 * inch))

    # ── AI Insights ──
    if ai_insights:
        story.append(PageBreak())
        story.append(Paragraph("AI Insights", heading_style))

        if ai_insights.get("key_findings"):
            story.append(Paragraph("<b>Key Findings</b>", body_style))
            for f in ai_insights["key_findings"]:
                story.append(Paragraph(f"• {f}", body_style))
            story.append(Spacer(1, 0.15 * inch))

        if ai_insights.get("recommendations"):
            story.append(Paragraph("<b>Recommendations</b>", body_style))
            for r in ai_insights["recommendations"]:
                story.append(Paragraph(f"→ {r}", body_style))
            story.append(Spacer(1, 0.15 * inch))

        if ai_insights.get("potential_risks"):
            story.append(Paragraph("<b>Potential Risks</b>", body_style))
            for r in ai_insights["potential_risks"]:
                story.append(Paragraph(f"⚠ {r}", body_style))
            story.append(Spacer(1, 0.15 * inch))

    # ── Methodology ──
    story.append(PageBreak())
    story.append(Paragraph("Methodology", heading_style))
    methods = [
        "Missing values were detected by checking for null, NaN, and empty entries in each column.",
        "Duplicates were identified as rows with identical values across all columns.",
        "Descriptive statistics (mean, median, standard deviation, min, max, quartiles) were computed for numeric columns.",
        "Correlations were calculated using Pearson correlation for numeric variable pairs.",
        "Outliers were detected using the IQR method (values below Q1-1.5×IQR or above Q3+1.5×IQR).",
        "AI insights were generated by sending aggregated statistical summaries to a language model.",
    ]
    for m in methods:
        story.append(Paragraph(f"• {m}", body_style))

    # ── Footer ──
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph("Generated by DataPilot AI", small_style))

    doc.build(story)
    return buffer.getvalue()
