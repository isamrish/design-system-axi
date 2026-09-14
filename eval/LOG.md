# Eval log

Rules: tasks in a registration are never edited. Ranking, tokenization, and synonym changes are recorded here with before/after retrieval. New tasks are added only as a new, dated registration.

## 2026-09-13 — Registration 1

20 app-builder intents registered in `eval/tasks.json` before any `src/search/` code existed. Golden components were chosen from knowledge of Primer React, without running search.

## 2026-09-13 — Baseline (Task 17)

retrieval_top3: 15/20 (75%) · avg_tokens_per_task: 351 · raw_manifest_tokens: 608464
misses: t05 (sidebar navigation links for settings pages → PageHeader | SplitPageLayout | PageLayout, golden NavList), t11 (pick several labels from a searchable list → NavList | ActionList | FilteredActionList, golden SelectPanel), t12 (empty state when a search has no results → SelectPanel | Timeline | FilteredActionList, golden Blankslate), t13 (paginate through a long list of results → FilteredActionList | Timeline | NavList, golden Pagination), t17 (multi-line comment input → TextInput | Timeline | SkeletonText, golden Textarea)

## 2026-09-13 — Tuning attempt 1: extend STOPWORDS with filler/function words

Change: added `before`, `does`, `has`, `no`, `several`, `through` to `STOPWORDS` in `src/search/tokenize.ts`. These are auxiliary verbs, a negator, a quantifier, and a preposition — the same grammatical categories the list already stops (`are`/`be`/`is` as auxiliary "be" forms, `some` as a quantifier, `at`/`by`/`for`/`from`/`in`/`into`/`of`/`on` as prepositions). They carry no UI-domain meaning in any query, not just these tasks' wording, so stopping them generalizes.

Why it mattered: several components (notably `Timeline`, whose description is a long internal engineering note, not user-facing copy) happen to contain these common function words in free-form prose. Without stopping them, a query token like "has" or "through" spuriously matched that prose at description weight (2) and outranked the true target.

Before → after retrieval: 15/20 (75%) → 15/20 (75%). No task flipped by itself — the noise it removes only stops competing with the correct answer once a later attempt makes the correct answer's own signal strong enough to win. No regressions; all tests pass after updating `test/search/tokenize.test.ts`'s expectation for `"Confirm before deleting the repositories"` to drop `"before"` from the expected token list (intentional, since `before` is now a stopword).

Kept: retrieval did not drop, and it is a prerequisite for a later attempt's gains on t12/t13.
