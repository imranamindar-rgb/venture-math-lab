# Venture Math Execution Roadmap

## Objective

Move Venture Math Lab from a strong beta to a product that sophisticated founders, investors, and educators can trust, use repeatedly, and share without apology.

This roadmap is sequenced by risk, not by novelty.

- First: fix trust leaks
- Second: improve output quality and decision usefulness
- Third: deepen venture realism
- Fourth: add the layers that make the product hard to replace

## Current Position

### Phase 1 progress as of March 20, 2026

Completed in the latest implementation sprint:

- canonical current-financing helper now aligns priced round, SAFE, and note semantics across engines
- priced rounds now respect total round size separately from the modeled investor check
- pre-conversion SAFE and note holders now receive downside liquidity-event payouts instead of being implicitly zeroed out
- note conversion now anchors to the next qualified round pre-money in the deterministic and Monte Carlo engines
- employee exercise outputs now distinguish gross value from net-after-exercise proceeds
- acquisition versus IPO labeling and histogram bucket labels are now aligned to the implemented math

Still open inside Phase 1:

- replace contradictory inputs with stricter derived-field UI and validation, instead of warning-only handling
- rerun the full institutional audit documents so the written evaluation reflects the fixed model state

### Phase 2 progress as of March 20, 2026

Completed in the latest implementation sprint:

- scenario diagnostics now surface `standard`, `approximate`, and `unsupported` support tags in the workspace, compare view, methodology, and report output
- added a shareable `/report` surface with assumptions, deterministic thresholds, Monte Carlo takeaways, waterfall checkpoints, and print support
- added CSV export with assumptions and cross-engine output sections
- compare mode now shows assumption-shift cards instead of only top-line outcome deltas
- preferred-term controls now support configurable liquidation multiples plus participating preferred on the aggregated waterfall engine

Still open inside Phase 2:

- dedicated board-grade narrative summary cards with memo-quality copy
- PDF-friendly branded report formatting beyond browser print mode
- richer compare mode across all three engines with explicit change attribution by valuation, dilution, reserves, and term structure

### What the product already does well

- Three-engine architecture is correct
- Core venture questions are relevant
- Deterministic math is often strong in standard cases
- Monte Carlo runs quickly and reproducibly
- Cap-table and waterfall views are useful for standard-friendly scenarios
- Educational tone is strong enough to build on

### What is holding the product back

- contradictory capital semantics
- incomplete SAFE exit realism
- oversimplified preferred stack logic
- mislabeled or weakly explained outputs
- weak export/shareability
- no fund construction or portfolio layer
- not enough cash/operating-finance context for founders and executives

## Roadmap Principles

1. Trust before breadth
2. Exact before approximate
3. Explain assumptions next to outputs
4. Build outputs people can use in real conversations
5. Expand into fund math only after company-level trust is strong

## Phase 1: Trust Floor

### Goal

Remove the issues that make sophisticated users question whether the app is safe to rely on.

### Duration

2 to 4 weeks

### Workstreams

#### 1. Canonical capital model

Replace the current ambiguous money inputs with one coherent transaction model.

Required changes:

- define canonical fields for:
  - total round raise
  - modeled investor check
  - SAFE purchase amount
  - note principal
- enforce relationships between fields
- show derived fields instead of letting users set conflicting values independently
- add validation errors instead of silent normalization where inconsistency matters

Acceptance criteria:

- deterministic, Monte Carlo, and cap-table engines all consume the same transaction semantics
- no scenario can produce internally contradictory ownership/invested-capital math

#### 2. Fix security-term credibility leaks

Required changes:

- implement SAFE liquidity-event treatment consistent with YC post-money SAFE behavior
- fix note conversion anchor so it uses qualified financing logic consistently
- label unsupported terms aggressively in the UI

Acceptance criteria:

- pre-financing SAFE exits no longer zero out investor value by accident
- note conversion logic is consistent between surfaces
- users can clearly see when a scenario is standard versus approximate

#### 3. Fix output-label integrity

Required changes:

- fix employee underwater and exercise coverage metrics
- fix acquisition versus IPO classification in Monte Carlo outputs
- replace fake histogram labels with true computed bucket labels
- add legends to ownership and risk charts where needed

Acceptance criteria:

- every chart label and metric label matches the underlying implementation
- no output implies false precision or the wrong economic meaning

### Exit condition for Phase 1

The app no longer contains obvious trust failures that would make a serious user stop using it.

## Phase 2: Output and Communication Layer

### Goal

Turn the app from a thinking tool into a communication tool.

### Duration

2 to 4 weeks

### Workstreams

#### 1. Board-grade output surface

Build a report layer for every scenario.

Required features:

- executive summary card
- assumptions block
- key charts with captions
- limitations block
- exportable print view

Outputs to support:

- founder prep memo
- investor scenario summary
- classroom handout
- board discussion snapshot

#### 2. Export system

Add:

- CSV export for tables and simulation summaries
- printable PDF-friendly layout
- image-friendly chart capture support
- richer JSON schema with run metadata and methodology version

#### 3. Better compare mode

Required changes:

- compare assumptions side by side
- compare all three engines, not only top-line Monte Carlo metrics
- add change attribution:
  - valuation change
  - dilution change
  - reserve change
  - term-structure change

### Exit condition for Phase 2

Users can take outputs from the app and use them outside the product without embarrassment.

## Phase 3: Venture Realism Upgrade

### Goal

Make the app more credible to sophisticated venture users by modeling the cases that currently break trust.

### Duration

4 to 8 weeks

### Workstreams

#### 1. Cap-table and waterfall depth

