# Step 04 — Integrate Supabase Sync Into App UI (MVP)

## 🎯 Goal

Integrate the Activities + Records Supabase sync APIs into the React UI **without redesigning UI components**, achieving:

- App initializes by loading data from Supabase
    
- Fallback to localStorage only if Supabase empty or unreachable
    
- UI operations (add/edit/delete) write through Supabase
    
- Timeline always reflects Supabase as the source of truth
    
- No breaking changes to the UI or interaction flows
    

This step **connects** Step 02 + Step 03 APIs to the application.

---

# 1. App-Level Initialization

Modify `src/App.tsx` to execute the following logic when the app starts (inside a top-level `useEffect`):

`On app startup:  1. Load activities from Supabase using fetchActivitiesFromSupabase()    - If Supabase returns items:        • Use them in state        • Save to localStorage as fallback    - If Supabase fails OR empty:        • Use loadActivities() fallback        • upsert default activities to Supabase  2. For the currently selected date (today by default):    - Fetch records from Supabase via fetchRecordsByDate(date)    - If Supabase fails:        • Use loadRecords() fallback for that date only  3. After both are loaded:    - Render the UI normally`

State should now treat Supabase as **source of truth**.

---

# 2. Wiring RecordItem Operations to Supabase

Update the handlers in App or timeline-related components.

### 2.1 Create a new RecordItem

When user manually adds or uses the inline editor:

`1. Build a RecordItem object with local temp id if needed 2. Call insertRecord() 3. Replace local temp id with returned official id 4. Update UI state with the returned record 5. Save updated list to localStorage as fallback`

### 2.2 Edit a RecordItem

`1. Call updateRecord(item) 2. Replace the existing entry in state 3. Save updated list to localStorage`

### 2.3 Delete a RecordItem

`1. Call deleteRecord(id) 2. Remove from UI state 3. Save updated state to localStorage`

---

# 3. Wiring Activity Operations to Supabase

### 3.1 When user adds/edits an Activity

`1. Update local state immediately for responsiveness 2. Call upsertActivitiesToSupabase(updatedList) 3. Replace local state with returned list (authoritative) 4. Save returned list to localStorage fallback`

### 3.2 When user deletes an Activity

`1. Remove the activity locally 2. Call deleteActivity(id) 3. Reload records for that date (deleted activity might cascade) 4. Save updated activity list to localStorage`

---

# 4. Date Switching (Daily Timeline Behavior)

Whenever the selected date changes:

`1. Call fetchRecordsByDate(date) 2. If Supabase succeeds:      • Use returned records      • Save to local fallback 3. If Supabase fails:      • Use filtered localStorage records for that date only`

State update is UI-only; no localStorage overwrite when Supabase fails.

---

# 5. Error Handling & User Experience

Codex must follow these error-handling rules:

`• Never block UI rendering • All Supabase errors must be logged via console.error • If network errors occur:       Show a non-intrusive toast/snackbar:       "Cloud sync failed, using local data" • UI must remain fully functional offline • Do not retry automatically`

Toast implementation can be minimal (existing toast system or a new helper).

---

# 6. State Management Rules

### Supabase is authoritative.

`UI State ← Supabase localStorage ← fallback only`

### When Supabase returns new data:

`• Always replace local state with server-returned data • Then write to localStorage`

### When Supabase fails:

`• DO NOT overwrite localStorage (avoid corrupting fallback data) • DO NOT clear Supabase data`

---

# 7. Code Boundaries (Codex must respect)

### Allowed files:

- `src/App.tsx`
    
- `src/storage.ts` (read-only except integrating calls)
    
- timeline components if needed for handler wiring
    
- activity selector components to wire save/delete events
    

### Forbidden:

- Do not redesign UI or change component structure
    
- Do not modify tailwind/CSS
    
- Do not delete localStorage functions
    
- Do not introduce new libraries
    
- Do not create new contexts or reducers (unless absolutely necessary)
    

---

# 8. Expected Output

Codex should output:

- Updated `App.tsx` with initialization flow
    
- Updated handler functions for:
    
    - add/edit/delete RecordItem
        
    - add/edit/delete Activity
        
    - date switching logic
        
- LocalStorage fallback calls inserted appropriately
    
- Full integration of Step 02 + Step 03 Supabase APIs
    

**UI must remain visually unchanged.**

---

# 9. Completion Criteria

Step 04 is considered complete when:

- App loads activities & records from Supabase correctly
    
- Timeline displays correct data
    
- Editing actions write through Supabase
    
- LocalStorage is only fallback
    
- UI works correctly offline
    
- No console errors in normal use
    

---

# 🔚 End of Step 04

(After completion, proceed to optional Step 05: background sync & conflict resolution.)