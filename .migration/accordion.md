# accordion

2026-07-04, golden pair via CLI (`pnpm exec shadcn add accordion --yes`), Base UI accordion wrapper added; no existing Radix accordion consumers were present.

## Changed

src/components/ui/accordion.tsx:1 added the shadcn `base-luma` accordion wrapper backed by `@base-ui/react/accordion`.

src/components/ui/accordion.tsx:6 defines `Accordion`, `AccordionItem`, `AccordionTrigger`, and `AccordionContent` with the project registry styling and existing `cn` utility.

Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/accordion.tsx` returned no matches.

## Left alone

No accordion consumers were changed because `rg -n "Accordion|accordion" src` found only the new wrapper.

Existing unrelated git changes under `.agents/skills/` and `skills-lock.json` were left untouched.

## Behavior changes

None. There was no existing accordion implementation or usage to preserve.

## Verify by hand

Render an accordion with two items, open and close each trigger, confirm only the intended panel toggles, confirm Up/Down chevrons swap, tab through triggers, and verify Enter/Space toggles the focused trigger.
