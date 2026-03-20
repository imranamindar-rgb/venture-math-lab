# Shortcomings Analysis

## Overview

The product’s weaknesses fall into two layers:

- **Layer A: obvious shortcomings**
- **Layer B: subtle shortcomings**

Both matter. The obvious issues create direct trust failures. The subtle issues prevent the product from feeling exceptional even when it is technically working.

## Layer A: Obvious Shortcomings

### 1. Inconsistent capital semantics

The app allows multiple money fields to diverge:

- `currentRoundSize`
- `investor.initialCheck`
- `safe.investment`
- `note.principal`

Different engines consume different fields. This is not just a UX issue. It is a structural credibility problem.

### 2. SAFE liquidity-event realism is missing

Before qualified financing, SAFE holders are effectively treated as having no claim in exits. That is inconsistent with YC-style liquidity-event treatment.

### 3. Preferred stack realism is too compressed

The waterfall engine makes one aggregate convert-or-stay election for the entire preferred stack. That is inadequate for serious venture analysis.

### 4. Employee option outputs are mislabeled

“Underwater” and “exercise coverage” imply more economic fidelity than the implementation provides.

### 5. Histogram labels are misleading

The bars are generated from dynamic bucket edges, but the labels imply fixed numeric bins.

### 6. Compare mode is too shallow

It surfaces only a thin slice of what sophisticated users actually want to compare.

### 7. Export quality is poor

JSON export is functional, but not useful for boardrooms, memo writing, or teaching.

### 8. Fund construction is absent

Any product that wants to become the definitive venture math platform cannot stop at company-level scenarios.

## Layer B: Subtle Shortcomings

### 1. The product looks slightly more authoritative than it is

This is the most dangerous subtle weakness. The interface is polished enough to signal seriousness, but not all results deserve that level of trust.

### 2. The product still feels like a tool, not a system

The three engines exist, but the product experience does not yet unify them into one unmistakably authoritative workflow.

### 3. Output prestige is underdeveloped

The app helps users think, but it does not help them communicate those thoughts at an elite level.

### 4. Scenario status is emotionally ambiguous

The product does not clearly tell users which scenarios are:

- standard and strong
- approximate and caveated
- unsupported and unsafe

### 5. Pedagogical sequencing is incomplete

Users can learn from the app, but the app does not yet reliably lead them from naive understanding to sophisticated judgment.

### 6. There is not enough institutional dignity in the presentation layer

The current design is tasteful, but not commanding. It does not yet create the quiet confidence that premium analytical software needs.

### 7. Complaint resistance is low

Smart users will not just ask for more. They will point to things that feel wrong, shallow, or not fully serious.

## Good vs Excellent vs World Class

### What makes the product good

- Solid architecture
- Relevant questions
- Useful teaching value
- Good baseline mechanics

### What would make the product excellent

- consistent semantics
- harder validation
- richer outputs
- clearer limitations
- more serious scenario coverage

### What would make the product world class

- no trust leaks
- no prestige deficit
- no ambiguity about what is modeled
- elite communication surfaces
- product flows that feel inevitable, not assembled

## The Most Important Distinction

The app is **not failing because it lacks every advanced feature**. It is falling short because the current mix of polish and simplification creates a narrow but real gap between appearance and institutional readiness.
