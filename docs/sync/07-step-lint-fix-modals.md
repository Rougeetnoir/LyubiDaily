
---

## 📄 `docs/sync/07-step-lint-fix-modals.md`

```md
# Step 07 — Fix Lint Issues in Modals (No Behavior Change)

## Goal

Fix existing lint warnings in the modal components:

- `src/components/EditEntryModal.tsx`
- `src/components/ManualEntryModal.tsx`

without changing user-visible behavior or breaking Supabase sync logic.

This step focuses only on React/TypeScript/lint correctness and code clarity.

---

## 1. Scope

You may modify:

- `src/components/EditEntryModal.tsx`
- `src/components/ManualEntryModal.tsx`

You must NOT modify:

- Supabase client setup
- Storage APIs in `src/storage.ts`
- App bootstrap logic in `src/App.tsx`
- Visual layout or Tailwind classes (do not redesign the UI)

Behavior of the modals (open/close, form population, submit actions) must remain exactly the same.

---

## 2. Lint Issues to Address

Typical issues to fix include (but are not limited to):

- `React Hook useEffect has a missing dependency` warnings
- `setState` usage inside `useEffect` that triggers lint complaints
- Unused variables/imports inside these modal files
- Any ESLint/TypeScript warnings specific to these two files

For example:

- Effects that depend on props like `isOpen`, `initialValue`, `record`, etc. must list them in the dependency array.
- If an effect is only meant to run once on mount, refactor accordingly (e.g. split logic or memoize values) without changing behavior.

---

## 3. Behavioral Constraints

The following behaviors must be preserved:

- When the modal opens:
  - Existing values (for edit) are correctly loaded into the local form state.
  - Empty/default values are correctly set for “create” flows.
- When the modal closes:
  - Local state is reset only as before (no regression).
- When the user edits fields and submits:
  - The same callback props are invoked with the same payload shape as before.
- When the user cancels:
  - The modal closes and does not leak stale state into subsequent openings.

If you need to refactor `useEffect` logic or internal state initialization, do so in a way that preserves all existing UX.

---

## 4. Recommended Refactor Patterns

You may use the following patterns to fix lint warnings in a safe way:

1. **Derived State from Props (on open)**

   If you currently have something like:

   ```ts
   useEffect(() => {
     if (isOpen) {
       setFormState(fromRecord(record));
     }
   }, [isOpen]); // lint complains about missing record
```

Then either:

- Add `record` to dependency array:
    
    ```ts
    useEffect(() => {
      if (isOpen) {
        setFormState(fromRecord(record));
      }
    }, [isOpen, record]);
    ```
    
- Or, if the function is stable, include it as well:
    
    ```ts
    useEffect(() => {
      if (isOpen) {
        setFormState(fromRecord(record));
      }
    }, [isOpen, record, fromRecord]);
    ```
    

Ensure this does not change how many times the state is reset while the modal is open.

2. **Avoid “run on every render” bugs**
    
    - If the effect is intended to run only when `isOpen` changes from false → true, keep the guard `if (!isOpen) return;` inside the effect.
        
    - Do not move logic into render body that would cause uncontrolled re-renders.
        
3. **State initialization**
    
    - If some initial form state can be derived once from props when the modal opens, it is acceptable to:
        
        - use a helper like `getInitialFormState(props)` inside the effect, or
            
        - reset the form on `isOpen === false` if that matches current behavior.
            

---

## 5. Type & Props Consistency

- Do not change the public props interface of `EditEntryModal` and `ManualEntryModal`.
    
- Do not change the shape of data passed via callbacks (e.g. onSave, onClose).
    
- You may tighten internal types if it helps (e.g. avoid `any`), but ensure external usage remains valid.
    

---

## 6. Non-goals (must NOT do)

- No new UI elements or design changes.
    
- No changes to translations or user-facing text.
    
- No changes to Supabase-related logic or imports.
    
- No new dependencies (no additional npm packages).
    

---

## 7. Output & Summary

At the end of this step:

- `npm run lint` should no longer report warnings/errors for:
    
    - `src/components/EditEntryModal.tsx`
        
    - `src/components/ManualEntryModal.tsx`
        
- Provide a short summary describing:
    
    - Which lint issues were fixed (e.g. missing deps, state initialization).
        
    - Any effects that were refactored and how behavior was preserved.
        

App behavior, including modal interactions and Supabase sync, must remain unchanged.
