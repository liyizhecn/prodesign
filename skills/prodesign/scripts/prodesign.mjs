#!/usr/bin/env node
// prodesign 工作流脚手架与校验（零依赖）
// 用法：node prodesign.mjs <init|new|status|validate|archive|help> [参数] [--flags]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TPL = path.join(SKILL_DIR, 'templates');

const argv = process.argv.slice(2);
const cmd = argv[0] || 'help';
const pos = argv.slice(1).filter(a => !a.startsWith('--'));
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith('--')).map(a => {
    const [k, ...v] = a.slice(2).split('=');
    return [k, v.length ? v.join('=') : true];
  })
);

const log = (...a) => console.log(...a);
const die = (m) => { console.error('✖ ' + m); process.exit(1); };
const today = () => new Date().toISOString().slice(0, 10);

function findRoot() {
  let d = process.cwd();
  for (;;) {
    if (fs.existsSync(path.join(d, 'prodesign', 'project.md'))) return path.join(d, 'prodesign');
    if (path.basename(d) === 'prodesign' && fs.existsSync(path.join(d, 'project.md'))) return d;
    const p = path.dirname(d);
    if (p === d) break;
    d = p;
  }
  die('未找到 prodesign/ 目录（先在产品资料根目录运行 init）');
}

function tpl(name, vars = {}) {
  let t = fs.readFileSync(path.join(TPL, name), 'utf8');
  for (const [k, v] of Object.entries(vars)) t = t.replaceAll('{{' + k + '}}', v);
  return t;
}

