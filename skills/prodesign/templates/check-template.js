// <原型名> PRD ↔ 原型一致性断言（jsdom）
// 用法：node <本文件>  （需要 jsdom：在有 node_modules 的目录运行，或 npm i --no-save jsdom）
// 规范：每条断言第一个参数锚定 PRD 的 F/A 编号；元素级选择器，不做跨行正则串匹配。
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'prototypes', '<原型文件名>.html'); // TODO
const vc = new VirtualConsole();
const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), { runScripts: 'dangerously', url: 'http://x/', virtualConsole: vc });
const w = dom.window, d = w.document;
// jsdom 缺失 API 打桩（不要用 try/catch 盲扫掩盖真实错误）
w.Element.prototype.scrollIntoView = function () {};
w.confirm = () => true;

let pass = 0, fail = 0; const R = [];
function chk(id, desc, cond) { (cond ? pass++ : fail++); R.push((cond ? '✅' : '❌') + ' [' + id + '] ' + desc); }

// ── 功能断言（锚定 F 编号）──────────────────────────────
// chk('F00-01', '<描述>', <元素级条件>);

// ── 结构性恒等式（两处独立展示的同一事实必须相等）──────
// chk('F00-02', '铃铛未读数 ≡ 收件箱未读条数', badge() === inboxUnread());

// ── 反向结构验证（不该存在的能力断言其不存在）──────────
// chk('A0.0-1', '页面不存在删改台账的函数', typeof w.deleteRecord === 'undefined');

// ── 布局断言（computed-style 级，功能全绿不等于页面能看）──
// chk('布局', '基座容器类名为 .app', !!d.querySelector('.app'));

console.log('════ PRD ↔ 原型 一致性检查 ════');
R.forEach(r => console.log('  ' + r));
console.log('────────────────────────────');
console.log('  通过 ' + pass + ' / ' + (pass + fail) + (fail ? '  ❌ 有 ' + fail + ' 项不一致' : '  ✅ 全部一致'));
process.exit(fail ? 1 : 0);
