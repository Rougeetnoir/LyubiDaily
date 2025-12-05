# Lyubi Daily

Lyubi Daily 是一个受柳比歇夫记录法启发的日常时间记账应用，提供 Summary（按活动分组）与 Timeline（按时间顺序）双视图，支持活动自定义、手动补录、以及跨设备云同步。Supabase 作为主存，localStorage 作为离线兜底。

## Project Overview

- 选择活动后开始/停止计时，支持备注；支持手动补录时间段。
- Summary 视图按活动分组展示起止时间与耗时；Timeline 视图按时间顺序列出当天记录。
- 活动支持自定义名称、Emoji、预设或自定义颜色，管理面板可批量编辑。
- Supabase 存储 activities 与 records，多设备共享；离线时写入 localStorage，网络恢复后再同步。

## Tech Stack

- Vite + React + TypeScript
- Supabase（Postgres + RLS）
- TailwindCSS、Radix UI

## Getting Started (Local Development)

1. 安装依赖
   ```bash
   npm install
   ```
2. 配置环境变量，创建 `.env`（示例）：
   ```bash
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. 启动开发服务
   ```bash
   npm run dev
   ```

## Supabase Setup（概要）

准备数据库 schema（详见 docs/sync/）：

- `public.activities`: `id uuid PK`, `name text`, `icon text?`, `color text?`, `created_at timestamptz`, `updated_at timestamptz`
- `public.records`: `id uuid PK`, `activity_id uuid FK -> activities.id`, `date date`, `start_time time`, `end_time time`, `remark text?`, `created_at timestamptz`, `updated_at timestamptz`

开启 RLS，并为 anon 角色添加 select/insert/update/delete 策略，或按需收紧策略。

## Lint & Build

```bash
npm run lint
npm run build
```

## Deploying to Vercel

- Build 命令：`npm run build`
- Output 目录：`dist`
- 环境变量：在 Vercel 项目设置中添加 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`
- Vercel 会自动识别 Vite 框架，部署后使用同一 Supabase 后端。
