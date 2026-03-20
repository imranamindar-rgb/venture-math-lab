import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { glossary, methodologySections } from "@/data/methodology";

export default function MethodologyPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Methodology</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold tracking-tight">How the simulator thinks</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Venture Math Lab is built for standard-friendly venture documents. It is intentionally more rigorous than a
            toy calculator, and intentionally simpler than bespoke legal modeling.
          </p>
        </div>

        <div className="mt-10 space-y-5">
          {methodologySections.map((section) => (
            <Card key={section.title}>
              <h2 className="font-heading text-2xl font-semibold">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Card>
            <h2 className="font-heading text-2xl font-semibold">Glossary</h2>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              {glossary.map((entry) => (
                <div key={entry.term} className="rounded-panel border border-slate-200 bg-slate-50 p-4">
                  <dt className="font-semibold text-slate-900">{entry.term}</dt>
                  <dd className="mt-2 text-sm leading-6 text-slate-600">{entry.definition}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