Add:

- multiple preferred series
- per-series conversion choice
- seniority layering
- stacked liquidation waterfalls

Optional next step:

- participating preferred

#### 2. Down-round realism

Add:

- anti-dilution scenarios
- explicit down-round term stress case
- founder pain visualization under flat/down rounds

Progress:

- simplified anti-dilution controls are now live with `none`, `broad weighted average`, and `full ratchet` modes
- anti-dilution currently adjusts the modeled investor's aggregated preferred stack in down rounds
- participating preferred and liquidation multiples are also now configurable on the aggregated stack

Still open:

- per-series anti-dilution instead of aggregated modeled-investor treatment
- explicit founder pain and series-by-series ownership attribution in down rounds
- layered seniority and multi-series conversion choices

#### 3. Venture scenario status system

Every scenario and feature should be tagged:

- `standard`
- `approximate`
- `unsupported`

This must appear in:

- methodology
- scenario setup
- exports
- chart captions where relevant

### Exit condition for Phase 3

Sophisticated venture users no longer dismiss the product as “too simplified” in the most common high-stakes cases.

## Phase 4: Founder and Operator Intelligence Layer

### Goal

Use lessons from entrepreneurial finance to make the product more useful to operators, founders, and executive education users.

### Duration

3 to 6 weeks

### Workstreams

#### 1. Cash versus profit layer

Inspired by `Financial Intelligence for Entrepreneurs`.

Add:

- burn and runway module
- profit versus cash explanation
- operating cash flow view
- free cash flow or burn multiple framing where appropriate

Progress:

- operator lab is now live with cash on hand, monthly burn, monthly revenue, monthly growth, gross margin, runway, financing gap, and burn multiple outputs
- scenario editor now carries operating assumptions directly in the shared scenario model

Still open:

- explicit profit-versus-cash walkthroughs
- statement bridge from financing events to cash flow / balance sheet
- richer operator ratios beyond gross margin and burn multiple

#### 2. Financial literacy mode

Add:

- assumptions and estimates panel
- explain when a result is a hard identity versus an estimate
- financial statement bridge:
  - how a financing event affects cash
  - how it affects equity
  - what it does not mean for operating performance

#### 3. Operator metrics and ratios

Add:

- gross margin
- operating margin
- liquidity metrics where relevant
- working capital / cash conversion concepts for operating companies

### Exit condition for Phase 4

The app becomes useful not just for venture mechanics, but also for founder and executive financial judgment.

## Phase 5: Fund and Portfolio Expansion

### Goal

Make the product genuinely venture-firm relevant.

### Duration

6 to 10 weeks

### Workstreams

#### 1. Fund construction engine

Add:

- fund size
- fee drag
- carry
- reserve ratio
- check strategy
- ownership targets
- holding periods

Outputs:

- gross/net TVPI
- DPI
- IRR
- return-the-fund frequency
- concentration of returns

#### 2. Portfolio Monte Carlo

Add:

- many-company portfolio simulation
- power-law portfolio outcomes
- reserve strategy across portfolio
- concentration charts
- top-winner contribution analysis

#### 3. Institutional case-study library

Ship built-in venture cases:

- clean seed fund
- concentrated multi-stage fund
- AI premium portfolio
- overpricing risk case
- pro rata versus no pro rata fund outcome case

### Exit condition for Phase 5

The product is no longer only company-level. It becomes relevant to actual venture portfolio construction.

## Phase 6: World-Class Finish

### Goal

Make the product feel elite, not just capable.

### Duration

Ongoing after core trust and realism work is done

### Workstreams

#### 1. Presentation prestige

Add:

- premium chart annotations
- better legends and thresholds
- presentation mode
- boardroom print theme

#### 2. Learn mode

Add:

- expandable formulas
- “why this changed” explanations
- common mistakes callouts
- staged learning flows for:
  - founders
  - investors
  - students

#### 3. Complaint resistance

Run repeated review cycles with:

- founder users
- seed investors
- professors
- operators

The standard is:

- no one says “this is wrong”
- no one says “this is confusing”
- no one says “this is not serious”

### Exit condition for Phase 6

The product earns strong advocacy from sophisticated users, not just curiosity.

## Suggested Delivery Sequence

### Sprint 1

- canonical capital model
- output-label fixes
- stronger validation

### Sprint 2

- SAFE liquidity-event handling
- note conversion consistency
- scenario support-status tags

### Sprint 3

- printable report view
- CSV export
- assumptions block on outputs

### Sprint 4

- compare mode expansion
- better chart labeling and legends
- stronger summary copy

### Sprint 5 and beyond

- stacked preferred / per-series waterfall
- down-round realism
- cash versus profit layer
- fund construction engine

## Success Metrics

### Trust metrics

- zero contradictory scenario states
- zero mislabeled outputs in audit review
- zero severe benchmark mismatches in supported scenarios

### Product metrics

- user reaches a useful output in under 3 minutes
- report export is usable without explanation
- compare mode answers “what changed and why?” clearly

### Institutional metrics

- professors can assign it without caveat-heavy setup
- founders can use exports in fundraising prep
- investors can use it for standard-case scenario framing without eye-rolling

## What Not To Do Yet

- do not add exotic features before fixing trust
- do not expand UI surface area faster than output quality
- do not market it as definitive venture software before the trust-floor work is complete

## Recommendation

The next move is not breadth. It is discipline.

If you execute only one thing next, do this:

1. fix capital semantics
2. fix trust-damaging finance inaccuracies
3. build board-grade outputs

That sequence gives the highest probability of moving from strong beta to professional-grade software.
