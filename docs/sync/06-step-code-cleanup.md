#### Step 06 — Code Cleanup & Minor Refactors (No Behavioral Change)

##### Goal

Improve code quality for the Supabase-enabled Daily Time Ledger app by:

- removing unused / dead code
    
- fixing obvious lint/TS issues
    
- simplifying complex logic where safe
    

**Without changing user-visible behavior or breaking Supabase sync.**

---

### 1. Scope (files allowed to modify)

This step may modify:

- `src/App.tsx`
    
- `src/storage.ts`
    
- `src/timeUtils.ts`
    
- `src/types.ts`
    

Other files should not be changed.

---

### 2. Cleanup tasks

#### 2.1 Unused imports / dead code

- Remove unused imports, variables, functions, and React components.
    
- Remove commented-out code blocks that are no longer relevant.
    
- Ensure any removed helper is truly unused; do not delete public APIs used by other files.
    

#### 2.2 TypeScript & typings

- Make `Activity` / `RecordItem` / related types consistent:
    
    - Avoid duplicate or overlapping types for the same concept.
        
    - Prefer a single source-of-truth definition in `src/types.ts`.
        
- If narrowing types improves safety (e.g. `string | null` → `string | null | undefined` handled at edges), do it in a minimal way.
    
- Do not change the shape of data coming from Supabase; keep DB mappings intact.
    

#### 2.3 Simplify logic

- In `App.tsx`, identify obviously repeated logic for:
    
    - loading activities & records
        
    - merging Supabase data with localStorage
        
    - syncing and showing the cloud-sync banner
        
- Extract small reusable helpers or custom hooks **inside the same file** where it improves readability, e.g.:
    
    - `useCloudSyncBanner()`
        
    - `deriveRecordsForDate()`
        
- Keep component props and overall structure the same; do not change how UI is composed.
    

---

### 3. Performance micro-optimizations (optional, safe only)

- Where there is heavy recalculation on every render, consider:
    
    - `useMemo` for derived arrays/lists (e.g. filtered records for the selected date).
        
    - `useCallback` for callbacks passed into deep child components.
        
- Only add memoization if:
    
    - It clearly reduces repeated computation, **and**
        
    - It does not change behavior and is easy to understand.
        

---

### 4. Error handling consistency

- Ensure all Supabase-related functions in `storage.ts`:
    
    - Either throw errors consistently, or
        
    - Return fallbacks consistently (as currently intended).
        
- Keep the existing contract used by `App.tsx`:
    
    - Do not change return types or throw/catch behavior at call sites.
        
- If you find duplicate error-logging code, consider extracting a small helper.
    

---

### 5. Non-goals (must NOT do)

- No UI redesign (layout, CSS, texts must stay the same).
    
- No changes to env var usage (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
    
- No changes to Supabase table names or column mappings.
    
- No introduction of new dependencies (no extra npm packages).
    
- No routing/layout reorganization.
    

---

### 6. Output & summary

At the end of this step, provide a short summary describing:

- What unused code/imports were removed (high-level).
    
- Which helpers/hooks were extracted and why.
    
- Any TypeScript typing simplifications made.
    

Behavior of the app must remain the same:

- Supabase sync works exactly as in Step 05.
    
- Offline fallback and the cloud-sync banner work as before.