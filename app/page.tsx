import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

const pillars = [
  {
    title: "Venture fundamentals dashboard",
    body: "Interactive teaching surface for power-law returns, dilution ladders, threshold math, and why venture behaves differently from normal finance.",
  },
  {
    title: "Deterministic finance engine",
    body: "Inspectable formulas for post-money, ownership, return thresholds, and benchmark dilution before uncertainty widens the range.",
  },
  {
    title: "Monte Carlo engine",
    body: "Power-law aware simulation for founders, employees, and investors under skew, failure, down rounds, and path dependence.",
  },
  {
    title: "Cap table and waterfall engine",
    body: "Fully diluted ownership, SAFE and note conversion, option-pool refreshes, and liquidation outcomes under standard venture terms.",
  },
  {
    title: "Fund construction lab",
    body: "Whole-fund modeling for fees, reserves, check sizing, concentration, one-company-return-the-fund odds, and top-quartile probabilities.",
  },
  {
    title: "Operator intelligence layer",
    body: "Runway, burn, margin, financing gap, and cash buffer analysis so founders can connect fundraising math to actual operating survival.",
  },
];

function ActionLink({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-105"
          : variant === "secondary"
            ? "inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-amber-50"
            : "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
      }
    >
      {label}
    </Link>
  );
}

export default function HomePage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Venture capital math for executives</p>
            <h1 className="mt-4 max-w-4xl font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Three venture finance engines for pricing deals, simulating uncertainty, and decoding the cap table.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Venture Math Lab combines deterministic formulas, Monte Carlo simulation, and cap-table waterfall logic so
              founders, operators, and investors can inspect the venture math before the term sheet arrives.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ActionLink href="/dashboard" label="Open dashboard" />
              <ActionLink href="/calculator" label="Open calculator" variant="secondary" />
              <ActionLink href="/simulator" label="Run simulation" variant="secondary" />
              <ActionLink href="/cap-table" label="Inspect cap table" variant="secondary" />
              <ActionLink href="/fund" label="Open fund lab" variant="secondary" />
              <ActionLink href="/operator" label="Open operator lab" variant="secondary" />
              <ActionLink href="/report" label="Open report" variant="secondary" />
              <ActionLink href="/methodology" label="Read methodology" variant="ghost" />
            </div>
          </div>

          <Card className="relative overflow-hidden border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.96))]">
            <div className="absolute inset-0 bg-grid-fade bg-[size:26px_26px] opacity-30" />
            <div className="relative space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Core questions</p>
                <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                  <li>What exit value actually clears 1x, 3x, or return-the-fund economics at this entry price?</li>
                  <li>How likely is a founder to fall below 20% ownership before the exit window opens?</li>
                  <li>When do conversion terms or preferences reshape the payout waterfall?</li>
                </ul>
              </div>
              <div className="rounded-panel border border-amber-200 bg-amber-50 p-5">
                <p className="font-heading text-xl font-semibold">What this build exposes</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  A deterministic deal calculator, a Monte Carlo risk engine, and a cap-table waterfall lab. Post-money
                  SAFEs, capped notes, standard preferred, option-pool refreshes, and partial secondary liquidity stay
                  rigorous but explainable.
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Every scenario now carries a standard, approximate, or unsupported support tag before you export it.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
