"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useRef, useState } from "react";

import { presetOptions, useScenarioStore } from "@/lib/state/scenario-store";
import { ScenarioEditor } from "@/components/simulator/ScenarioEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SupportBadge } from "@/components/ui/SupportBadge";
import { analyzeScenario } from "@/lib/scenario-diagnostics";
import { buildScenarioCsv } from "@/lib/export";
import { formatCurrency } from "@/lib/format";

interface PrimaryAction {
  label: string;
  busyLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ActiveScenarioPanelProps {
  modeLabel: string;
  title: string;
  guidanceTitle: string;
  guidanceBody: string;
  hintWhenReady: string;
  primaryAction?: PrimaryAction;
}

export function ActiveScenarioPanel({
  modeLabel,
  title,
  guidanceTitle,
  guidanceBody,
  hintWhenReady,
  primaryAction,
}: ActiveScenarioPanelProps) {
  const {
    active,
    saved,
    setActivePreset,
    updateActive,
    updateNested,
    saveScenario,
    exportScenarioFile,
    importScenarioFile,
  } = useScenarioStore();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalOwnership =
    active.capTable.founderPercent +
    active.capTable.employeeCommonPercent +
    active.capTable.employeePoolPercent +
    active.capTable.priorInvestorPercent;

  const importHint = useMemo(() => {
    if (importStatus) {
      return importStatus;
    }

    return hintWhenReady;
  }, [hintWhenReady, importStatus]);
  const diagnostics = useMemo(() => analyzeScenario(active), [active]);

  const handleExport = () => {
    const payload = exportScenarioFile("active");
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.id}-scenario.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const payload = buildScenarioCsv(active);
    const blob = new Blob([payload], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.id}-summary.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = importScenarioFile(payload, "active");
      setImportStatus(result.ok ? "Scenario imported." : result.error);
    } catch {
      setImportStatus("Import failed. Make sure the file is valid JSON.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b border-border/70 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{modeLabel}</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">{title}</h1>
            </div>
            <select
              value={active.id}
              onChange={(event) => setActivePreset(event.target.value)}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm"
            >
              {presetOptions.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{active.description}</p>
        </div>

        <div className="space-y-5 pt-5">
          <div className="rounded-panel border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">{guidanceTitle}</p>
              <SupportBadge level={diagnostics.supportLevel} label={diagnostics.supportLabel} />
            </div>
            <p className="mt-2 leading-6">{guidanceBody}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{diagnostics.summary}</p>
          </div>

          <ScenarioEditor
            config={active}
            onChange={updateActive}
            onNestedChange={(key, patch) => updateNested("active", key, patch)}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          {primaryAction ? (
            <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled || primaryAction.loading}>
              {primaryAction.loading ? primaryAction.busyLabel ?? primaryAction.label : primaryAction.label}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => saveScenario("active")}>
            Save snapshot
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="secondary" onClick={handleExportCsv}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </Button>
          <Link
            href="/report"
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Open report
          </Link>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Ownership input total:{" "}
          <span
            className={
              Math.abs(totalOwnership - 100) <= 0.5 ? "font-semibold text-emerald-800" : "font-semibold text-amber-900"
            }
          >
            {totalOwnership.toFixed(1)}%
          </span>
          . The engine normalizes the mix if it is not exactly 100%.
        </p>
        <p className="mt-2 text-sm text-slate-500">{importHint}</p>
        {diagnostics.issues.length > 0 ? (
          <div className="mt-4 space-y-2">
            {diagnostics.issues.slice(0, 4).map((issue) => (
              <div
                key={`${issue.level}-${issue.title}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-900">{issue.title}</p>
                <p className="mt-1 leading-6 text-slate-600">{issue.detail}</p>
              </div>
            ))}
          </div>
        ) : null}
        {saved.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {saved.slice(0, 4).map((snapshot) => (
              <button
                key={snapshot.id}
                type="button"
                onClick={() => updateActive(snapshot.config)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-slate-600 hover:border-primary/40 hover:text-slate-950"
              >
                {snapshot.name}
              </button>
            ))}
          </div>
        ) : null}
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
          Active scenario: {active.name} | Reference raise {formatCurrency(active.currentRoundSize)}
        </p>
      </Card>
    </div>
  );
}