function writeIfAbsent(p, content) {
  if (fs.existsSync(p)) { log('  = 已存在，跳过 ' + p); return; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  log('  + ' + p);
}

function parseSlug(slug) {
  const m = /^v(\d+(?:\.\d+)*)-([a-z0-9][a-z0-9-]*)$/.exec(slug);
  if (!m) die('版本目录名须形如 v4.4-alert-notify（v<版本号>-<主题slug>），收到：' + slug);
  const ver = m[1];
  return { ver, usp: 'V' + ver.replace(/\./g, ''), topic: m[2] };
}

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const listDir = (p, filter = () => true) =>
  fs.existsSync(p) ? fs.readdirSync(p).filter(filter) : [];

// ───────────────────────── init ─────────────────────────
function cmdInit() {
  const base = path.join(process.cwd(), 'prodesign');
  const product = pos[0] || path.basename(process.cwd());
  for (const d of ['deliverables/prd', 'deliverables/prototypes', 'deliverables/tools/checks', 'changes/archive', 'registry'])
    fs.mkdirSync(path.join(base, d), { recursive: true });
  const vars = { PRODUCT: product, DATE: today() };
  writeIfAbsent(path.join(base, 'project.md'), tpl('project.md', vars));
  writeIfAbsent(path.join(base, 'AGENTS.md'), tpl('dir-agents.md', vars));
  writeIfAbsent(path.join(base, 'deliverables', 'index.md'), tpl('index.md', vars));
  writeIfAbsent(path.join(base, 'registry', 'ids.md'), tpl('ids.md', vars));
  log('✔ 初始化完成：' + base);
  log('  下一步：node prodesign.mjs new v1-<主题slug>');
}

// ───────────────────────── new ─────────────────────────
function cmdNew() {
  const root = findRoot();
  const slug = pos[0] || die('用法：new v<版本号>-<主题slug>（如 new v4.4-alert-notify）');
  const { ver, usp, topic } = parseSlug(slug);
  const dir = path.join(root, 'changes', slug);
  if (fs.existsSync(dir)) die('工作区已存在：' + dir);
  const archived = listDir(path.join(root, 'changes', 'archive')).some((d) => d.endsWith('-' + slug));
  if (archived) die('该 slug 已归档过，请换新版本号：' + slug);
  fs.mkdirSync(path.join(dir, 'prototypes'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'checks'), { recursive: true });
  const vars = { VERSION: 'V' + ver, VER: ver, USP: usp, SLUG: slug, TOPIC: topic, DATE: today() };
  for (const f of ['brief.md', 'requirements.md', 'research.md', 'prd.md', 'review.md', 'changelog.md', 'handoff.md'])
    fs.writeFileSync(path.join(dir, f), tpl(f, vars));
  fs.copyFileSync(path.join(TPL, 'check-template.js'), path.join(dir, 'checks', '_template.js'));
  log('✔ 新版本工作区：' + dir);
  log('  编号前缀：US-' + usp + '-* / A' + ver + '-*');
  log('  阶段顺序：brief → requirements → research → prd → review → prototypes+checks → validate → archive');
}

// ───────────────────────── status ─────────────────────────
function cmdStatus() {
  const root = findRoot();
  const changes = listDir(path.join(root, 'changes'), (s) => s !== 'archive')
    .filter((s) => fs.statSync(path.join(root, 'changes', s)).isDirectory());
  if (!changes.length) { log('（无进行中的版本工作区）'); }
  for (const slug of changes) {
    const dir = path.join(root, 'changes', slug);
    const req = read(path.join(dir, 'requirements.md'));
    const qOpen = (req.match(/^\|\s*Q\d+.*待定论/gm) || []).length;
    const qAll = (req.match(/^\|\s*Q\d+/gm) || []).length;
    const fdefs = (read(path.join(dir, 'prd.md')).match(/^####\s+F\d+-\d+/gm) || []).length;
    const ldefs = (read(path.join(dir, 'research.md')).match(/^\|\s*L\d+\s*\|/gm) || []).length;
    const rounds = (read(path.join(dir, 'review.md')).match(/^\|\s*\d+\s*\|/gm) || []).length;
    const protos = listDir(path.join(dir, 'prototypes'), (f) => f.endsWith('.html')).length;
    const checks = listDir(path.join(dir, 'checks'), (f) => f.endsWith('.js') && !f.startsWith('_')).length;
    log('▸ ' + slug);
    log(`    ①需求：Q ${qAll - qOpen}/${qAll} 已定论${qOpen ? '（余 ' + qOpen + ' 待拍板）' : ''}`);
    log(`    ②竞品：教训 L×${ldefs}   ③PRD：功能点 F×${fdefs}   ④评审：${rounds} 轮`);
    log(`    ⑤原型：${protos} 页 / 断言脚本 ${checks} 个`);
  }
  const archived = listDir(path.join(root, 'changes', 'archive'));
  log(`已归档版本：${archived.length ? archived.join('、') : '（无）'}`);
}

// ───────────────────────── validate ─────────────────────────
function headingDefs(text, re) {
  return [...text.matchAll(re)].map((m) => m[1]);
}
function dupes(arr) {
  const seen = new Set(), d = new Set();
  for (const x of arr) { if (seen.has(x)) d.add(x); seen.add(x); }
  return [...d];
}

function validateOne(root, slug, strict) {
  const dir = path.join(root, 'changes', slug);
  if (!fs.existsSync(dir)) die('工作区不存在：' + dir);
  const { ver, usp } = parseSlug(slug);
  const errors = [], warns = [];
  const E = (m) => errors.push(m), W = (m) => warns.push(m);

  // 文件齐全
  for (const f of ['brief.md', 'requirements.md', 'research.md', 'prd.md', 'review.md', 'changelog.md', 'handoff.md'])
    if (!fs.existsSync(path.join(dir, f))) E('缺少文件 ' + f);

  const prd = read(path.join(dir, 'prd.md'));
  const req = read(path.join(dir, 'requirements.md'));

  // prd 必备章节
  for (const s of ['背景与目标', '用户故事', '功能需求', '明确不做'])
    if (!new RegExp('^##\\s+\\d*\\.?\\s*.*' + s, 'm').test(prd)) E('prd.md 缺少章节「' + s + '」');
  if (!/^##\s*附录\s*A/m.test(prd)) E('prd.md 缺少「附录 A：架构决策记录」');
  if (!/^##\s*附录\s*C/m.test(prd)) W('prd.md 缺少「附录 C：待确认项（定论回填）」');
  if (!/已知边界/.test(prd)) W('prd.md 缺少「已知边界」声明');
  if (/关联改造/.test(prd) && !/^##\s+\d*\.?\s*.*存量/m.test(prd))
    W('prd.md 含关联改造但缺「存量数据与迁移」章节（老数据怎么办？）');

  // 编号定义与重复
  const fDefs = headingDefs(prd, /^####\s+(F\d+-\d+)\b/gm);
  const aDefs = headingDefs(prd, /^###\s+(A[\d.]+-\d+)\b/gm);
  const usDefs = [...new Set([...prd.matchAll(/\|\s*(US-[A-Za-z0-9.]+-\d+)\s*\|/g)].map((m) => m[1]))];
  for (const d of dupes(fDefs)) E('功能点重复定义：' + d);
  for (const d of dupes(aDefs)) E('架构决策重复定义：' + d);

  // US 前缀与版本一致
  for (const u of usDefs)
    if (!u.startsWith('US-' + usp + '-')) W('用户故事前缀与版本不符（期望 US-' + usp + '-*）：' + u);
  // A 前缀与版本一致
  for (const a of aDefs)
    if (!a.startsWith('A' + ver + '-')) W('决策前缀与版本不符（期望 A' + ver + '-*）：' + a);

  // 与已交付 PRD 撞号
  const dprd = path.join(root, 'deliverables', 'prd');
  for (const f of listDir(dprd, (f) => f.endsWith('.md'))) {
    const t = read(path.join(dprd, f));
    const oldF = new Set(headingDefs(t, /^####\s+(F\d+-\d+)\b/gm));
    const oldA = new Set(headingDefs(t, /^###\s+(A[\d.]+-\d+)\b/gm));
    for (const x of fDefs) if (oldF.has(x)) E(`功能点 ${x} 与已交付 ${f} 撞号（编号让路原则：改本版编号）`);
    for (const x of aDefs) if (oldA.has(x)) E(`决策 ${x} 与已交付 ${f} 撞号`);
  }

  // A 决策必带反向理由
  const aBlocks = prd.split(/^###\s+(?=A[\d.]+-\d+)/m).slice(1);
  for (const b of aBlocks) {
    const id = (b.match(/^(A[\d.]+-\d+)/) || [])[1];
    if (id && !b.split(/^##\s/m)[0].includes('反向理由'))
      (strict ? E : W)('决策 ' + id + ' 缺少「反向理由」');
  }

  // US → F 覆盖契约：每个用户故事至少被一个功能点的「覆盖故事」引用
  const coverText = (prd.match(/覆盖故事[：:].*/g) || []).join('\n');
  if (fDefs.length) {
    const uncoveredUS = usDefs.filter((u) => !coverText.includes(u));
    if (uncoveredUS.length)
      (strict ? E : W)('用户故事未被任何功能点覆盖（F 条目写「覆盖故事」）：' + uncoveredUS.join('、'));
  }

  // Q 定论
  const qRows = req.match(/^\|\s*Q\d+[\s\S]*?$/gm) || [];
  const qOpen = qRows.filter((r) => r.includes('待定论'));
  if (qOpen.length)
    (strict ? E : W)(`待确认项未定论 ${qOpen.length} 项：` + qOpen.map((r) => r.match(/Q\d+/)[0]).join('、') + '（需用户拍板）');

  // Q 定论回填：已定论的 Q 应回填到 prd 附录 C
  const qResolved = qRows.filter((r) => r.includes('已定论')).map((r) => r.match(/Q\d+/)[0]);
  const qMissing = qResolved.filter((q) => !new RegExp('\\|\\s*' + q + '\\b').test(prd));
  if (qMissing.length) W('已定论的待确认项未回填 prd 附录 C：' + qMissing.join('、'));

  // 原型：零外部依赖 + token 纪律（魔法色值）
  const pdir = path.join(dir, 'prototypes');
  const protos = listDir(pdir, (f) => f.endsWith('.html'));
  const hasSkeleton = fs.existsSync(path.join(root, 'deliverables', 'tools', '_页面骨架.html'));
  for (const f of protos) {
    const t = read(path.join(pdir, f));
    if (/(?:src|href)\s*=\s*["']https?:\/\//.test(t)) E('原型含外部依赖引用（违反零依赖规范）：' + f);
    if (/@import\s+url\(\s*["']?https?:/.test(t)) E('原型 CSS 含外部 @import：' + f);
    // 色值只允许出现在 :root 令牌层（<style> 块与行内 style 属性均检查）
    const styles = [...t.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
    const inline = [...t.matchAll(/style\s*=\s*"([^"]*)"/g)].map((m) => m[1]).join('\n');
    const scanned = (styles.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root\s*\{[^}]*\}/g, '') + '\n' + inline);
    const magic = scanned.match(/#[0-9a-fA-F]{3,8}\b(?!\s*\{)|(?:rgba?|hsla?)\(/g) || [];
    if (magic.length)
      (hasSkeleton ? E : W)(`原型含 :root 之外的魔法色值 ${magic.length} 处（应引用 var(--*) 令牌）：` + f);
  }
  if (strict && fDefs.length && !protos.length) W('PRD 已有功能点但无原型页（若本版为纯 PRD 交付，忽略此警告）');

  // 断言覆盖（警告级）
  const cdir = path.join(dir, 'checks');
  const checksText = listDir(cdir, (f) => f.endsWith('.js') && !f.startsWith('_'))
    .map((f) => read(path.join(cdir, f))).join('\n');
  if (protos.length) {
    const uncovered = [...new Set(fDefs)].filter((id) => !checksText.includes(id));
    if (uncovered.length) W('以下功能点无断言锚定（如属演示边界，请写入已知边界）：' + uncovered.join('、'));
  }

  // 产品自有校验器钩子：deliverables/tools/validators/*.js（产品专属知识，本脚本只调度不理解）
  // 约定：node <校验器> <工作区prototypes目录> <deliverables/prototypes目录>，非零退出=未通过
  const vdir = path.join(root, 'deliverables', 'tools', 'validators');
  if (protos.length) {
    for (const f of listDir(vdir, (f) => f.endsWith('.js') && !f.startsWith('_'))) {
      const r = spawnSync('node', [path.join(vdir, f), pdir, path.join(root, 'deliverables', 'prototypes')], {
        encoding: 'utf8', timeout: 60000, cwd: root,
      });
      if (r.error) E('产品校验器无法执行 validators/' + f + '：' + r.error.message);
      else if (r.status !== 0) {
        const out = ((r.stdout || '') + (r.stderr || '')).trim();
        E('产品校验器未通过：validators/' + f + (out ? '\n' + out.split('\n').map((l) => '      ' + l).join('\n') : ''));
      }
    }
  }

  // 输出
  const tag = strict ? '（strict）' : '';
  if (!errors.length && !warns.length) log(`✔ ${slug} 校验通过${tag}`);
  else {
    log(`── ${slug} 校验结果${tag} ──`);
    errors.forEach((m) => log('  ✖ ' + m));
    warns.forEach((m) => log('  ⚠ ' + m));
    log(`  错误 ${errors.length} / 警告 ${warns.length}`);
  }
  return errors.length;
}

function validateIndex(root) {
  const idx = read(path.join(root, 'deliverables', 'index.md'));
  let bad = 0;
  for (const [sub, label] of [['prd', 'PRD'], ['prototypes', '原型']]) {
    for (const f of listDir(path.join(root, 'deliverables', sub), (f) => !f.startsWith('.')))
      if (!idx.includes(f)) { log('  ⚠ 交付索引未收录' + label + '：' + f); bad++; }
  }
  if (!bad) log('✔ 交付索引收录完整');
  return 0; // 索引问题按警告处理
}

function cmdValidate() {
  const root = findRoot();
  let slugs = pos;
  if (flags.all)
    slugs = listDir(path.join(root, 'changes'), (s) => s !== 'archive')
      .filter((s) => fs.statSync(path.join(root, 'changes', s)).isDirectory());
  if (!slugs.length && !flags.index) die('用法：validate <slug> [--strict] ｜ validate --all ｜ validate --index');
  let errs = 0;
  for (const s of slugs) errs += validateOne(root, s, !!flags.strict);
  if (flags.index) validateIndex(root);
  process.exit(errs ? 1 : 0);
}

// ───────────────────────── archive ─────────────────────────
function cmdArchive() {
  const root = findRoot();
  const slug = pos[0] || die('用法：archive <slug> [--date=YYYY-MM-DD]');
  const dir = path.join(root, 'changes', slug);
  if (!fs.existsSync(dir)) die('工作区不存在：' + dir);
  if (validateOne(root, slug, true)) die('strict 校验未通过，先修复再归档');

  const date = typeof flags.date === 'string' ? flags.date : today();
  const copies = [];

  const prdDst = path.join(root, 'deliverables', 'prd', slug + '.md');
  fs.copyFileSync(path.join(dir, 'prd.md'), prdDst);
  copies.push(prdDst);

  const pdir = path.join(dir, 'prototypes');
  for (const f of listDir(pdir, (f) => f.endsWith('.html'))) {
    const dst = path.join(root, 'deliverables', 'prototypes', f);
    if (fs.existsSync(dst)) log('  ! 覆盖已交付原型（关联改造）：' + f);
    fs.copyFileSync(path.join(pdir, f), dst);
    copies.push(dst);
  }

  const cdir = path.join(dir, 'checks');
  if (listDir(cdir, (f) => f.endsWith('.js') && !f.startsWith('_')).length) {
    const dst = path.join(root, 'deliverables', 'tools', 'checks', slug);
    fs.cpSync(cdir, dst, { recursive: true });
    copies.push(dst);
  }

  const adst = path.join(root, 'changes', 'archive', date + '-' + slug);
  fs.renameSync(dir, adst);
  log('✔ 工作区已归档：' + path.relative(root, adst));
  log('✔ 交付物已入库：');
  copies.forEach((c) => log('   ' + path.relative(root, c)));

  const idx = read(path.join(root, 'deliverables', 'index.md'));
  const missing = copies.map((c) => path.basename(c)).filter((b) => !idx.includes(b));
  if (missing.length) {
    log('⚠ 请更新 deliverables/index.md 收录以下文件：');
    missing.forEach((m) => log('   - ' + m));
  }
  log('⚠ 请回填 registry/ids.md（本版编号占用见工作区 changelog.md）与 project.md 版本史');
}

// ───────────────────────── help ─────────────────────────
function cmdHelp() {
  log(`prodesign 工作流脚本（零依赖）

  init [产品名]                    在当前目录创建 prodesign/ 资料库骨架
  new v<版本>-<主题slug>           开新版本工作区（模板实例化编号前缀）
  status                           各工作区阶段进度
  validate <slug> [--strict]       校验单个工作区；--all 全部；--index 交付索引收录检查
  archive <slug> [--date=Y-M-D]    strict 校验 → 交付物入库 deliverables/ → 工作区归档

  目录结构与规范见 ~/.claude/skills/prodesign/reference/conventions.md`);
}

({ init: cmdInit, new: cmdNew, status: cmdStatus, validate: cmdValidate, archive: cmdArchive, help: cmdHelp }[cmd] || (() => die('未知命令：' + cmd + '（node prodesign.mjs help）')))();
