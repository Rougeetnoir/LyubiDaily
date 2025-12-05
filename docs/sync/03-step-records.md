# Step 03 — Supabase Sync for RecordItem (Timeline Records)

## Goal

Implement full Supabase CRUD support for **RecordItem** — the user's daily timeline entries.

This step does **not** modify UI components.  
It only provides the data-layer API that the UI will call later (Step 04).

Supabase is the **source of truth**;  
localStorage remains as a fallback (not authoritative).

---

# 1. RecordItem Data Model

### Front-end Type (existing)

`type RecordItem = {   id: string   activityId: string        // FK to activities.id   date: string              // YYYY-MM-DD   startTime: string         // HH:mm   endTime: string           // HH:mm   createdAt: number         // timestamp (ms)   updatedAt: number         // timestamp (ms) }`

### Expected Supabase Table `public.records`

|Column|Type|Notes|
|---|---|---|
|id|uuid|PK (default gen_random_uuid())|
|activity_id|uuid|FK → public.activities(id)|
|date|date|YYYY-MM-DD|
|start_time|time|HH:mm|
|end_time|time|HH:mm|
|created_at|timestamptz|default now()|
|updated_at|timestamptz|default now()|

### DB Row → Front-end Mapping

`ISO timestamptz → number (ms)`

### Front-end → DB Row Mapping

`number (ms) → ISO timestamp string`

---

# 2. APIs to Implement

Codex must implement all APIs in the project's data layer (storage.ts or equivalent).  
UI files must **not** be modified in this step.

---

## 2.1 `fetchRecordsByDate(date: string): Promise<RecordItem[]>`

### Behavior

- Query `public.records`
    
- Filter where `date = the provided date`
    
- Order results by `start_time` ascending
    
- Convert DB rows into `RecordItem`  
    ISO → ms
    
- Return empty array if none found
    
- Do not throw ― log errors and return empty array for fallback mode
    

### SQL Equivalent

`select * from public.records where date = ? order by start_time asc;`

---

## 2.2 `insertRecord(item: RecordItem): Promise<RecordItem>`

### Behavior

- Convert timestamps (ms → ISO)
    
- Insert row into `public.records`
    
- Return inserted row as full `RecordItem`
    
- `id` may be provided by front-end or Supabase default
    

### Notes

- Activity FK must be preserved
    
- updated_at auto-filled by DB or updated manually
    

---

## 2.3 `updateRecord(item: RecordItem): Promise<RecordItem>`

### Behavior

- Update existing row by primary key `id`
    
- Set `updated_at = now()` (DB default or explicit)
    
- Convert ms → ISO
    
- Return updated record as front-end `RecordItem`
    

### Constraints

- Do not swallow FK errors (activity_id must exist)
    

---

## 2.4 `deleteRecord(id: string): Promise<void>`

### Behavior

- Delete record by `id`
    
- Cascade effects are handled by DB (if configured)
    
- Errors should log but not break UI
    
- No return value needed
    

---

# 3. Data Mapping Rules (Codex must follow strictly)

### DB Row Example

`{   id: "uuid",   activity_id: "uuid",   date: "2025-01-03",   start_time: "10:00",   end_time: "12:00",   created_at: "2025-01-03T18:00:00Z",   updated_at: "2025-01-03T18:00:00Z" }`

### Front-end RecordItem after mapping

`{   id,   activityId: activity_id,   date,   startTime: start_time,   endTime: end_time,   createdAt: Date.parse(created_at),   updatedAt: Date.parse(updated_at) }`

### New → DB Row Mapping

`{   id,   activity_id: activityId,   date,   start_time: startTime,   end_time: endTime,   created_at: new Date(createdAt).toISOString(),   updated_at: new Date(updatedAt).toISOString() }`

---

# 4. Error Handling Requirements

Codex must follow:

`- Never block UI rendering - Log errors using console.error - Return [] or existing list when fetch fails - Return original item when upsert fails - Do not throw unless absolutely necessary`

Reason: syncing is important but must not degrade UX.

---

# 5. Sorting Requirements

All record lists returned by Supabase must be:

`1. Ordered by date ascending (if multi-date) 2. Then by start_time ascending`

The API `fetchRecordsByDate` must maintain "start_time ASC" ordering.

---

# 6. Local Fallback Expectations

Codex must keep existing:

`loadRecords() saveRecords()`

But front-end will treat Supabase as authoritative once sync succeeds.

---

# 7. Output

Codex should output:

- New functions in storage.ts (or appropriate file):
    
    - `fetchRecordsByDate`
        
    - `insertRecord`
        
    - `updateRecord`
        
    - `deleteRecord`
        
- Using the already-imported `supabase` client.
    
- Fully typed, correct mapping between DB rows ↔ RecordItem.
    

UI integration will be handled in Step 04.

---

# 📌 End of Step 03

(Proceed to Step 04 only after this step is fully implemented.)