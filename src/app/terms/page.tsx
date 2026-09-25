import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | AutoDM Hub",
  description: "Terms of Service for AutoDM Hub.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
        <p className="mb-10 text-sm text-zinc-400">
          Last updated: September 26, 2026
        </p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              1. Service
            </h2>
            <p>
              AutoDM Hub provides tools for automating supported Instagram
              interactions through Meta's official APIs, including comment,
              message, and automation response workflows.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              2. Acceptable Use
            </h2>
            <p>
              You agree to use the service only in accordance with applicable
              laws, Meta Platform Terms, Instagram Terms of Use, and other
              applicable platform policies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              3. Account Responsibility
            </h2>
            <p>
              You are responsible for your connected Instagram accounts,
              automation content, links, messages, and interactions sent through
              the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              4. Availability
            </h2>
            <p>
              We do not guarantee uninterrupted or error-free service. Meta,
              Instagram, hosting providers, database providers, or API changes
              may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              5. Third-Party Platforms
            </h2>
            <p>
              AutoDM Hub depends on third-party services including Meta,
              Instagram, hosting services, and database infrastructure. Their
              terms and policies may also apply.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              6. Disclaimer
            </h2>
            <p>
              The service is provided on an "as is" and "as available" basis,
              without warranties of uninterrupted availability or specific
              results.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              7. Changes
            </h2>
            <p>
              These Terms may be updated when the service, applicable laws, or
              platform requirements change.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              8. Contact
            </h2>
            <p>
              Questions about these Terms may be sent to:
              <br />
              <strong>YOUR_EMAIL_HERE</strong>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
