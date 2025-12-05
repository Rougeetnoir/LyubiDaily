# 📄 **docs/sync/02-step-activities.md**

## Step 02 — Supabase Sync for Activities (MVP Phase 1)

### Goal

Implement cloud sync for the `Activity` domain model using Supabase as the source of truth, with localStorage used only as fallback.  
Do **not** modify UI components in this step.

---

## APIs to Implement

### 1. `fetchActivitiesFromSupabase(): Promise<Activity[]>`

**Behavior**

- Query `public.activities`
    
- Order by `created_at` ascending
    
- Map DB rows into front-end `Activity`
    
- Convert `created_at` / `updated_at` from ISO strings → number (ms)
    
- Return empty array if no results
    

---

### 2. `upsertActivitiesToSupabase(list: Activity[]): Promise<Activity[]>`

**Behavior**

- Convert Activity → ActivityRow  
    ms → ISO strings
    
- Use Supabase `.upsert(payload, { onConflict: 'id' })`
    
- Return updated list of activities
    
- Do **not** modify UI state here — only return values
    

---

### 3. `deleteActivity(id: string): Promise<void>`

**Behavior**

- Delete from `public.activities` where `id` matches
    
- DB should cascade delete related `records` (already defined)
    
- Do not fail UI; catch errors gracefully
    

---

## Data Mapping Rules

### ActivityRow (DB)

`{   id: string(uuid),   name: string,   icon: string | null,   color: string | null,   created_at: string(ISO),   updated_at: string(ISO) }`

### Activity (Front-end)

`{   id: string,   name: string,   icon?: string,   color?: string,   createdAt: number,   // ms   updatedAt: number    // ms }`

---

## Error Handling

- Do **not** crash UI if Supabase fails
    
- Log the error
    
- Fallback: localStorage activities remain valid
    
- Codex should not implement retry or offline mode
    

---

# 📌 Constraints

- Do **not** modify UI files
    
- Do **not** implement RecordItem logic
    
- Do **not** implement integration into App.tsx yet
    
- Only Activity-related Supabase logic
    

---

# 📌 Output

Codex should produce updated implementations for:

- `fetchActivitiesFromSupabase`
    
- `upsertActivitiesToSupabase`
    
- `deleteActivity`
    

in the correct TypeScript file (`storage.ts` or as defined by the project).