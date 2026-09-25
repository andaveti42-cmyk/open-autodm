import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion | AutoDM Hub",
  description: "Instructions for requesting deletion of data from AutoDM Hub.",
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold">Data Deletion Instructions</h1>
        <p className="mb-10 text-sm text-zinc-400">
          Last updated: September 26, 2026
        </p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              Requesting Data Deletion
            </h2>
            <p>
              If you want personal information associated with AutoDM Hub to be
              deleted, send a deletion request to:
            </p>

            <p className="mt-4">
              <strong>YOUR_EMAIL_HERE</strong>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              What to Include
            </h2>
            <p>
              Include your Instagram username and clearly state that you are
              requesting deletion of information associated with your Instagram
              interactions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              What We Will Do
            </h2>
            <p>
              After verifying the request where reasonably necessary, we will
              delete applicable personal information stored by this AutoDM Hub
              instance, except information that must be retained for legal,
              security, fraud-prevention, or technical reasons.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              Disconnecting Instagram
            </h2>
            <p>
              A connected Instagram account may also be disconnected from the
              AutoDM Hub Settings page. Disconnecting an account stops future
              automation access for that connection.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
