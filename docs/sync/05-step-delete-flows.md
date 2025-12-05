## docs/sync/05-step-delete-flows.md

### Step 05 — Delete Flows for Activities & Records (UI + Supabase)

#### Goal

Add **delete** functionality for:

- individual `RecordItem` (time entries)
    
- individual `Activity` (activity types)
    

using the already implemented Supabase APIs:

- `deleteRecord(id: string): Promise<void>`
    
- `deleteActivity(id: string): Promise<void>`
    

The UI should remain visually consistent with the current design, adding delete actions to existing menus/buttons.

---

### 1. Delete a RecordItem (time entry)

#### 1.1 Where

- Use the existing **“…” options menu** on each record card (in Summary view and any Timeline view if applicable).
    
- Currently the menu contains “Edit” (or similar). We need to add a “Delete” action.
    

#### 1.2 UX behavior

- When user chooses **Delete** on a record:
    
    1. Show a confirm dialog:
        
        - Title: `Delete this entry?`
            
        - Message: `This action cannot be undone.`
            
        - Buttons: `Cancel` / `Delete`
            
    2. If user clicks **Cancel** → close dialog, do nothing.
        
    3. If user clicks **Delete**:
        
        - Optimistically remove the record from the UI state for the current date.
            
        - Call `deleteRecord(record.id)` to remove it in Supabase.
            
        - On success:
            
            - Persist the updated record list for this date to localStorage (fallback cache).
                
        - On error:
            
            - Log the error.
                
            - Optionally restore the removed record in state, or leave it removed but:
                
                - Show the existing sync banner:  
                    `"Cloud sync failed, using local data."`
                    

#### 1.3 Implementation notes

- Deleting a record must update **only** the list for that date.  
    If records are stored keyed by date (e.g. `{ [date]: RecordItem[] }`), update the correct array.
    
- Ensure any open edit modal for this record is closed when deletion completes.
    
- Do not change the shape of `RecordItem`; just filter it out from the in-memory list.
    

---

### 2. Delete an Activity

#### 2.1 Where

- In the **Edit Activities** flow (the screen/modal where the user can edit activity names/icons/colors), add a delete control for each activity row:
    
    - A small trash icon or “Delete” button on the right of each activity.
        
    - The layout should remain tidy; do not redesign the modal.
        

#### 2.2 UX behavior

- When user clicks delete on an activity:
    
    1. Show a confirm dialog:
        
        - Title: `Delete this activity?`
            
        - Message:  
            `This will remove the activity and may also remove any associated records.`
            
        - Buttons: `Cancel` / `Delete`
            
    2. If **Cancel** → close dialog.
        
    3. If **Delete**:
        
        - Optimistically remove the activity from the activities state.
            
        - Call `deleteActivity(activity.id)` to delete it on Supabase.
            
        - After successful delete:
            
            - Remove any in-memory records whose `activityId` matches this id  
                (or trigger a refetch for the current date using `fetchRecordsByDate`).
                
            - Save the updated activities list to localStorage (fallback cache).
                
        - On error:
            
            - Log the error.
                
            - Optionally restore the activity in state.
                
            - Show the sync banner: `"Cloud sync failed, using local data."`
                

#### 2.3 Backend assumptions

- `public.records.activity_id` has a foreign key to `public.activities(id)` with `ON DELETE CASCADE`, _or_ the frontend filters out records for deleted activities.
    
- `deleteActivity` already calls Supabase `.delete()` with `id` as filter.
    

---

### 3. Error Handling & Fallback

- If a delete API call fails:
    
    - Never crash the UI.
        
    - Use `console.error` to log details.
        
    - Show the existing non-intrusive sync banner.
        
    - It is acceptable to keep the UI in “local-only” state after an error; the user can refresh later.
        

---

### 4. Boundaries

Codex must respect:

- Allowed to modify:
    
    - Components that render record cards and their “…” menu.
        
    - Edit-activities modal/component where activities are listed.
        
    - `App.tsx` if needed for wiring handlers, but no structural redesign.
        
- Not allowed to modify:
    
    - Styling system (Tailwind config, global CSS) except minimal tweaks for new buttons/icons.
        
    - Supabase client setup or env handling.
        
    - Existing sync logic unrelated to delete flows.
        

---

### 5. Completion Criteria

Step 05 is complete when:

1. User can delete a record from Summary/Timeline:
    
    - Confirm dialog appears.
        
    - After confirm, the record disappears from UI.
        
    - Supabase `records` table no longer contains that row.
        
    - After refresh, the record does not come back.
        
2. User can delete an activity from the Edit Activities UI:
    
    - Confirm dialog appears.
        
    - After confirm, the activity disappears from the list.
        
    - Supabase `activities` table no longer contains that row.
        
    - Records associated with this activity are either removed (via FK cascade) or hidden/refetched.
        
    - After refresh, the deleted activity does not come back.
        
3. When network or Supabase fails:
    
    - UI shows the existing `"Cloud sync failed, using local data."` banner.
        
    - App remains usable; no crashes.