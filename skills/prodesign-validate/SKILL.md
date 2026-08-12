---
name: prodesign-validate
description: prodesign 校验——运行机械化一致性检查（结构/编号/撞号/反向理由/Q 定论/原型零依赖/断言覆盖/交付索引）。用户输入 /prodesign-validate 或要检查产品设计资料一致性时使用。
---

# prodesign-validate — 机械化校验

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


## 执行

```bash
node $SKILLS/prodesign/scripts/prodesign.mjs validate <slug> --strict   # 单版本（归档前用 strict）
node $SKILLS/prodesign/scripts/prodesign.mjs validate --all             # 全部进行中版本
node $SKILLS/prodesign/scripts/prodesign.mjs validate --index           # 交付索引收录检查
```

slug 不明确时先 `status` 列出工作区让用户选（只有一个则直接用）。

## 结果处理

- **错误逐条修复**后重跑，直到清零。撞号错误按「编号让路原则」改本版编号，并在 changelog 编号占用表记录。
- **警告逐条判断**：确属演示边界/纯 PRD 交付的，在 PRD「已知边界」或 changelog 中声明后可保留；其余修复。
- 脚本只能查机械问题。**语义一致性需人工审计**，校验时顺带抽查：
  - 幽灵实体：原型演示数据是否都出自事实源清单（抽 3–5 个人名/部门/ID 反查）；
  - 跨页时序：页面间引用的同一事实是否咬合；
  - 术语单一性：同一概念是否只有一个名字。
  发现问题记入 review.md 并修复。
