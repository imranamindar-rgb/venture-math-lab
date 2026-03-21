"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { stagePresets } from "@/data/presets";
import { Field } from "@/components/ui/Field";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { SupportBadge } from "@/components/ui/SupportBadge";
import { normalizeFounders, sumFounderOwnership } from "@/lib/founders";
import { ScenarioConfig, SectorOverlay, MarketOverlay, FundingStage, RoundKind } from "@/lib/sim/types";
import { formatCurrency, formatPercent } from "@/lib/format";
import { analyzeScenario } from "@/lib/scenario-diagnostics";
import { getCurrentFinancing } from "@/lib/current-financing";

interface ScenarioEditorProps {
  config: ScenarioConfig;
  onChange: (patch: Partial<ScenarioConfig>) => void;
  onNestedChange: <K extends keyof ScenarioConfig>(key: K, patch: Partial<ScenarioConfig[K]>) => void;
}

function numberValue(event: ChangeEvent<HTMLInputElement>) {
  return Number(event.target.value);
}

function resizeFounders(config: ScenarioConfig, count: number) {
  const current = normalizeFounders(config.founders, config.capTable.founderPercent);
  const safeCount = Math.max(1, count);

  if (current.length === safeCount) {
    return current;
  }

  if (current.length < safeCount) {
    const next = [...current];
    for (let index = current.length; index < safeCount; index += 1) {
      next.push({
        id: `founder_${index + 1}`,
        name: `Founder ${index + 1}`,
        ownershipPercent: 0,
      });
    }
    return next;
  }

  const kept = current.slice(0, safeCount);
  const removedOwnership = current.slice(safeCount).reduce((sum, founder) => sum + founder.ownershipPercent, 0);
  kept[0] = {
    ...kept[0],
    ownershipPercent: kept[0].ownershipPercent + removedOwnership,
  };
  return kept;
}

