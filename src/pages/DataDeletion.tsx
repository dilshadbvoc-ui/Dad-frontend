import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import {
  Trash2,
  Mail,
  Clock,
  Database,
  Archive,
  AlertTriangle,
  Download,
  HelpCircle,
  Scale,
} from "lucide-react";

const SUPPORT_EMAIL = "support@pypecrm.com";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title="Data Deletion Request"
        description="How to request deletion of your personal data from Pype CRM."
        canonical="https://pypecrm.com/data-deletion"
      />
      <LandingNavbar />
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400 mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Data Deletion Request
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Last Updated: August 8, 2026
            </p>
          </div>

          <div className="space-y-12 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-blue-600" />
                Introduction
              </h2>
              <p>
                You have the right to request the deletion of all personal data we hold about you
                under applicable privacy laws. This page explains exactly how to make that request
                and what happens once you do. The process is simple, and we've laid out every step
                below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                How to Request Deletion
              </h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Send an email to{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </li>
                <li>Use the subject line: <strong>"Data Deletion Request"</strong>.</li>
                <li>Include the email address or account ID associated with your Pype CRM account.</li>
                <li>Confirm in your message that you understand your data will be permanently deleted.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-600" />
                Timeframe
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data deletion takes up to <strong>30 days</strong> from the date we receive your request.</li>
                <li>We will send you a confirmation email once the deletion is complete.</li>
                <li>You'll receive a receipt acknowledging your deletion request shortly after we receive it.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-600" />
                What Gets Deleted
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All leads in your account</li>
                <li>All campaigns and ads data</li>
                <li>All your settings and preferences</li>
                <li>All personal information</li>
                <li>All account activity history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Archive className="h-6 w-6 text-blue-600" />
                What We Keep
              </h2>
              <p>
                We delete all of your data, except where we are required by law to retain certain
                records — for example, financial or billing records — for a limited period for
                legal, tax, or audit purposes.
              </p>
            </section>

            <section className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                This Cannot Be Undone
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>This action cannot be undone.</li>
                <li>Once deleted, your data is gone forever.</li>
                <li>We cannot recover deleted data, even if you ask us to.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Download className="h-6 w-6 text-blue-600" />
                Download Your Data First
              </h2>
              <p className="mb-4">
                Before requesting deletion, you can request an export of your data. We'll provide
                it to you in a downloadable format (CSV or JSON).
              </p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How to Request a Data Export
              </h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Send an email to{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </li>
                <li>Use the subject line: <strong>"Data Export Request"</strong>.</li>
                <li>We'll send your data within 7 days.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-blue-600" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Can I undo a deletion request?</p>
                  <p>No. Once processed, deletion is permanent and cannot be reversed.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">How long does it take?</p>
                  <p>Up to 30 days from when we receive your request.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">What if I change my mind?</p>
                  <p>Request a data export before submitting your deletion request — once deletion is processed, it can't be undone.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Will you sell my data?</p>
                  <p>No. We do not sell your personal data to third parties.</p>
                </div>
              </div>
            </section>

            <section className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                Contact Information
              </h2>
              <p className="mb-2">
                Support email:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 font-bold hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p>Response time: usually within 48 hours.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Scale className="h-6 w-6 text-blue-600" />
                Legal
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We aim to handle your data responsibly and in line with applicable data privacy regulations, including the principles set out in the GDPR where applicable to you.</li>
                <li>We do not sell your personal data to third parties.</li>
                <li>Data deletion, once completed, is permanent.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
