import type { Metadata } from "next";

export const metadata: Metadata = { title: "Methodology — DataPilot AI" };

export default function MethodologyPage() {
  return (
    <main className="container-app py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Analytical Methodology</h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-sm leading-relaxed">
        <p>DataPilot AI uses industry-standard statistical methods to analyze your data. This page explains how each analysis component works.</p>

        <h2 className="text-xl font-semibold mt-8">Missing Value Detection</h2>
        <p>We scan every column for null, NaN, and empty values. For each column, we calculate the count and percentage of missing values. This helps identify data quality issues before analysis.</p>

        <h2 className="text-xl font-semibold mt-8">Duplicate Detection</h2>
        <p>We identify rows that are exact duplicates across all columns. Duplicate percentage is calculated relative to total row count. Duplicates may indicate data entry errors or system artifacts.</p>

        <h2 className="text-xl font-semibold mt-8">Descriptive Statistics</h2>
        <p>For numeric columns, we compute: count, mean, median, standard deviation, variance, minimum, maximum, Q1, Q3, and IQR. For categorical columns: count, unique values, mode, frequency, and percentage distribution.</p>

        <h2 className="text-xl font-semibold mt-8">Correlation Analysis</h2>
        <p>We use Pearson correlation to measure linear relationships between numeric variables. Correlation coefficients range from -1 to +1. We use careful language — we describe &quot;associations&quot; rather than implying causation.</p>

        <h2 className="text-xl font-semibold mt-8">Outlier Detection</h2>
        <p>We use the IQR (Interquartile Range) method: values below Q1 - 1.5×IQR or above Q3 + 1.5×IQR are flagged as outliers. Outliers are identified but never automatically removed.</p>

        <h2 className="text-xl font-semibold mt-8">Visualization Selection</h2>
        <p>Charts are automatically selected based on column types: histograms and box plots for numeric data, bar charts for categorical data, scatter plots for two-variable relationships, and heatmaps for correlation matrices.</p>

        <h2 className="text-xl font-semibold mt-8">AI Insight Generation</h2>
        <p>Aggregated statistical summaries are sent to a large language model. The AI generates structured insights including executive summaries, key findings, and recommendations — always grounded in the computed statistics.</p>

        <h2 className="text-xl font-semibold mt-8">Data Quality Score</h2>
        <p>The quality score (0-100) is computed based on: missing value percentage, duplicate percentage, number of constant columns, and data type consistency. Higher scores indicate cleaner data.</p>
      </div>
    </main>
  );
}