export function ScenarioEditor({ config, onChange, onNestedChange }: ScenarioEditorProps) {
  const [editorMode, setEditorMode] = useState<"quick" | "standard" | "advanced" | "legal">("quick");
  const stagePreset = stagePresets[config.currentStage];
  const founders = normalizeFounders(config.founders, config.capTable.founderPercent);
  const founderTotal = sumFounderOwnership(founders, config.capTable.founderPercent);
  const diagnostics = useMemo(() => analyzeScenario(config), [config]);
  const financing = useMemo(() => getCurrentFinancing(config), [config]);
  const ownershipTotal =
    config.capTable.founderPercent +
    config.capTable.employeeCommonPercent +
    config.capTable.employeePoolPercent +
    config.capTable.priorInvestorPercent;
  const showStandard = editorMode !== "quick";
  const showAdvanced = editorMode === "advanced";
  const showLegal = editorMode === "legal" || editorMode === "advanced";
  const primaryAmountLabel =
    config.currentRoundKind === "safe_post_money"
      ? "SAFE investment"
      : config.currentRoundKind === "convertible_note_cap"
        ? "Note principal"
        : "Investor initial check";
  const primaryAmountHint =
    config.currentRoundKind === "safe_post_money"
      ? "This is the modeled SAFE purchase amount for the current investor."
      : config.currentRoundKind === "convertible_note_cap"
        ? "This is the modeled note principal for the current investor."
        : "This is the modeled priced-round check for the current investor.";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Scenario Setup</h2>
          <p className="mt-1 text-sm text-slate-500">
            Start from a real benchmark, then tune only the assumptions that matter for this company.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Current stage"
            hint="Sets the base valuation, round size, timing, and failure profile that future rounds build from."
          >
            <select
              value={config.currentStage}
              onChange={(event) => onChange({ currentStage: event.target.value as FundingStage })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            >
              {Object.values(stagePresets).map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Current round type"
            hint="Use SAFE or note when the investor is still waiting for a qualified priced financing to lock ownership."
          >
            <select
              value={config.currentRoundKind}
              onChange={(event) => onChange({ currentRoundKind: event.target.value as RoundKind })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            >
              <option value="safe_post_money">Post-money SAFE</option>
              <option value="convertible_note_cap">Capped note</option>
              <option value="priced_preferred">Priced preferred</option>
            </select>
          </Field>
          {showStandard ? (
            <>
              <Field
                label="Market regime"
                hint="Bull markets widen valuation step-ups and shrink down-round pressure. Bear markets do the opposite."
              >
                <select
                  value={config.marketOverlay}
                  onChange={(event) => onChange({ marketOverlay: event.target.value as MarketOverlay })}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="bull">Bull</option>
                  <option value="base">Base</option>
                  <option value="bear">Bear</option>
                </select>
              </Field>
              <Field
                label="Sector overlay"
                hint="AI premium boosts both pricing and terminal upside so you can compare normal venture math against hype cycles."
              >
                <select
                  value={config.sectorOverlay}
                  onChange={(event) => onChange({ sectorOverlay: event.target.value as SectorOverlay })}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="ai_premium">AI premium</option>
                </select>
              </Field>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "quick", label: "Quick mode" },
            { id: "standard", label: "Standard mode" },
            { id: "advanced", label: "Advanced mode" },
            { id: "legal", label: "Legal terms" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setEditorMode(mode.id as typeof editorMode)}
              className={
                editorMode === mode.id
                  ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white"
                  : "rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600"
              }
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="text-sm leading-6 text-slate-500">
          {editorMode === "quick"
            ? "Quick mode exposes only the handful of inputs needed to get a first answer."
            : editorMode === "standard"
              ? "Standard mode adds founder ownership and the main fundraising levers without the operator and legal edge-case fields."
              : editorMode === "legal"
                ? "Legal terms mode focuses on SAFE, note, preference, and anti-dilution settings."
                : "Advanced mode exposes the full model, including operating reality and simulation controls."}
        </p>
        <div className="rounded-panel border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{stagePreset.label} benchmark</p>
          <p className="mt-2">
            Median pre-money {formatCurrency(stagePreset.preMoney)}, median round {formatCurrency(stagePreset.roundSize)},
            target option pool {formatPercent(stagePreset.optionPoolTarget)}.
          </p>
          <p className="mt-2 text-amber-900/80">{stagePreset.note}</p>
        </div>
        <div className="rounded-panel border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-heading text-base font-semibold text-foreground">Input integrity</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                These checks tell you whether the current scenario is standard, approximate, or internally contradictory before you rely on the outputs.
              </p>
            </div>
            <SupportBadge level={diagnostics.supportLevel} label={diagnostics.supportLabel} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ownership mix total</p>
              <p className="mt-2 font-semibold text-slate-900">{ownershipTotal.toFixed(1)}%</p>
              <p className="mt-1 text-sm text-slate-500">
                {Math.abs(ownershipTotal - 100) <= 0.5 ? "Within tolerance." : "Will be normalized unless corrected."}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Founder split total</p>
              <p className="mt-2 font-semibold text-slate-900">{founderTotal.toFixed(1)}%</p>
              <p className="mt-1 text-sm text-slate-500">
                Cap table founder stake {config.capTable.founderPercent.toFixed(1)}%.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Modeled investor at risk</p>
              <p className="mt-2 font-semibold text-slate-900">{formatCurrency(financing.modeledInvestorCheck)}</p>
              <p className="mt-1 text-sm text-slate-500">Inside a total raise of {formatCurrency(financing.totalRoundRaise)}.</p>
            </div>
          </div>
          {diagnostics.issues.length > 0 ? (
            <div className="mt-4 space-y-3">
              {diagnostics.issues.slice(0, 3).map((issue) => (
                <div
                  key={`${issue.level}-${issue.title}`}
                  className={
                    issue.level === "unsupported"
                      ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950"
                      : issue.level === "approximate"
                        ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                        : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
                  }
                >
                  <p className="font-semibold">{issue.title}</p>
                  <p className="mt-1 leading-6 opacity-90">{issue.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              This setup stays inside the app&apos;s standard venture-math coverage.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold">Current valuation and ownership</h3>
          <p className="mt-1 text-sm text-slate-500">
            These inputs define the cap table before future rounds start compounding dilution.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Current pre-money valuation"
            hint="The model uses this as the anchor for step-up math, which is more important than the headline valuation by itself."
          >
            <MoneyInput
              value={config.currentPreMoney}
              onValueChange={(value) => onChange({ currentPreMoney: value })}
            />
          </Field>
          <Field
            label="Current round size or raise amount"
            hint="Use the full round size here, not just the modeled investor check. In priced rounds it sets total dilution. In SAFE and note cases it anchors company cash runway."
          >
            <MoneyInput
              value={config.currentRoundSize}
              onValueChange={(value) => onChange({ currentRoundSize: value })}
            />
          </Field>
          <Field label={primaryAmountLabel} hint={primaryAmountHint}>
            {config.currentRoundKind === "safe_post_money" ? (
              <MoneyInput
                value={config.safe.investment}
                onValueChange={(value) => onNestedChange("safe", { investment: value })}
              />
            ) : config.currentRoundKind === "convertible_note_cap" ? (
              <MoneyInput
                value={config.note.principal}
                onValueChange={(value) => onNestedChange("note", { principal: value })}
              />
            ) : (
              <MoneyInput
                value={config.investor.initialCheck}
                onValueChange={(value) => onNestedChange("investor", { initialCheck: value })}
              />
            )}
          </Field>
          {showStandard ? (
            <>
          <Field
            label="Number of cofounders"
            hint="Set how many founders currently share the fully diluted founder stake. Each founder can then be named and sized separately."
          >
            <select
              value={founders.length}
              onChange={(event) => {
                const nextFounders = resizeFounders(config, Number(event.target.value));
                onChange({
                  founders: nextFounders,
                  capTable: {
                    ...config.capTable,
                    founderPercent: sumFounderOwnership(nextFounders, config.capTable.founderPercent),
                  },
                });
              }}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            >
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Employee common ownership"
            hint="This is already-issued employee equity, not the future pool reserved for new hires."
          >
            <input
              type="number"
              min={0}
              max={100}
              value={config.capTable.employeeCommonPercent}
              onChange={(event) =>
                onNestedChange("capTable", {
                  employeeCommonPercent: numberValue(event),
                })
              }
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Unissued option pool"
            hint="Pool refresh is one of the easiest ways for investors to shift dilution onto founders before a priced round closes."
          >
            <input
              type="number"
              min={0}
              max={100}
              value={config.capTable.employeePoolPercent}
              onChange={(event) =>
                onNestedChange("capTable", {
                  employeePoolPercent: numberValue(event),
                })
              }
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Existing investor ownership"
            hint="This approximates the preferred stack that sits ahead of common in modest exits."
          >
            <input
              type="number"
              min={0}
              max={100}
              value={config.capTable.priorInvestorPercent}
              onChange={(event) =>
                onNestedChange("capTable", {
                  priorInvestorPercent: numberValue(event),
                })
              }
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
            </>
          ) : null}
        </div>
        {showStandard ? (
        <div className="rounded-panel border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-heading text-base font-semibold text-foreground">Founder equity split</p>
              <p className="mt-1 text-sm text-slate-500">
                Enter each founder&apos;s current fully diluted ownership. The total feeds the founder control and dilution math.
              </p>
            </div>
            <div className="rounded-full border border-border bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
              Total {founderTotal.toFixed(1)}%
            </div>
          </div>
          <div className="mt-4 grid gap-4">
            {founders.map((founder, index) => (
              <div key={founder.id} className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                <Field
                  label={`Founder ${index + 1} name`}
                  hint="Use role-based labels if you want to keep scenarios generic across companies."
                >
                  <input
                    type="text"
                    value={founder.name}
                    onChange={(event) => {
                      const nextFounders = founders.map((entry) =>
                        entry.id === founder.id ? { ...entry, name: event.target.value } : entry,
                      );
                      onChange({ founders: nextFounders });
                    }}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </Field>
                <Field
                  label={`Founder ${index + 1} equity`}
                  hint="This is the founder's share of the whole company, not just the founder pool."
                >
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={founder.ownershipPercent}
                    onChange={(event) => {
                      const nextFounders = founders.map((entry) =>
                        entry.id === founder.id ? { ...entry, ownershipPercent: numberValue(event) } : entry,
                      );
                      onChange({
                        founders: nextFounders,
                        capTable: {
                          ...config.capTable,
                          founderPercent: sumFounderOwnership(nextFounders, config.capTable.founderPercent),
                        },
                      });
                    }}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>
        ) : null}
      </section>

      {showStandard || showLegal ? (
      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold">Instrument terms</h3>
          <p className="mt-1 text-sm text-slate-500">
            Keep this standard-friendly. The simulator explains complex term-sheet tricks but does not fully model them.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {config.currentRoundKind === "safe_post_money" || showLegal ? (
            <>
              <Field
                label="SAFE post-money cap"
                hint="For post-money SAFEs, a lower cap locks more future ownership for the investor before the Series A price is known."
              >
                <MoneyInput
                  value={config.safe.postMoneyCap}
                  onValueChange={(value) => onNestedChange("safe", { postMoneyCap: value })}
                />
              </Field>
              <Field
                label="SAFE discount rate"
                hint="Optional bridge-round discount. The qualified-financing preview converts the SAFE at the better of cap or discounted round price."
              >
                <input
                  type="number"
                  step="0.01"
                  value={config.safe.discountRate}
                  onChange={(event) => onNestedChange("safe", { discountRate: numberValue(event) })}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                />
              </Field>
            </>
          ) : null}
          {config.currentRoundKind === "convertible_note_cap" || showLegal ? (
            <>
              <Field
                label="Note cap"
                hint="Notes price as the better of cap or discount and stay senior to equity in weak exits, so they can be harsher than a clean equity round."
              >
                <MoneyInput
                  value={config.note.preMoneyCap}
                  onValueChange={(value) => onNestedChange("note", { preMoneyCap: value })}
                />
              </Field>
              <Field
                label="Note discount rate"
                hint="If the next round prices below the cap economics, the discount can still give the note holder a cheaper share price."
              >
                <input
                  type="number"
                  step="0.01"
                  value={config.note.discountRate}
                  onChange={(event) => onNestedChange("note", { discountRate: numberValue(event) })}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                />
              </Field>
            </>
          ) : null}
          {showLegal ? (
            <>
              <Field
                label="Preferred participation"
                hint="Non-participating preferred takes either the preference or common conversion. Participating preferred takes the preference first, then shares again in the residual common pool."
              >
                <select
                  value={config.preferred.participationMode}
                  onChange={(event) =>
                    onNestedChange("preferred", {
                      participationMode: event.target.value as "non_participating" | "participating",
                    })
                  }
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="non_participating">Non-participating</option>
                  <option value="participating">Participating</option>
                </select>
              </Field>
              <Field
                label="Liquidation multiple"
                hint="Standard venture terms are usually 1x. Higher multiples protect investors more aggressively in modest exits."
              >
                <input
                  type="number"
                  min={1}
                  max={3}
                  step="0.1"
                  value={config.preferred.liquidationMultiple}
                  onChange={(event) =>
                    onNestedChange("preferred", {
                      liquidationMultiple: numberValue(event),
                    })
                  }
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                />
              </Field>
              <Field
                label="Anti-dilution mode"
                hint="Use this to stress how existing preferred stock resets conversion price in a down round. Broad weighted average is the standard-friendly approximation."
              >
                <select
                  value={config.preferred.antiDilutionMode}
                  onChange={(event) =>
                    onNestedChange("preferred", {
                      antiDilutionMode: event.target.value as "none" | "broad_weighted_average" | "full_ratchet",
                    })
                  }
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="none">None</option>
                  <option value="broad_weighted_average">Broad weighted average</option>
                  <option value="full_ratchet">Full ratchet</option>
                </select>
              </Field>
            </>
          ) : null}
        </div>
      </section>
      ) : null}

      {showAdvanced ? (
      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold">Operating reality</h3>
          <p className="mt-1 text-sm text-slate-500">
            These inputs connect venture math to survival math: runway, margin, revenue growth, and the cash gap to the next financing window.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Cash on hand"
            hint="Current unrestricted cash available to fund the company before the next financing event."
          >
            <MoneyInput
              value={config.operating.cashOnHand}
              onValueChange={(value) => onNestedChange("operating", { cashOnHand: value })}
            />
          </Field>
          <Field
            label="Monthly burn"
            hint="Net cash burn per month after revenue collection. This is the core runway driver."
          >
            <MoneyInput
              value={config.operating.monthlyBurn}
              onValueChange={(value) => onNestedChange("operating", { monthlyBurn: value })}
            />
          </Field>
          <Field
            label="Monthly revenue"
            hint="Current monthly revenue. The operator layer annualizes this and projects it toward the next financing benchmark."
          >
            <MoneyInput
              value={config.operating.monthlyRevenue}
              onValueChange={(value) => onNestedChange("operating", { monthlyRevenue: value })}
            />
          </Field>
          <Field
            label="Monthly revenue growth"
            hint="Expected monthly revenue growth toward the next financing window. This drives the burn-multiple estimate."
          >
            <input
              type="number"
              step="0.01"
              value={config.operating.monthlyRevenueGrowth}
              onChange={(event) => onNestedChange("operating", { monthlyRevenueGrowth: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Gross margin"
            hint="Software-like gross margins support cleaner venture scaling. Lower margins make future step-ups harder to justify."
          >
            <input
              type="number"
              step="0.01"
              value={config.operating.grossMargin}
              onChange={(event) => onNestedChange("operating", { grossMargin: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Target cash buffer months"
            hint="How much post-round safety margin the company wants beyond the next benchmark financing date."
          >
            <input
              type="number"
              step="1"
              value={config.operating.targetCashBufferMonths}
              onChange={(event) => onNestedChange("operating", { targetCashBufferMonths: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Accounts receivable"
            hint="Use this to teach the balance-sheet side of growth. Revenue can be booked before cash arrives."
          >
            <MoneyInput
              value={config.operating.accountsReceivable}
              onValueChange={(value) => onNestedChange("operating", { accountsReceivable: value })}
            />
          </Field>
          <Field
            label="Inventory"
            hint="Leave at zero for software. Use it for hardware or hybrid businesses where cash gets trapped before revenue is recognized."
          >
            <MoneyInput
              value={config.operating.inventory}
              onValueChange={(value) => onNestedChange("operating", { inventory: value })}
            />
          </Field>
          <Field
            label="Accounts payable"
            hint="Supplier payables are current liabilities. They help working capital but can disguise fragility if cash is thin."
          >
            <MoneyInput
              value={config.operating.accountsPayable}
              onValueChange={(value) => onNestedChange("operating", { accountsPayable: value })}
            />
          </Field>
          <Field
            label="Monthly capex"
            hint="This is cash that leaves the business for long-lived assets. It matters for free cash flow even when burn looks manageable."
          >
            <MoneyInput
              value={config.operating.capexMonthly}
              onValueChange={(value) => onNestedChange("operating", { capexMonthly: value })}
            />
          </Field>
          <Field
            label="Transaction fees"
            hint="Modeled legal, banking, and closing costs for the current financing. These reduce how much new cash actually lands on the balance sheet."
          >
            <MoneyInput
              value={config.operating.transactionFees}
              onValueChange={(value) => onNestedChange("operating", { transactionFees: value })}
            />
          </Field>
        </div>
      </section>
      ) : null}

      {showStandard || showAdvanced ? (
      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold">Stakeholder controls</h3>
          <p className="mt-1 text-sm text-slate-500">
            These inputs determine how much the current investor can defend ownership and how much value employees must create to clear exercise cost.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Reserve multiple"
            hint="Set how much follow-on capital the investor can reserve relative to the first check before pro rata runs out."
          >
            <input
              type="number"
              step="0.1"
              value={config.investor.reserveMultiple}
              onChange={(event) => onNestedChange("investor", { reserveMultiple: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Employee grant percent"
            hint="The model treats this as one representative early employee grant and tracks dilution plus exercise exposure."
          >
            <input
              type="number"
              step="0.1"
              value={config.employee.grantOwnershipPercent}
              onChange={(event) => onNestedChange("employee", { grantOwnershipPercent: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Employee strike price"
            hint="High strike prices can leave paper gains unusable even when the company survives to an exit."
          >
            <MoneyInput
              value={config.employee.strikePrice}
              onValueChange={(value) => onNestedChange("employee", { strikePrice: value })}
              showScaleHint={false}
            />
          </Field>
          <Field
            label="Option pool target"
            hint="This is the target reserved pool before each priced round. Raising it makes dilution more founder-heavy."
          >
            <input
              type="number"
              step="0.01"
              value={config.optionPoolTargetPercent}
              onChange={(event) => onChange({ optionPoolTargetPercent: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Monte Carlo iterations"
            hint="Higher iteration counts smooth the power-law tail, but they increase run time on smaller devices."
          >
            <input
              type="number"
              step="500"
              value={config.controls.iterations}
              onChange={(event) =>
                onNestedChange("controls", {
                  iterations: numberValue(event),
                })
              }
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          {showAdvanced ? (
            <Field
              label="Monte Carlo seed"
              hint="Fixed seeds make the simulation reproducible for memos, teaching, and review."
            >
              <input
                type="number"
                step="1"
                value={config.controls.seed}
                onChange={(event) =>
                  onNestedChange("controls", {
                    seed: numberValue(event),
                  })
                }
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
              />
            </Field>
          ) : null}
          {showAdvanced ? (
            <Field
              label="Pareto alpha"
              hint="Lower alpha produces fatter venture tails and more extreme outliers. Higher alpha compresses the tail toward more ordinary outcomes."
            >
              <input
                type="number"
                step="0.05"
                value={config.controls.paretoAlpha}
                onChange={(event) =>
                  onNestedChange("controls", {
                    paretoAlpha: numberValue(event),
                  })
                }
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
              />
            </Field>
          ) : null}
        </div>
      </section>
      ) : null}
    </div>
  );
}
