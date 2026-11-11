// 在组装时修改已编译组件，保留未涉及的原站代码和动画。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.resolve('site/package.json'));
const { parse, parseExpression } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const folder = 'site/public/vendor/arknights/official/_next/static/chunks/app';
const changed = [];
const prop = (node, key) => node?.properties?.find(p => p.key?.name === key || p.key?.value === key);
const code = node => generate(node, { compact: true }).code;
const jsx = p => p.isCallExpression() && p.node.arguments[1]?.type === 'ObjectExpression'
  && /\.(jsx|jsxs)$/.test(code(p.node.callee).replace(/\)$/, ''));
const hasClass = (p, name) => {
  const value = prop(p.node.arguments[1], 'className')?.value;
  return value && new RegExp('\\.' + name + '(?![\\w$])').test(code(value));
};
const remove = p => { p.replaceWith(t.nullLiteral()); p.skip(); };
const staticElement = p => {
  p.node.arguments[0] = t.stringLiteral('div');
  p.node.arguments[1].properties = p.node.arguments[1].properties.filter(
    v => !['href', 'target', 'onClick', 'prefetch'].includes(v.key?.name));
};

for (const filename of ['layout-56537e00859b2b87.js', 'page-a96c46ff52d96bd7.js']) {
  const target = path.join(folder, filename);
  let source = fs.readFileSync(target, 'utf8');
  const ast = parse(source);
  const edits = [];
  const disabled = /^(DownloadBtn_|SklandBtn|RechargeBtn|UserPanel$|SocialMediaPanel$|WechatModal$)/;
  const selected = new Set(['Header', 'Menu', 'MenuNav', 'SectionHomeClient', 'SectionInfoClient', 'Home', 'VideoHall', 'SubPage', 'SectionMoreClient', 'ListItem']);
  traverse(ast, {
    VariableDeclarator(p) {
      const name = p.node.id.name;
      if (!name || !t.isFunction(p.node.init)) return;
      const fn = p.get('init');
      if (disabled.test(name)) {
        edits.push({ start: fn.node.start, end: fn.node.end, value: '()=>null' });
        changed.push(name);
        p.skip();
        return;
      }
      if (!selected.has(name)) return;
      const start = fn.node.start, end = fn.node.end;
      // 更多内容只保留拥有本地视图的条目。
      if (name === 'SectionMoreClient') fn.traverse({
        CallExpression(q) {
          if (code(q.node.callee) === 'g.map') q.node.callee.object = parseExpression('g.filter(e=>e.view!==undefined)');
        },
      });
      if (name === 'ListItem') fn.traverse({
        ReturnStatement(q) {
          if (t.isConditionalExpression(q.node.argument) && code(q.node.argument.test) === 't.link') q.node.argument = q.node.argument.alternate;
        },
      });
      if (name === 'SubPage') fn.traverse({
        CallExpression(q) {
          if (code(q.node.callee) === 'h.content.buttons.map') q.node.callee.object = parseExpression('h.content.buttons.filter(e=>e.type==="video"&&e.targetVideo)');
        },
        ConditionalExpression(q) {
          if (t.isCallExpression(q.node.consequent) && code(q.node.consequent.callee) === 'window.open') q.replaceWith(parseExpression('e.targetVideo&&showVideo(e.targetVideo.url)'));
        },
      });
      if (name === 'Home') fn.traverse({
        SequenceExpression(q) {
          if (code(q.node).startsWith('e.href&&window.open')) q.replaceWith(parseExpression('e.view&&i(e.view)'));
        },
      });
      fn.traverse({
        CallExpression(q) {
          if (name === 'VideoHall' && code(q.node.callee) === 'fetch') q.node.arguments = [t.stringLiteral('/data/videos.json')];
          if (!jsx(q)) return;
          const type = code(q.node.arguments[0]);
          const props = q.node.arguments[1];
          const isClass = c => hasClass(q, c);
          if (name === 'Header' && ['UserPanel', 'SocialMediaPanel', 'WechatModal'].includes(type)) return remove(q);
          if (name === 'Header' && isClass('button')) {
            const child = code(prop(props, 'children')?.value);
            if (/IconSocialSvg|IconUserSvg/.test(child)) return remove(q);
            if (/IconSoundSvg/.test(child)) {
              props.properties.push(t.objectProperty(t.stringLiteral('aria-label'), t.stringLiteral('背景音乐')));
              props.properties.push(t.objectProperty(t.identifier('title'), t.stringLiteral('背景音乐')));
            }
          }
          if (name === 'Menu' && isClass('medias')) return remove(q);
          if (name === 'MenuNav' && code(prop(props, 'href')?.value || t.nullLiteral()) === 'f.f.links.csCenter') return remove(q);
          if (name === 'SectionHomeClient' && (isClass('downloadList') || isClass('qrcodeAndAgeRating'))) return remove(q);
          if (name === 'SectionInfoClient') {
            if (isClass('detailBtn') || isClass('fullListBtn')) return remove(q);
            if (isClass('imgWrapper') || isClass('newsItem')) staticElement(q);
          }
          if (name === 'VideoHall' && isClass('viewListBtn')) return remove(q);
          if (name === 'SubPage' && type === '"a"') return remove(q);
          if (name === 'Home') {
            if (isClass('moduleItem')) {
              prop(props, 'onClick').value = parseExpression('e.view?()=>{a===t?i(e.view):s(t)}:undefined');
            }
            if (isClass('moduleMenu') || isClass('mainStage')) {
              const children = prop(props, 'children');
              children.value.callee.object = parseExpression('T.filter(e=>e.view)');
              // 过滤菜单后仍使用原始数组索引，保留画面选中与详情状态对应关系。
              const callback = children.value.arguments[0];
              callback.params = [t.identifier('e')];
              if (!t.isBlockStatement(callback.body)) callback.body = t.blockStatement([t.returnStatement(callback.body)]);
              callback.body.body.unshift(parse('let t=T.indexOf(e);').program.body[0]);
            }
          }
        },
      });
      edits.push({ start, end, value: code(fn.node) });
      changed.push(name);
      p.skip();
    },
  });
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
  parse(source);
  fs.writeFileSync(target, source, 'utf8');
}
for (const name of ['Header', 'Menu', 'MenuNav', 'SectionHomeClient', 'SectionInfoClient', 'Home', 'VideoHall', 'SubPage', 'SectionMoreClient', 'ListItem']) {
  if (!changed.includes(name)) throw new Error('未找到待清理组件：' + name);
}
console.log('已清理前端组件：' + changed.join(', '));
