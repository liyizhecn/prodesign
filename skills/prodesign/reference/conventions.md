# prodesign 规范：交付包契约 + 编号制度 + 写作规范

> 路径约定：下文 `$SKILLS` 指本套件的安装根目录——项目级 `.claude/skills`（优先）或全局 `~/.claude/skills`，按实际存在解析。


本文件是所有 prodesign-* 阶段命令的共同规范。各阶段 SKILL.md 只写该阶段的操作，规则冲突时以本文件为准。

## 1. 流水线与交付契约

```
brief ──▶ ①需求分析 ──▶ ②竞品分析 ──▶ ③PRD定义 ──▶ ④评审追问 ──▶ ⑤原型设计 ──▶ validate ──▶ archive
          requirements    research       prd.md        review.md     prototypes/     （脚本）      （入库）
          US-* / Q-*      L-* 教训册     F-* / A-*     规格补强      checks/*.js
```

每个阶段必须消费上游交付包、产出本阶段交付包。**衔接契约**（validate 部分可机械校验）：

| 契约 | 规则 |
|---|---|
| US → F | PRD 中每个用户故事至少被一个功能点 F 覆盖（PRD 附录或功能点描述中注明覆盖关系） |
| Q → 定论 | requirements 的每个 Q 必须「已定论」才能进入 PRD 阶段；定论回填到 PRD 附录 C，并落到某个 A/F/Won't |
| L → A | PRD 每条架构决策 A 的「反向理由」应引用 research 教训册的 L 编号或同等具体的竞品事实 |
| F/A → 断言 | 原型 checks/*.js 的每条断言注释锚定 F/A 编号；PRD 全部 Must 级 F 应有对应断言（做不到的写入已知边界） |
| 一切 → changelog | 归档前 changelog.md 逐文件列出变更位置、内容、理由 |

## 2. 版本与冻结原则

- 版本工作区命名：`v<版本号>-<主题slug>`，如 `v4.4-alert-notify`。版本号驱动编号前缀（v4.4 → US-V44-*、A4.4-*）。
- **已交付即冻结**：deliverables/ 中的 PRD 不回改。对已交付模块的改动，在新版本 PRD 中写「M<x> 关联改造」小节，原型可覆盖入库（HTML 是活文档，PRD 是历史记录）。
- **编号让路原则**：编号撞号时，已交付/已冻结的编号不动，后来者改号。编号只表示身份，不表示时序——改号后要在文档头部注明，防止后人"好心"改回去。
- **能不动的就不动**：改号的唯一目的是消除歧义，不是追求整齐。重新连号会让历史引用失效。

## 3. 编号制度

| 类型 | 格式 | 分配规则 | 权威 |
|---|---|---|---|
| 模块 | `M<n>` | 全局递增，registry/ids.md 领号 | registry/ids.md |
| 功能点 | `F<模块号>-<序号>` | 模块内递增；可刻意留空号段作分隔 | 各 PRD `####` 标题 |
| 用户故事 | `US-<版本前缀>-<序号>` | 版本前缀 = V+版本号去点（V44），天然防跨版本撞号 | 各 PRD 用户故事表 |
| 架构决策 | `A<版本号>-<序号>` | 如 A4.4-1；版本内递增 | 各 PRD 附录 A |
| 待确认项 | `Q<序号>` | 版本工作区内唯一 | requirements.md |
| 竞品教训 | `L<序号>` | 版本工作区内唯一 | research.md |
| 内容实体 | 产品自定（如内置 `SYS-`、自定义 `USR-` 双命名空间） | 在 project.md 实例化 | project.md |

被撤回/放弃的编号**不复用**（写明"编号未占用，止于 N"）。

## 4. 各阶段验收门

**① 需求分析**：每个 US 都有可判定的验收标准；Q 表覆盖过这些维度——权限与角色、审计与留痕、空态与失败路径、数据保留与删除、与已交付模块的关系；全部 Q 已定论（用户拍板，不许 AI 自行定论）。

**② 竞品分析**：每条结论有具体来源；教训必须具体到"哪家产品的哪个机制、付出了什么代价"（社区高频问题、文档自认的限制、迁移公告等），拒绝"竞品 A 功能全但复杂"式的泛泛而谈。

**③ PRD 定义**：结构完整（validate 校验章节）；每条 A 决策必带**反向理由**——说明不采用业界更强/更常见方案 X 的原因，引用 L 教训；Won't 表每项带处置（backlog / 不做 / GAP 入册 / 经评估后不做）与理由；曾完整设计后撤回的功能也要入 Won't 表留档（防止下个版本被重新设计回来）。

**④ 评审追问**：每轮 3–5 问，专挑失败路径、并发与时序、权限越权、空态边界（如 `every([])===true` 类陷阱）、跨模块一致性、存量数据迁移、自指问题（系统管理自己升级自己）；每问必须落为规格补强（改 prd.md）或记录不改的理由；**收敛判据：连续 2 轮无新增补强**；遗留低置信项标 Conf% 入风险表。

**⑤ 原型设计**：见 reference/proto-spec.md。核心：零外部依赖单文件 HTML；断言锚定编号；演示数据出自事实源，禁止幽灵实体。

## 5. 写作规范

- **反向理由体**：每条 A 决策先写「决策」再写「反向理由：不采用 X——<竞品具体教训>；<本产品用户特征> > <被放弃的收益>」。
- **已知边界如实声明**：每次交付附「已知边界」清单——哪些是演示模拟、哪些留给一致性任务、哪些依赖外部条件（标 Conf%）。测试全绿不等于页面能看，功能断言之外考虑布局断言。
- **幽灵实体禁令**：原型演示数据（人名/部门/模型/ID）必须出自 project.md 事实源清单或已交付原型；引入新实体必须先登记到事实源。跨页引用的数据要构成自洽世界：数值汇总恒等、时间线咬合（配置变更要能在审计类页面找到对应记录）。
- **快照优先**：事件/日志类数据存关联对象快照而非外键——事件是历史事实，对象删除后仍完整展示。
- **中文为主**，术语保留英文原文；文件名与既有交付物风格一致。

## 6. 脚本参考

```bash
node $SKILLS/prodesign/scripts/prodesign.mjs init [产品名]
node $SKILLS/prodesign/scripts/prodesign.mjs new v4.4-alert-notify
node $SKILLS/prodesign/scripts/prodesign.mjs status
node $SKILLS/prodesign/scripts/prodesign.mjs validate v4.4-alert-notify --strict
node $SKILLS/prodesign/scripts/prodesign.mjs validate --all
node $SKILLS/prodesign/scripts/prodesign.mjs validate v4.4-alert-notify --index
node $SKILLS/prodesign/scripts/prodesign.mjs archive v4.4-alert-notify
```

validate 检查项：工作区文件齐全；prd.md 必备章节；F/A/US 编号在本文件内不重复、与 deliverables 已交付 PRD 不撞号；US 前缀与版本一致；A 决策含反向理由；**US→F 覆盖契约**（每个用户故事被某功能点「覆盖故事」引用，strict 为错误）；Q 全部已定论（strict）且已定论项回填附录 C（警告）；含关联改造时必须有「存量数据与迁移」章节（警告）；原型无外部依赖引用；魔法色值（:root 之外的色值，骨架建立后为错误）；F 的断言覆盖（警告级）；**产品自有校验器钩子**——自动执行 `deliverables/tools/validators/*.js`（产品专属知识如菜单一致性，见 proto-spec §5，非零退出=错误）；--index 检查交付索引对 deliverables 文件的收录完整性。
