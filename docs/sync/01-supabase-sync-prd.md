
Supabase 云同步（Activities + Records）前端指令规范**

## 1. Feature Summary

本功能将原有存储在 `localStorage` 的两类数据：

- **Activity（活动类型，如工作/学习/健身）**
    
- **RecordItem（每日 timeline 记录，如 12/3 10:00–12:00 工作）**
    

迁移为通过 **Supabase 数据库进行云同步**。

最终目标：

- 多设备看到同一份活动类别列表与每天的时间记录
    
- localStorage 作为 fallback，但 Supabase 为主存
    
- 所有 CRUD 改为通过 Supabase 实现
    

App UI 无需改动，只需更换数据来源（Storage API）。

---

## 2. Data Model

### 2.1 Activity

代表活动类型，用于创建 timeline 记录时选择。

Supabase 表：`public.activities`

字段：

|Column|Type|Notes|
|---|---|---|
|id|uuid|Primary key|
|name|text|Required|
|icon|text/null|Emoji 或 icon 字符|
|color|text/null|HEX 颜色|
|created_at|timestamptz|Default: now()|
|updated_at|timestamptz|Default: now()|

前端模型：

```ts
type Activity = {
  id: string
  name: string
  icon?: string
  color?: string
  createdAt: number   // timestamp
  updatedAt: number   // timestamp
}
```

---

### 2.2 RecordItem（每日时间记录）

未来将新增 Supabase 表 `public.records`，模型如下：

```ts
type RecordItem = {
  id: string
  activityId: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:mm
  endTime: string     // HH:mm
  createdAt: number
  updatedAt: number
}
```

---

## 3. Supabase API Requirements（Codex 指令）

以下为 Codex 需要实现的前端 API（TypeScript）。

所有 API 均使用此前定义的：

```ts
import { supabase } from '../supabaseClient'
```

### 3.1 Activity API

#### A1. fetchActivitiesFromSupabase()

指令：

```
Implement `fetchActivitiesFromSupabase(): Promise<Activity[]>`
- Query public.activities
- Order by created_at ascending
- Map ActivityRow to Activity (convert ISO date string → number)
- Return empty array if no data
```

---

#### A2. upsertActivitiesToSupabase(list: Activity[]): Promise<Activity[]>

指令：

```
Implement `upsertActivitiesToSupabase(list)`
- Convert Activity → ActivityRow (timestamps → ISO strings)
- Use .upsert(payload, { onConflict: 'id' })
- Return updated Activity[]
```

---

#### A3. deleteActivity(id: string)

指令：

```
Implement `deleteActivity(id)`
- Delete row where id = provided id
- Cascade deletes related records (handled by DB)
```

---

## 3.2 Record API（新建）

### R1. fetchRecordsByDate(date: string)

```
Implement `fetchRecordsByDate(date: string): Promise<RecordItem[]>`
- Query public.records
- Filter where date = input date
- Order by start_time ascending
- Map DB row → RecordItem
```

---

### R2. insertRecord(item: RecordItem)

```
Implement `insertRecord(item)`
- Convert RecordItem → DB row format
- Insert into public.records
- Return newly inserted row
```

---

### R3. updateRecord(item: RecordItem)

```
Implement `updateRecord(item)`
- Update row matching id
- updated_at = now()
- Return updated row
```

---

### R4. deleteRecord(id: string)

```
Implement `deleteRecord(id)`
- Delete row where id = id
```

---

## 4. App Initialization Logic

Codex 需要实现以下逻辑：

```
On app startup:
1. Call fetchActivitiesFromSupabase()
2. If returned list > 0:
      - Use them as the source of truth
      - Save to localStorage as fallback
   Else:
      - Use local default activities (loadActivities)
      - Push defaults to Supabase via upsertActivitiesToSupabase()

3. For timeline:
   - After user selects a date, call fetchRecordsByDate(date)
   - Populate UI timeline using Supabase data
```

---

## 5. UI → API Mapping

### When user creates a new RecordItem

```
Call insertRecord()
Update state & localStorage
```

### When user edits a RecordItem

```
Call updateRecord()
Update timeline state
```

### When user deletes a RecordItem

```
Call deleteRecord()
Remove from local timeline state
```

### When user edits Activity List

```
Call upsertActivitiesToSupabase()
Update localStorage fallback
```

---

## 6. Sync Strategy

```
Supabase is always the source of truth.
LocalStorage is only used if Supabase returns empty (first-time or offline).
All modifications must write to Supabase first, then update localStorage.
```

---

## 7. Error Handling

```
If Supabase query fails:
- Log the error
- Fallback to localStorage if possible
- Do not crash the UI
- Show a subtle toast: "Cloud sync failed, using local data"
```

---
