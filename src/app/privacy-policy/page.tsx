import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AutoDM Hub",
  description: "Privacy Policy for AutoDM Hub Instagram automation.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-10 text-sm text-zinc-400">
          Last updated: September 26, 2026
        </p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              1. About AutoDM Hub
            </h2>
            <p>
              AutoDM Hub is a self-hosted Instagram automation service that uses
              Meta's official Instagram APIs to process supported Instagram
              interactions such as comments, messages, and automation responses.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              2. Information We Process
            </h2>
            <p>
              Depending on how the service is used, we may process Instagram
              account identifiers, usernames, comments, messages, automation
              events, contact information supplied through Instagram, and
              technical information required to operate automations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              3. How We Use Information
            </h2>
            <p>
              Information is used only to provide Instagram automation
              functionality, deliver requested responses, manage connected
              Instagram accounts, prevent duplicate sends, provide analytics,
              troubleshoot errors, and maintain service security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              4. Storage and Security
            </h2>
            <p>
              This instance is self-hosted. Application data is stored in the
              instance owner's Supabase project. Instagram access tokens and
              application credentials are encrypted before being stored.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              5. Meta and Instagram
            </h2>
            <p>
              AutoDM Hub communicates with Instagram through Meta's official
              APIs. This service is not affiliated with, endorsed by, or
              sponsored by Meta or Instagram.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              6. Data Sharing
            </h2>
            <p>
              We do not sell personal information. Information may be processed
              by infrastructure providers required to operate this service,
              including hosting and database providers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              7. Data Retention and Deletion
            </h2>
            <p>
              Information is retained only as necessary to operate the service,
              maintain automation history, comply with applicable obligations,
              and protect the service. Users may request deletion of their data
              by following the instructions on our Data Deletion page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              8. Contact
            </h2>
            <p>
              For privacy questions or data requests, contact:
              <br />
              <strong>andaveti42@gmail.com</strong>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
