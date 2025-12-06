# Step 09 — Add Basic Tests for Core Utilities (No Behavior Change)

## Goal

Add a **minimal** automated test setup for the project, focusing only on **core pure utility functions** (no UI tests, no heavy coverage requirements).

The goal is to:

- verify key time-related logic behaves as expected
- provide a starting point for future tests
- **not** change any app behavior

This step may introduce a dev-time test framework (preferably Vitest, since the project is Vite + TS).

---

## 1. Scope

You may:

- Add a test runner/dev dependency (Vitest recommended).
- Add one or more test files for pure functions, especially:
  - `src/timeUtils.ts`
- Optionally add minimal tests for any other clearly pure utility functions if present.
- Add test-related scripts to `package.json` (e.g. `test`, `test:watch`).

You must NOT:

- Modify UI components’ behavior.
- Change existing production logic in `timeUtils.ts` or other files (except for tiny refactors to make functions testable, e.g. export a helper).
- Introduce complex configuration or heavy libraries (no Jest + extra layers if Vitest is available).

---

## 2. Test Framework Choice

Prefer **Vitest** (fits Vite + TS):

1. Add Vitest as a dev dependency (if not already present).
2. Optionally use `@vitest/ui` / `@vitest/coverage-*` only if very simple, but not required.
3. Ensure tests can be run via:

   ```bash
   npm run test
If the project already has Vitest or another test framework configured, reuse it instead of adding a new one.

3. Target: src/timeUtils.ts
Create tests for the key time-related functions used to:

filter or group records by date

sort records by time

compute durations (if there is a function that derives duration from start/end)

3.1 Identify functions
In src/timeUtils.ts, identify functions such as (names are examples):

isSameDate(record, date) or equivalent

sortRecordsByTime(records) or equivalent

any helper that computes a record’s duration or merges timeline segments

If functions are currently not exported but are pure and useful for testing, you may export them for test purposes, but do not change their internal logic.

3.2 Example tests to add
For each chosen function, add 2–4 small tests:

Date filtering

Given records with different date values, ensure the filter returns only those matching the target date.

Test at least:

matching date

non-matching date

boundary conditions (e.g. empty list).

Time sorting

Given records with:

startTime in different orders (e.g. "08:00", "13:00", "09:30")

Ensure the sorted list is always from earliest start time to latest.

Duration computation (if a pure helper exists)

Given startTime and endTime, ensure:

duration is correct in minutes or milliseconds (whatever the project uses)

simple cases: 08:00–09:00, 10:15–10:45

edge-case: zero or very small intervals

Use realistic sample RecordItem objects matching src/types.ts.

4. Project Integration
4.1 package.json scripts
Add or update the following minimal scripts:

js
Copy code
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
If vitest is already present, reuse/upate existing scripts rather than duplicating.

4.2 Test file placement
Place test files under either:

src/__tests__/timeUtils.test.ts, or

src/timeUtils.test.ts

Choose whichever pattern is consistent with the existing project style (if none, src/__tests__/ is preferred).

5. Running Tests
Ensure that after this step:

bash
Copy code
npm run test
runs successfully and reports passing tests for the time utilities.

No tests should depend on Supabase/network/React.
All tests should be pure and fast.

6. Non-goals
This step MUST NOT:

Add tests for UI components, modals, or Supabase integration (too heavy for now).

Change the behavior of the app in any way.

Require additional configuration beyond what is necessary for Vitest + TS to run.

7. Output & Summary
At the end of this step, the codebase should have:

A minimal test framework configured (Vitest or existing one).

At least one test file covering core logic in src/timeUtils.ts.

A working npm run test command with all tests passing.

Please provide a short summary describing:

Which files were created or modified (e.g. test files and config).

Which functions in timeUtils.ts are covered by tests.

How to run the tests (confirming the script name).

App runtime behavior must remain unchanged.