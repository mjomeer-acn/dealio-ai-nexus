import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact Dealio" },
      { name: "description", content: "Reach the Dealio team in Mauritius." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Talk to us</h1>
      <p className="mt-3 text-muted-foreground">
        Dealio HQ · Port Louis, Mauritius · hello@dealio.mu · +230 211 4000
      </p>
    </div>
  ),
});
