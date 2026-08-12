---
name: prodesign
description: 产品设计工作流（openspec 风格）总览与状态查询。当用户输入 /prodesign、询问 prodesign 工作流用法、或想查看产品设计资料库当前状态/进行中版本时使用。各阶段由 prodesign-* 系列命令触发。
---

# prodesign — 产品设计工作流

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


参考 openspec 的「changes 工作区 → validate → archive 入库」模型，将产品设计拆为四个角色阶段（需求分析 → 竞品分析 → PRD 定义 → 原型设计）+ 评审追问 + 版本入库，阶段之间用**交付包契约**衔接，全程用编号制度（M/F/US/A/Q/L）保证可寻址、可校验。

## 命令一览

| 命令 | 阶段 | 说明 |
|---|---|---|
| `/prodesign` | — | 总览 + 状态查询（本文件） |
| `/prodesign-new` | 0 | 初始化资料库（如需）+ 开启新版本工作区 |
| `/prodesign-req` | 1 | 需求分析：访谈提问 → 用户故事 + 待确认项 Q 表拍板 |
| `/prodesign-research` | 2 | 竞品分析：逐 Q 对比业界方案，产出教训册 L 编号 |
| `/prodesign-prd` | 3 | PRD 定义：F 功能点 + A 决策（必带反向理由）+ Won't 表 |
| `/prodesign-review` | 4 | 评审追问：多轮对抗式追问直至收敛，补强规格 |
| `/prodesign-proto` | 5 | 原型设计：单文件 HTML + jsdom 断言（锚定 F/A 编号） |
| `/prodesign-validate` | ✓ | 机械化校验（结构/编号/一致性） |
| `/prodesign-archive` | ⏹ | 变更说明 + 交接摘要 + 入库归档 + 更新交付索引 |
| `/prodesign-auto` | ∞ | 依次驱动全部阶段，仅在拍板点停下 |

## 资料库目录结构（脚本 init 自动创建）

```
prodesign/
  project.md              # 产品上下文唯一事实源（定位/版本史/编号规范实例化/原型全局约束/演示数据事实源清单）
  AGENTS.md               # 目录说明（AI 必读守则）
  registry/ids.md         # 编号登记簿（M/F/A/US 唯一性权威，archive 时回填）
  deliverables/           # 已冻结交付物（≈ openspec 的 specs/，只能经 archive 更新）
    index.md              # 交付索引（交接唯一事实源）
    prd/                  # 已交付 PRD
    prototypes/           # 已交付原型 HTML
    tools/checks/<版本>/  # 已交付断言脚本
  changes/                # 进行中版本工作区（≈ openspec 的 changes/）
    <v4.4-alert-notify>/
      brief.md            # 版本目标（阶段 0）
      requirements.md     # 需求分析交付包（阶段 1）
      research.md         # 竞品分析交付包（阶段 2）
      prd.md              # PRD 草稿（阶段 3，评审后为终稿）
      review.md           # 评审追问记录（阶段 4）
      prototypes/*.html   # 原型（阶段 5）
      checks/*.js         # jsdom 断言（阶段 5）
      changelog.md        # 变更说明（入库对照核验）
      handoff.md          # 会话交接摘要（下一版本种子上下文）
    archive/<日期>-<slug>/ # 已归档工作区
```

## 脚本

所有机械工作由零依赖脚本完成：

```bash
node $SKILLS/prodesign/scripts/prodesign.mjs <命令>
  init [产品名]                 # 在当前目录创建 prodesign/ 骨架
  new v<版本>-<主题slug>        # 开新版本工作区（模板自动实例化编号前缀）
  status                        # 各工作区阶段进度
  validate <slug> [--strict]    # 校验；--all 校验全部；--index 检查交付索引孤儿
  archive <slug> [--date=YYYY-MM-DD]  # strict 校验 → 交付物入库 → 工作区归档
```

## 本命令（/prodesign）的执行方式

1. 从当前目录向上寻找 `prodesign/`；找到则运行 `status` 脚本并汇报各工作区进度、下一步建议命令。
2. 未找到则介绍工作流并建议 `/prodesign-new` 开始。
3. 用户问细节时按需阅读 `reference/conventions.md`（交付契约与写作规范）、`reference/proto-spec.md`（原型输出规范）。

## 核心原则（全阶段共同遵守，详见 reference/conventions.md）

- **冻结原则**：deliverables/ 里的东西不回改；新需求走新版本增量 + 「关联改造」小节。编号一经交付不动，让后来者让路；编号只表示身份，不表示时序。
- **契约衔接**：每个阶段的输出是下一阶段的输入契约——US 被 F 覆盖、Q 定论落到 A/F/Won't、L 教训进 A 的反向理由、F/A 被断言锚定。漏项会被 validate 机械暴露。
- **拍板点**：待确认项 Q 必须由用户逐条定论后才能写 PRD；评审收敛和归档需用户确认。
- **诚实边界**：已知边界如实声明；置信度不足的项标 Conf 并入风险表。
- **幽灵实体禁令**：原型演示数据必须出自事实源清单，跨页引用必须自洽。
