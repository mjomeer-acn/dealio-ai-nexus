import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/terms")({
  head: () => ({ meta: [{ title: "Terms — Dealio" }] }),
  component: () => (
    <article className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Terms of Service</h1>
      <p>By using Dealio you agree to these terms.</p>
    </article>
  ),
});
