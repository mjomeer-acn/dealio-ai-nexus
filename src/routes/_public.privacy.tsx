import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({ meta: [{ title: "Privacy — Dealio" }] }),
  component: () => (
    <article className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Privacy Policy</h1>
      <p>Dealio is committed to protecting your personal data.</p>
      <h2>GDPR rights</h2>
      <p>You may request access, rectification, deletion or export of your data at any time.</p>
    </article>
  ),
});
