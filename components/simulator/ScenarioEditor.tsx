"use client";

import type { ChangeEvent } from "react";

import { stagePresets } from "@/data/presets";
import { Field } from "@/components/ui/Field";
import { normalizeFounders, sumFounderOwnership } from "@/lib/founders";
import { ScenarioConfig, SectorOverlay, MarketOverlay, FundingStage, RoundKind } from "@/lib/sim/types";
import { formatCurrency, formatPercent } from "@/lib/format";

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
  const stagePreset = stagePresets[config.currentStage];
  const founders = normalizeFounders(config.founders, config.capTable.founderPercent);
  const founderTotal = sumFounderOwnership(founders, config.capTable.founderPercent);

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
        </div>
        <div className="rounded-panel border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{stagePreset.label} benchmark</p>
          <p className="mt-2">
            Median pre-money {formatCurrency(stagePreset.preMoney)}, median round {formatCurrency(stagePreset.roundSize)},
            target option pool {formatPercent(stagePreset.optionPoolTarget)}.
          </p>
          <p className="mt-2 text-amber-900/80">{stagePreset.note}</p>
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
            <input
              type="number"
              value={config.currentPreMoney}
              onChange={(event) => onChange({ currentPreMoney: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Current round size or raise amount"
            hint="This is the cash the company has to buy time to the next milestone or qualified financing."
          >
            <input
              type="number"
              value={config.currentRoundSize}
              onChange={(event) => onChange({ currentRoundSize: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
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
        </div>
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
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold">Instrument terms</h3>
          <p className="mt-1 text-sm text-slate-500">
            Keep this standard-friendly. The simulator explains complex term-sheet tricks but does not fully model them.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="SAFE post-money cap"
            hint="For post-money SAFEs, a lower cap locks more future ownership for the investor before the Series A price is known."
          >
            <input
              type="number"
              value={config.safe.postMoneyCap}
              onChange={(event) => onNestedChange("safe", { postMoneyCap: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="SAFE investment"
            hint="This check converts when a qualified financing happens and adds to the investor's preference stack."
          >
            <input
              type="number"
              value={config.safe.investment}
              onChange={(event) => onNestedChange("safe", { investment: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
          <Field
            label="Note cap"
            hint="Notes price as the better of cap or discount and stay senior to equity in weak exits, so they can be harsher than a clean equity round."
          >
            <input
              type="number"
              value={config.note.preMoneyCap}
              onChange={(event) => onNestedChange("note", { preMoneyCap: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
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
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold">Stakeholder controls</h3>
          <p className="mt-1 text-sm text-slate-500">
            These inputs determine how much the current investor can defend ownership and how much value employees must create to clear exercise cost.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Investor initial check"
            hint="This is the base capital at risk for the modeled investor and anchors return-the-fund math."
          >
            <input
              type="number"
              value={config.investor.initialCheck}
              onChange={(event) => onNestedChange("investor", { initialCheck: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
            />
          </Field>
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
            <input
              type="number"
              step="0.01"
              value={config.employee.strikePrice}
              onChange={(event) => onNestedChange("employee", { strikePrice: numberValue(event) })}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm"
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
        </div>
      </section>
    </div>
  );
}
