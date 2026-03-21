import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { glossary, methodologyLimitations, methodologySections, methodologySources } from "@/data/methodology";

export default function MethodologyPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Methodology</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold tracking-tight">How the engines think</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Venture Math Lab is built around a deterministic finance engine, a Monte Carlo engine, and a cap-table plus
            waterfall engine. It is intentionally more rigorous than a toy calculator, and intentionally simpler than
            bespoke legal modeling.
          </p>
        </div>

        <div className="mt-10 space-y-5">
          <Card>
            <h2 className="font-heading text-2xl font-semibold">Limitations first</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              {methodologyLimitations.map((item) => (
                <li key={item} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-heading text-2xl font-semibold">Support tags</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>
                Every scenario is labeled as <strong>standard</strong>, <strong>approximate</strong>, or <strong>unsupported</strong>.
              </p>
              <p>
                Standard means the scenario stays within the app&apos;s clean venture-math coverage. Approximate means the app is using forward estimates or simplified mechanics. Unsupported means the setup conflicts with the modeled instrument or falls outside the app&apos;s usable assumptions.
              </p>
            </div>
          </Card>
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
          <Card>
            <h2 className="font-heading text-2xl font-semibold">Calibration references</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm text-slate-700">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Metric used</th>
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {methodologySources.map((source) => (
                    <tr key={source.name} className="rounded-panel bg-slate-50">
                      <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{source.name}</td>
                      <td className="px-3 py-3">{source.metric}</td>
                      <td className="px-3 py-3">{source.period}</td>
                      <td className="rounded-r-2xl px-3 py-3">{source.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
