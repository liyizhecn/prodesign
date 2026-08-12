---
name: prodesign-proto
description: prodesign 阶段5——原型设计角色：产出零依赖单文件 HTML 原型 + 锚定 F/A 编号的 jsdom 断言脚本，演示数据出自事实源。用户输入 /prodesign-proto 或要为当前版本做原型时使用。
---

# prodesign-proto — 原型设计（阶段⑤）

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


角色：原型设计师 + 验证工程师。原型是可机械验证、数据自洽的"演示世界"。

**必读规范：`$SKILLS/prodesign/reference/proto-spec.md`**（技术约束、断言、种子数据）、**`reference/patterns.md`**（页型结构，每页声明 page-type）、**`reference/content-spec.md`**（数据格式与文案词表），以及 `reference/conventions.md`。

## 输入（必读）

工作区 `prd.md`（尤其第 5 章原型说明、5.2 关键状态、5.3 边界条件）；`project.md`（原型全局约束、事实源清单）；`deliverables/tools/_菜单模板.html`（如已存在）与相邻已交付原型（保持设计语言一致）。

## 工作方式

1. **建页（从骨架起步）**：首版先实例化三件套——`$SKILLS/prodesign/templates/page-skeleton.html` → `deliverables/tools/_页面骨架.html`（改产品名/菜单/种子色）、`_菜单模板.html`、`validator-template.js` → `deliverables/tools/validators/`（内置菜单/token/基座三查，按真实 DOM 调整）。之后每页 = **复制骨架 → 改 page-type 声明 → 删样例区 → 按页型标准结构写内容**，存为 `prototypes/<模块中文名>_原型.html`；不要抄相邻页。token 纪律：色值只在 :root，新 token/新组件样式先进骨架再用。菜单变更先改模板、再同步校验器白名单。
2. **种子数据**：一律取自事实源清单/已交付原型；新实体先登记进 `project.md` 事实源表。自洽三查：汇总恒等、ID 格式合规、跨页时序咬合。
3. **断言**：从 `checks/_template.js` 起步，每个原型页一个 checks 文件；每条断言锚定 F/A 编号；覆盖功能断言 + 结构性恒等式 + 反向结构验证 + 布局断言。PRD 每个 Must 级 F 应有断言，做不到的写入 PRD「已知边界」。
4. **跑测**：`node checks/<文件>.js`（需 jsdom）。断言失败优先改原型；确属规格问题才回改 prd.md 并在 review.md 补一轮记录。**修代码不改断言**。
5. **US 走查**（设计走查，区别于断言验证）：逐条用户故事在原型上走通任务路径——入口在哪、操作几步、结果是否可见。这验证的是"任务走得通"，checks 验证的是"F 实现了"，两者不互替。走查结果记入 review.md（一行一 US：通过/卡点）；走不通的补交互或写入已知边界。
6. **对已交付原型的关联改造**：把 `deliverables/prototypes/` 的对应文件复制进工作区 `prototypes/` 再改（archive 时会覆盖入库），改动点记入 changelog。
7. 完成后运行 `node $SKILLS/prodesign/scripts/prodesign.mjs validate <slug> --strict`。

## 完成标志

checks 全绿、US 走查全通过（或卡点已声明）、strict 校验通过、已知边界已声明。提示下一步：`/prodesign-archive`。
