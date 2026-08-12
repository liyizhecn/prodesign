// 产品专属校验器（放入 deliverables/tools/validators/，validate 时自动执行）
// 调用约定：node <本文件> <工作区prototypes目录> <deliverables/prototypes目录>
// 退出约定：全部通过 exit 0；任何不一致 exit 1（输出显示在 validate 报告里）
// 内置五查：① 菜单签名 ② token 漂移（:root ≡ 骨架） ③ 基座类名 ④ 页型必备元素 ⑤ token 对比度（WCAG AA）
// 本文件是产品知识的载体：首版实例化时按本产品真实 DOM 调整选择器与白名单；零依赖（不引 jsdom）。
const fs = require('fs');
const path = require('path');

const [wsDir, deliveredDir] = process.argv.slice(2);
const toolsDir = deliveredDir ? path.join(deliveredDir, '..', 'tools') : null;

// 收集页面：工作区同名页覆盖已交付页（关联改造场景），避免同一页校验两份
const pages = [];
for (const dir of [wsDir, deliveredDir]) {
  if (!dir || !fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    if (!pages.some((p) => p.name === f)) pages.push({ name: f, html: fs.readFileSync(path.join(dir, f), 'utf8') });
  }
}

let fail = 0;
const bad = (m) => { console.log('  ❌ ' + m); fail++; };
const skip = (m) => console.log('  ⚠ 跳过：' + m);

// ── ① 菜单签名一致（白名单：渐进铺设允许差异的页，注明理由）─────────────
const MENU_WHITELIST = []; // 例：['人员会话记录_原型.html'] —— M14 按设计不入菜单
const menuTplPath = toolsDir && path.join(toolsDir, '_菜单模板.html');
if (menuTplPath && fs.existsSync(menuTplPath)) {
  const sig = (html) =>
    (html.match(/class="menu-item[^"]*"[^>]*>([^<]*)</g) || []).map((s) => s.replace(/.*>/, '')).join('|');
  const want = sig(fs.readFileSync(menuTplPath, 'utf8'));
  for (const p of pages) {
    if (MENU_WHITELIST.includes(p.name)) continue;
    if (sig(p.html) !== want) bad(p.name + ' 菜单与 _菜单模板.html 不一致');
  }
} else skip('_菜单模板.html 不存在，菜单一致性未校验');

// ── ② token 漂移：每页 :root 与骨架逐条一致（新增/修改 token 必须先进骨架）──
const skeletonPath = toolsDir && path.join(toolsDir, '_页面骨架.html');
const parseTokens = (html) => {
  const m = html.match(/:root\s*\{([^}]*)\}/);
  if (!m) return null;
  const o = {};
  for (const mm of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) o[mm[1]] = mm[2].trim();
  return o;
};
if (skeletonPath && fs.existsSync(skeletonPath)) {
  const base = parseTokens(fs.readFileSync(skeletonPath, 'utf8'));
  for (const p of pages) {
    const t = parseTokens(p.html);
    if (!t) { bad(p.name + ' 无 :root 令牌层（应从骨架复制起步）'); continue; }
    const drift = [];
    for (const k of Object.keys(base)) {
      if (!(k in t)) drift.push('缺 --' + k);
      else if (t[k] !== base[k]) drift.push('--' + k + ' 值不同');
    }
    for (const k of Object.keys(t)) if (!(k in base)) drift.push('私增 --' + k + '（新 token 先进骨架）');
    if (drift.length) bad(p.name + ' token 漂移：' + drift.slice(0, 5).join('；') + (drift.length > 5 ? ' 等 ' + drift.length + ' 处' : ''));
  }
} else skip('_页面骨架.html 不存在，token 漂移未校验');

// 完整 class token 匹配（避免 page-desc 被 desc 误匹配）
const hasClass = (html, c) => new RegExp('class="(?:[^"]*\\s)?' + c + '(?:\\s[^"]*)?"').test(html);

