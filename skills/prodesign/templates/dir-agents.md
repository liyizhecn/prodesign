# prodesign 资料库守则（AI 必读）

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


本目录（{{PRODUCT}}）由 prodesign 工作流管理（skill 位于 `$SKILLS/prodesign/`）。

- **deliverables/ 为已冻结交付物，不要直接修改**。任何改动走新版本：`/prodesign-new` 开工作区，交付经 `/prodesign-archive` 入库。
- 动手前必读：`project.md`（产品事实源）、`deliverables/index.md`（交付索引）、最近一次归档工作区里的 `handoff.md`（交接摘要）。
- 编号唯一性以 `registry/ids.md` 为权威，领号先查表、归档后回填。
- 阶段命令：`/prodesign-req` → `/prodesign-research` → `/prodesign-prd` → `/prodesign-review` → `/prodesign-proto` → `/prodesign-validate` → `/prodesign-archive`；或 `/prodesign-auto` 顺序驱动。
- 机械操作用脚本：`node $SKILLS/prodesign/scripts/prodesign.mjs <init|new|status|validate|archive>`。
- 完整规范见 `$SKILLS/prodesign/reference/conventions.md`。
