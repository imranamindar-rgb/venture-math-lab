import { FundingStage } from "@/lib/sim/types";

export interface VintageBenchmark {
  id: string;
  label: string;
  note: string;
  stage: FundingStage;
  timeline: Array<{
    year: number;
    dpi: number;
    tvpi: number;
  }>;
}

const benchmarks: Record<FundingStage, VintageBenchmark[]> = {
  pre_seed: [
    {
      id: "pre_seed_2018",
      label: "2018 pre-seed",
      note: "Contextual reference overlay for a disciplined pre-seed vintage with slower DPI and modest TVPI maturation.",
      stage: "pre_seed",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0, tvpi: 0.8 },
        { year: 2, dpi: 0.01, tvpi: 0.88 },
        { year: 3, dpi: 0.04, tvpi: 1.0 },
        { year: 4, dpi: 0.1, tvpi: 1.18 },
        { year: 5, dpi: 0.22, tvpi: 1.45 },
        { year: 6, dpi: 0.38, tvpi: 1.75 },
        { year: 7, dpi: 0.6, tvpi: 2.05 },
        { year: 8, dpi: 0.88, tvpi: 2.28 },
        { year: 9, dpi: 1.1, tvpi: 2.4 },
        { year: 10, dpi: 1.28, tvpi: 2.48 },
      ],
    },
    {
      id: "pre_seed_2022",
      label: "2022 pre-seed reset",
      note: "Contextual reference overlay for tighter post-reset vintages with slower markup velocity.",
      stage: "pre_seed",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0, tvpi: 0.72 },
        { year: 2, dpi: 0.01, tvpi: 0.8 },
        { year: 3, dpi: 0.03, tvpi: 0.9 },
        { year: 4, dpi: 0.08, tvpi: 1.02 },
        { year: 5, dpi: 0.16, tvpi: 1.2 },
        { year: 6, dpi: 0.28, tvpi: 1.42 },
        { year: 7, dpi: 0.42, tvpi: 1.65 },
        { year: 8, dpi: 0.6, tvpi: 1.82 },
        { year: 9, dpi: 0.78, tvpi: 1.95 },
        { year: 10, dpi: 0.95, tvpi: 2.02 },
      ],
    },
  ],
  seed: [
    {
      id: "seed_2018",
      label: "2018 seed",
      note: "Contextual reference overlay for a balanced seed vintage with steady distributions and moderate concentration.",
      stage: "seed",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0, tvpi: 0.84 },
        { year: 2, dpi: 0.01, tvpi: 0.92 },
        { year: 3, dpi: 0.05, tvpi: 1.04 },
        { year: 4, dpi: 0.14, tvpi: 1.28 },
        { year: 5, dpi: 0.28, tvpi: 1.62 },
        { year: 6, dpi: 0.48, tvpi: 2.02 },
        { year: 7, dpi: 0.76, tvpi: 2.38 },
        { year: 8, dpi: 1.02, tvpi: 2.6 },
        { year: 9, dpi: 1.26, tvpi: 2.72 },
        { year: 10, dpi: 1.42, tvpi: 2.78 },
      ],
    },
    {
      id: "seed_2020",
      label: "2020 expansion seed",
      note: "Contextual reference overlay for expansion-era seed vintages with higher TVPI and later DPI catch-up.",
      stage: "seed",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0, tvpi: 0.9 },
        { year: 2, dpi: 0.01, tvpi: 1.02 },
        { year: 3, dpi: 0.04, tvpi: 1.22 },
        { year: 4, dpi: 0.1, tvpi: 1.55 },
        { year: 5, dpi: 0.2, tvpi: 2.02 },
        { year: 6, dpi: 0.38, tvpi: 2.62 },
        { year: 7, dpi: 0.66, tvpi: 3.15 },
        { year: 8, dpi: 1.0, tvpi: 3.42 },
        { year: 9, dpi: 1.32, tvpi: 3.56 },
        { year: 10, dpi: 1.58, tvpi: 3.64 },
      ],
    },
    {
      id: "seed_2022",
      label: "2022 reset seed",
      note: "Contextual reference overlay for post-reset seed vintages with cleaner pricing and slower markups.",
      stage: "seed",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0, tvpi: 0.78 },
        { year: 2, dpi: 0.01, tvpi: 0.84 },
        { year: 3, dpi: 0.03, tvpi: 0.94 },
        { year: 4, dpi: 0.08, tvpi: 1.08 },
        { year: 5, dpi: 0.18, tvpi: 1.34 },
        { year: 6, dpi: 0.34, tvpi: 1.7 },
        { year: 7, dpi: 0.56, tvpi: 2.02 },
        { year: 8, dpi: 0.82, tvpi: 2.24 },
        { year: 9, dpi: 1.02, tvpi: 2.34 },
        { year: 10, dpi: 1.18, tvpi: 2.4 },
      ],
    },
  ],
  series_a: [
    {
      id: "series_a_2018",
      label: "2018 Series A",
      note: "Contextual reference overlay for post-seed vintages with faster DPI and narrower upside tails.",
      stage: "series_a",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0.02, tvpi: 0.88 },
        { year: 2, dpi: 0.08, tvpi: 1.02 },
        { year: 3, dpi: 0.2, tvpi: 1.26 },
        { year: 4, dpi: 0.4, tvpi: 1.58 },
        { year: 5, dpi: 0.7, tvpi: 1.92 },
        { year: 6, dpi: 1.02, tvpi: 2.16 },
        { year: 7, dpi: 1.28, tvpi: 2.28 },
        { year: 8, dpi: 1.44, tvpi: 2.34 },
        { year: 9, dpi: 1.52, tvpi: 2.36 },
        { year: 10, dpi: 1.58, tvpi: 2.38 },
      ],
    },
  ],
  series_b: [
    {
      id: "series_b_2019",
      label: "2019 Series B",
      note: "Contextual reference overlay for later-stage funds with tighter dispersion and faster liquidation.",
      stage: "series_b",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0.05, tvpi: 0.92 },
        { year: 2, dpi: 0.2, tvpi: 1.08 },
        { year: 3, dpi: 0.48, tvpi: 1.34 },
        { year: 4, dpi: 0.82, tvpi: 1.6 },
        { year: 5, dpi: 1.12, tvpi: 1.78 },
        { year: 6, dpi: 1.34, tvpi: 1.9 },
        { year: 7, dpi: 1.46, tvpi: 1.96 },
        { year: 8, dpi: 1.52, tvpi: 1.98 },
        { year: 9, dpi: 1.54, tvpi: 1.99 },
        { year: 10, dpi: 1.55, tvpi: 2.0 },
      ],
    },
  ],
  series_c: [
    {
      id: "series_c_2019",
      label: "2019 Growth",
      note: "Contextual reference overlay for growth vintages with quick DPI and lower ultimate TVPI.",
      stage: "series_c",
      timeline: [
        { year: 0, dpi: 0, tvpi: 0 },
        { year: 1, dpi: 0.08, tvpi: 0.94 },
        { year: 2, dpi: 0.28, tvpi: 1.08 },
        { year: 3, dpi: 0.62, tvpi: 1.24 },
        { year: 4, dpi: 0.98, tvpi: 1.42 },
        { year: 5, dpi: 1.24, tvpi: 1.56 },
        { year: 6, dpi: 1.4, tvpi: 1.66 },
        { year: 7, dpi: 1.48, tvpi: 1.7 },
        { year: 8, dpi: 1.52, tvpi: 1.72 },
        { year: 9, dpi: 1.54, tvpi: 1.73 },
        { year: 10, dpi: 1.55, tvpi: 1.74 },
      ],
    },
  ],
};

export function getVintageBenchmarks(stage: FundingStage) {
  return benchmarks[stage];
}