// ── ③ 基座结构类名存在（防「.layout vs .app 顶栏沉底」类布局事故）─────────
const BASE_CLASSES = ['app', 'sidebar', 'topbar', 'content'];
for (const p of pages) {
  const missing = BASE_CLASSES.filter((c) => !hasClass(p.html, c));
  if (missing.length) bad(p.name + ' 缺基座结构类名：.' + missing.join(' .'));
}

// ── ④ 页型必备元素（patterns.md：每页声明 page-type，按页型查必备结构）─────
const PAGE_TYPE_REQUIRED = {
  list: ['table-toolbar', 'table', 'pagination'],
  detail: ['desc'],
  form: ['form-item'],
  dashboard: ['stat-row'],
  result: ['empty'],
  skeleton: [], // 骨架/菜单模板豁免
};
const undeclared = [];
for (const p of pages) {
  const m = p.html.match(/<meta\s+name="page-type"\s+content="(\w+)"/);
  if (!m) { undeclared.push(p.name); continue; }
  const req = PAGE_TYPE_REQUIRED[m[1]];
  if (!req) { bad(p.name + ' 页型未知：' + m[1] + '（合法值：' + Object.keys(PAGE_TYPE_REQUIRED).join('/') + '）'); continue; }
  const missing = req.filter((c) => !hasClass(p.html, c));
  if (missing.length) bad(p.name + ' 页型 ' + m[1] + ' 缺必备元素：.' + missing.join(' .'));
}
if (undeclared.length) skip('未声明 page-type（新页必须声明，存量页渐进补齐）：' + undeclared.join('、'));

// ── ⑤ token 对比度（WCAG AA，从骨架令牌计算，纯数学零依赖）─────────────────
if (skeletonPath && fs.existsSync(skeletonPath)) {
  const base = parseTokens(fs.readFileSync(skeletonPath, 'utf8')) || {};
  const resolve = (v, d = 0) => {
    const m = v && v.match(/^var\(--([\w-]+)\)$/);
    return m && base[m[1]] && d < 8 ? resolve(base[m[1]], d + 1) : v;
  };
  const parseColor = (v) => {
    if (!v) return null;
    v = v.trim();
    let m = v.match(/^#([0-9a-f]{3})$/i);
    if (m) return [...m[1]].map((c) => parseInt(c + c, 16)).concat(1);
    m = v.match(/^#([0-9a-f]{6})$/i);
    if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
    m = v.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    return null;
  };
  const white = [255, 255, 255, 1];
  const over = (c, bg) => [0, 1, 2].map((i) => c[i] * c[3] + bg[i] * (1 - c[3]));
  const lum = (c) => {
    const f = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  // [前景 token, 背景 token, 最低对比度]：正文 4.5，辅助文字/组件反白 3.0
  const PAIRS = [
    ['text-1', 'bg-container', 4.5], ['text-2', 'bg-container', 4.5],
    ['text-1', 'bg-page', 4.5], ['text-2', 'bg-page', 4.5],
    ['text-3', 'bg-container', 3.0],
    ['text-inverse', 'seed-primary', 3.0], ['text-inverse', 'seed-danger', 3.0],
  ];
  for (const [fg, bg, min] of PAIRS) {
    const fc = parseColor(resolve(base[fg])), bc = parseColor(resolve(base[bg]));
    if (!fc || !bc) continue; // 解析不了的组合跳过（如渐变）
    const bgFlat = over(bc, white); // 背景先合成到白底（rgba 背景场景）
    const l1 = lum(over(fc, bgFlat)), l2 = lum(bgFlat);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < min) bad(`对比度不达标：--${fg} 对 --${bg} = ${ratio.toFixed(2)}:1（要求 ≥ ${min}:1）`);
  }
}

// ── ⑥ 产品自定义检查（TODO：跨页数据自洽，如部门清单一致、汇总恒等）───────

console.log(fail ? `validators 未通过 ${fail} 项（共 ${pages.length} 页）` : `✅ ${pages.length} 页全部通过（菜单/token/基座/页型/对比度五查）`);
process.exit(fail ? 1 : 0);
