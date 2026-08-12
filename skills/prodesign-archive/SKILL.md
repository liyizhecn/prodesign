---
name: prodesign-archive
description: prodesign 入库归档——写变更说明与会话交接摘要，strict 校验通过后将交付物入库 deliverables/ 并更新交付索引与编号登记簿。用户输入 /prodesign-archive 或当前版本要交付入库时使用。
---

# prodesign-archive — 入库归档（⏹）

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


把版本工作区固化为冻结交付物。这一步的质量决定下一个版本的起点。

规范：`$SKILLS/prodesign/reference/conventions.md`（冻结原则）。

## 步骤（顺序执行）

1. **写 `changelog.md`（变更说明）**：逐文件列出新建/修改的位置、内容、**理由**（引用 F/A/Q 编号）；编号占用表填全（含留空号/撤回号）；会话内的反转与撤回如实记录。
2. **写 `handoff.md`（会话交接摘要）**：决策速查、一致性审计结论、操作提醒（本轮踩坑）、backlog 输出、预留与承诺。写给下一个版本会话的自己——宁可多写。
3. **strict 校验**：`node $SKILLS/prodesign/scripts/prodesign.mjs validate <slug> --strict` 清零错误。
4. **征得用户确认**后运行：`node $SKILLS/prodesign/scripts/prodesign.mjs archive <slug>`（交付物复制入 deliverables/、工作区移入 changes/archive/<日期>-<slug>/）。
5. **更新三处权威文件**（脚本会提示遗漏）：
   - `deliverables/index.md`：交付文件总览补行、里程碑编号全表补 M 行、Should have 清单合并本版 Won't 表中的 backlog 项、跨模块联动补新深链；
   - `registry/ids.md`：回填本版 M/F/A/US 占用；
   - `project.md`：版本史补行；事实源清单合并本版新登记实体。
6. **收尾校验**：`validate --index` 确认索引收录完整。向用户汇报入库清单与下版候选（来自 handoff 第 4 节）。

## 禁止

- 跳过 changelog/handoff 直接归档（下个版本会失忆）。
- 归档后再改 deliverables/ 里的 PRD——发现问题走新版本。
