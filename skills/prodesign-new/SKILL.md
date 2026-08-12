---
name: prodesign-new
description: prodesign 阶段0——初始化产品设计资料库（如需）并开启新版本工作区，与用户共同填写版本目标 brief。用户输入 /prodesign-new 或要开始一个新的产品设计版本时使用。
---

# prodesign-new — 开启新版本

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


脚本：`node $SKILLS/prodesign/scripts/prodesign.mjs`。规范：`$SKILLS/prodesign/reference/conventions.md`。

## 步骤

1. **定位资料库**：从当前目录向上找 `prodesign/project.md`。找不到 → 问用户产品名与放置目录，运行 `init [产品名]`，然后提醒用户补全 `project.md`（产品定位、原型全局约束、演示数据事实源清单）——这是后续所有阶段的事实源，宁可现在多问几句。
2. **读种子上下文**：`project.md`、`deliverables/index.md`、最近一次归档工作区（`changes/archive/` 下最新目录）里的 `handoff.md`。首个版本则跳过 handoff。
3. **确定版本号与主题**：结合版本史与用户意图确定 `v<版本号>-<主题slug>`（如 `v4.4-alert-notify`）。版本号驱动编号前缀，向用户确认后运行 `new <slug>`。
4. **填写 brief.md**：与用户对话补全版本目标——一句话目标、背景动机、范围勾勒、与已交付模块的关系（引用 index.md 里的 M 编号）、干系人输入原文（保留原话）。
5. 结束时提示：下一步 `/prodesign-req` 进入需求分析。

## 注意

- 一个版本工作区聚焦一个模块/主题；用户一次提出多个主题时建议拆成多个版本，按依赖排序。
- brief 里「不包含」的初判也要写——范围负面清单是后面 Won't 表的种子。
