import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const pillars = [
  {
    title: "Power-law aware",
    body: "The simulator keeps the core VC truth intact: the mean is driven by a tiny tail of outliers, not by typical deals.",
  },
  {
    title: "Stakeholder-specific",
    body: "Founders, employees, and investors all see different slices of the same financing path, including dilution and liquidity timing.",
  },
  {
    title: "Explainable inputs",
    body: "Each input has guidance so the product works as a decision tool, not just a math sandbox for people who already know the jargon.",
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Venture capital math for executives</p>
            <h1 className="mt-4 max-w-4xl font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Simulate the financing paths that reshape founder ownership, employee equity, and investor returns.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Venture Math Lab models priced rounds, SAFEs, capped notes, dilution, preferences, and partial secondary
              liquidity under Monte Carlo uncertainty. It is built for leaders who need to understand the economics before
              the term sheet arrives.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/simulator">
                <Button>Open simulator</Button>
              </Link>
              <Link href="/compare">
                <Button variant="secondary">Compare scenarios</Button>
              </Link>
              <Link href="/methodology">
                <Button variant="ghost">Read methodology</Button>
              </Link>
            </div>
          </div>

          <Card className="relative overflow-hidden border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.96))]">
            <div className="absolute inset-0 bg-grid-fade bg-[size:26px_26px] opacity-30" />
            <div className="relative space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Core questions</p>
                <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                  <li>How likely is a founder to fall below 20% ownership before the exit window opens?</li>
                  <li>When does an employee grant become underwater even if the company keeps raising?</li>
                  <li>Does the investor need a rare 25x outcome to justify the initial price?</li>
                </ul>
              </div>
              <div className="rounded-panel border border-amber-200 bg-amber-50 p-5">
                <p className="font-heading text-xl font-semibold">What v1 models</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Post-money SAFEs, capped notes, standard preferred, option-pool refreshes, down-round pressure, and
                  partial secondary liquidity. The math stays rigorous but explainable.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <p className="font-heading text-xl font-semibold">{pillar.title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
