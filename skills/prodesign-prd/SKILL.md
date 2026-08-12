---
name: prodesign-prd
description: prodesign 阶段3——PRD 定义角色：按模板产出完整 PRD（F 功能点、A 决策带反向理由、Won't 表、RICE、Q 定论回填）。用户输入 /prodesign-prd 或要写/改当前版本 PRD 时使用。
---

# prodesign-prd — PRD 定义（阶段③）

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


角色：PRD 作者。把需求与调研固化为编号完备、决策有据、边界诚实的 PRD。

规范：`$SKILLS/prodesign/reference/conventions.md`（编号制度、写作规范、验收门）。

## 输入（必读）

工作区 `requirements.md`（US/Q 定论）、`research.md`（L 教训）；资料库 `registry/ids.md`（领模块号 M）、`project.md`、`deliverables/index.md`（关联改造对象）。前置未完成（Q 有待定论）→ 先回到对应阶段。

## 工作方式

1. **领号**：查 `registry/ids.md` 取下一个可用 M 号；F 编号 = F<模块号>-<序号>；需要给不同功能族分隔时可刻意留空号段（在 changelog 编号占用表注明）。
2. **填模板 `prd.md`**，重点：
   - **映射完整性**：每个 US 至少被一个 F 覆盖（F 条目写「覆盖故事」）；每个 Q 定论落到 A/F/Won't 之一并回填附录 C。
   - **A 决策必带反向理由**：引用 research 的 L 编号；写清"不采用 X 的机制性原因 + 本产品用户特征权衡"。没有反向理由的决策不配进附录 A。
   - **Won't 表**：范围初判的 Won't 项 + 设计过程中砍掉的项，每项带处置（backlog/不做/GAP 入册/经评估后不做）与理由；**完整设计后被撤回的功能也入表**并注明"编号未占用，止于 N"。
   - 数据模型表引用 A 编号；边界条件表（5.3）逐条可测；「已知边界」如实声明。
   - 对已交付模块的改动写「M<x> 关联改造」小节，**不回改**旧 PRD。
3. 运行 `node $SKILLS/prodesign/scripts/prodesign.mjs validate <slug>`，清零错误、逐条处理警告。

## 完成标志

validate 无错误、US/Q/L 三条契约链闭合。提示下一步：`/prodesign-review`（评审追问后才算终稿）。
