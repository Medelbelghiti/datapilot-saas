import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — DataPilot AI" };

export default function PrivacyPage() {
  return (
    <main className="container-app py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-sm leading-relaxed">
        <p><em>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</em></p>

        <h2 className="text-xl font-semibold mt-8">1. Data Collection</h2>
        <p>DataPilot AI collects personal information you provide directly, such as your email address and name when you create an account. We also store the files you upload for the purpose of providing analysis services.</p>

        <h2 className="text-xl font-semibold mt-8">2. How We Use Your Data</h2>
        <p>Uploaded data is used exclusively to perform the requested analysis. We do not sell, share, or use your uploaded datasets for any other purpose. Aggregated, anonymized statistics may be used to improve our services.</p>

        <h2 className="text-xl font-semibold mt-8">3. Data Storage & Security</h2>
        <p>Files are stored in encrypted, private cloud storage. We use industry-standard security measures including encryption at rest and in transit. Uploaded files are never publicly accessible.</p>

        <h2 className="text-xl font-semibold mt-8">4. AI Processing</h2>
        <p>When AI insights are generated, only aggregated statistical summaries (not raw data) are sent to our AI provider. No personally identifiable information is included in AI processing.</p>

        <h2 className="text-xl font-semibold mt-8">5. Data Retention</h2>
        <p>Uploaded files and analysis results are retained as long as your account is active. You may delete your analyses at any time, which permanently removes the associated files.</p>

        <h2 className="text-xl font-semibold mt-8">6. Your Rights</h2>
        <p>You have the right to access, export, and delete your data at any time. To exercise these rights, use the settings in your account or contact us directly.</p>

        <h2 className="text-xl font-semibold mt-8">7. Third-Party Services</h2>
        <p>We use third-party services (Supabase for database, Polar for payments, OpenAI for AI features). These services process data according to their own privacy policies.</p>

        <h2 className="text-xl font-semibold mt-8">8. Contact</h2>
        <p>For privacy-related inquiries, please contact us through our contact page.</p>
      </div>
    </main>
  );
}
