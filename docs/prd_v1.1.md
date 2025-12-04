下面我将把 **UI 调整 + 新增「时间条（方案D）」+ 新增「格子填色图（方案E）」**  
整理成一份 **Codex 可理解、可直接逐步执行的产品改进文档（PRD v1.1 分步版）**。

⚠️ **重要特点：**

- **每个步骤都是独立可执行的修改任务**
    
- **Codex 一次只需执行一个步骤，不会混乱**
    
- 文档结构清晰，让你逐步把 v0 → 理想 v1.1 的界面进化
    

---

# 📘 **Lyubi Daily — PRD v1.1（UI 改进与时间可视化增强）**

### _Codex-friendly · 分步骤实现 · 可逐步提交_

---

# Section 0 — 范围说明（Codex 必须阅读）

此文档包含两类改动：

## **A. UI 视觉提升（基于 v0 截图进行 Notion 风优化）**

包括：

1. Header 改进
    
2. Start 区域的卡片化
    
3. Tabs 的视觉增强
    
4. Summary 的卡片统一化
    
5. Timeline 的条目卡片化
    
6. 统一的色彩 / 留白 / 圆角规范
    

## **B. 时间可视化增强（新增两个可视化组件）**

7. 方案D：条带式时间条（Horizontal Time Bar）
    
8. 方案E：24 小时格子填色图（Grid Heatmap）
    

---

# Section 1 — 全局视觉规范（UI 设计语言）

_(Codex 用于引用统一样式)_

### 1.1 颜色规范

```
Background: #FFFFFF  
Border: #E5E5E5  
Text Primary: #1F1F1F  
Text Secondary: #888888  
Tab Active BG: #F5F5F5  
Card BG: #FFFFFF  
Accent Colors (活动色条): 任选 (如 #FFD8D8, #D8FFE7, #D8E8FF etc.)
```

### 1.2 圆角规范

```
Card Radius: 12px  
Pill Button Radius: 8px  
Small Label Radius: 4px  
```

### 1.3 间距规范

```
Section Margin: 32px  
Card Padding: 16px  
List Item Spacing: 12px  
Tab Height: 36px  
```

### 1.4 字体层级

```
H1: 28px, bold  
H2: 22px, semibold  
Label: 14px, medium  
Body: 16px  
Small: 12px  
```

---

# Section 2 — **任务步骤总览（Codex 逐步执行）**

下面所有任务 Codex 必须 **逐步按顺序执行**。  
每个任务都是一个 Pull Request 级别的变更。

---

# ✅ **Step 1 — Header 结构优化**

**目标：**  
把顶部标题 + 日期/总时长 → 改成一个统一的 Header Bar。

**要求：**

- 左侧：App Title + Subtitle
    
- 右侧：日期（Today · Dec 3, 2025）+ Total（xxm）
    
- 整体底部加 1px 边界线
    
- 两端对齐
    
- 视觉风格参考 Notion Page Header
    

---

# ✅ **Step 2 — Start 区域卡片化**

**目标：**  
让 Start 区域整体像一个 Notion 卡片（高度统一、圆角更柔和）。

**要求：**

- 给整个 Start 区域加 Card（圆角12px，边框#E5E5E5）
    
- “Add Activity” 与 Dropdown + Remark 合并成同一个区块
    
- Start 按钮换成更轻的按钮样式（灰底+黑字，圆角8px）
    
- Remark 输入框要更轻量（减轻边框，调淡 placeholder）
    

---

# ✅ **Step 3 — Tabs UI 视觉加强**

**目标：**  
增强 Summary / Timeline Tab 的互动与对比度。

**要求：**

- Active tab 使用浅灰 (#F5F5F5) 背景
    
- Active tab 边框为 #E5E5E5
    
- Inactive tab 文本为 #888888
    
- Tabs 整体更薄（高度 36px）
    
- 使用小圆角（4px）
    

---

# ✅ **Step 4 — Summary 卡片统一视觉**

**目标：**  
规范 Summary 中每个活动卡片的风格，使它们看起来属于同一套系统。

**要求：**

- 卡片统一为白色背景
    
- 左侧添加 4px 宽的活动色条
    
- 右上角显示该活动今日总时长
    
- 每条 sub-record 作为卡片内部的轻量条目（padding 8px）
    
- sub-record 前添加一个浅灰虚线或 bullet 点
    

---

# ✅ **Step 5 — Timeline 样式卡片化**

**目标：**  
提高 Timeline 的可读性，让每条记录是一个“行级卡片”。

**要求：**

- 每条记录使用浅灰背景（#F8F8F8）
    
- 圆角 8px，间距12px
    
- 时间（16:37–16:38）加粗
    
- 活动名称中等（16px）
    
- Remark 为浅灰小字（12px）
    

---

# Section 3 — **新增可视化组件（核心增强）**

---

# ✅ **Step 6 — 新增「条带式时间条」（方案D）**

**目标：**  
在 Summary 区域下方新增一个横向时间条：  
显示从 00:00 → 24:00 的所有时间段，并按活动分颜色段。

**行为要求：**

- 横向条全宽度 100%
    
- 高度 24px
    
- 每个 Record 在该条上生成一个彩色 segment
    
- segment 颜色 = 该活动的 color
    
- segment 长度 ∝ duration
    
- segment 按 start 时间排序依次排列
    
- 悬浮（hover）时显示 tooltip：
    
    ```
    活动名称  
    17:08–17:12 (4m)  
    备注：xxx  
    ```
    

**位置：**  
Summary 区域顶部（在卡片列表前）

---

# ✅ **Step 7 — 新增「格子填色图」（方案E）**

**目标：**  
添加类似 GitHub Heatmap 的「每日填色格子」，但按时间粒度划分（非按天）。  
帮助用户看到一天的时间密度、空白时间和碎片化。

**格子定义（可实现性最高的版本）：**

- 将一天拆分为 **144 个 10 分钟格（24h × 6）**
    
- 每个格子：
    
    - 如果有活动 → 填活动色
        
    - 若多个活动落在同一格，按时间占比混色（1.0可忽略）
        
    - 若无活动 → 淡灰色 (#EFEFEF)
        

**布局：**

```
00   [ ][ ][ ][ ][ ][ ]
01   [ ][ ][ ][ ][ ][ ]
...
23   [ ][ ][ ][ ][ ][ ]
```

**格子大小建议：**

- 10px × 10px（可调）
    
- 2px gap
    

**位置：**  
Timeline Tab 下方或 Summary 页的底部。

---

# Section 4 — Codex 执行方式（非常关键）

在执行时：

### 每次请求只能包含：

```
Please implement Step X from PRD v1.1.
```

Codex 即应：

- 修改 UI
    
- 不触碰其他部分
    
- 不提前做后续步骤
    

当你确认 Step X 完成后，再执行 Step X+1。

---

# Section 5 — 工作流建议（你这样用效果最好）

你可以按照以下节奏进行迭代：

```
我：Please implement Step 1 from PRD v1.1.
Codex：完成 Step1 的代码修改。
我：预览 UI → OK → Next。
我：Please implement Step 2 from PRD v1.1.
...
直到 Step 7。
```

这样你能保证：

- 每次变更范围极小
    
- UI 风格逐步收敛
    
- 无需一次写完所有代码
    
- 你能随时插入改动或反馈
    

---

