// Focused integration checks for the advisory section; optional prior-site directory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const routes = ['simulador/index.html', 'mi-proyeccion/index.html'];
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
function section(html) {
  const start = html.indexOf('<section class="product-overview');
  assert.ok(start >= 0, 'Information section exists');
  const tags = /<\/?section\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0, match;
  while ((match = tags.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) {
      let end = tags.lastIndex;
      const marker = /^<!-- \/(?:product|advisory)-guide -->/.exec(html.slice(end));
      if (marker) end += marker[0].length;
      return {before: html.slice(0, start), body: html.slice(start, end), after: html.slice(end)};
    }
  }
  throw new Error('Unbalanced information section');
}
const pages = routes.map(route => section(fs.readFileSync(path.join(root, route), 'utf8')));
check(pages[0].body === pages[1].body, 'The two simulator routes present the same advisory content');
for (const page of pages) {
  check((page.body.match(/<li class="advisory-step\b/g) || []).length === 6, 'Six moments of the advisory journey');
  check(page.body.includes('<h2 id="productOverviewTitle">¿Cómo se vería tu asesoría?</h2>'), 'The existing section identifier has the requested new title');
  check(page.body.includes('Tú decides qué compartir.'), 'Sharing context remains voluntary');
  check(page.body.includes('Si decides avanzar después') && page.body.includes('no te obliga a contratar'), 'Later contracting is distinguished from the free initial advisory');
  check(page.body.includes('no rendimientos garantizados'), 'The illustrative scenarios are not presented as guaranteed returns');
  check(page.body.includes('https://listainstituciones.cnsf.gob.mx/'), 'The institution can be checked through the official directory');
  check(!/<script\b|\bonclick\s*=|<iframe\b|<input\b/.test(page.body), 'No additional scripts, forms, tracking or interactive financial inputs');
  check(!/guide-tax|tax151Title|tax93Title|plan-timeline|investment-basket/.test(page.body), 'Previous plan explainer has been replaced completely');
  const ids = [...page.body.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  check(new Set(ids).size === ids.length, 'No duplicate information IDs');
  for (const [, id] of page.body.matchAll(/aria-labelledby="([^"]+)"/g)) check(ids.includes(id), 'Accessible section title exists');
}
const css = fs.readFileSync(path.join(root, 'product-guide.css'), 'utf8');
check(!/@import|url\(/.test(css), 'No added remote dependencies');
check(css.includes('@media(max-width:760px)'), 'Mobile layout is provided');
if (process.argv[2]) {
  const baseline = path.resolve(process.argv[2]);
  for (let i = 0; i < routes.length; i++) {
    const old = section(fs.readFileSync(path.join(baseline, routes[i]), 'utf8'));
    check(pages[i].before.replace('../product-guide.css?v=2','../product-guide.css?v=1') === old.before, 'Only the stylesheet version changes before the section');
    check(pages[i].after === old.after, 'Footer, dialogs and scripts remain identical');
    const contract = html => html.slice(html.indexOf('<div class="product-contract">'), html.lastIndexOf('</section>')).trim();
    check(contract(pages[i].body) === contract(old.body), 'The existing CTA text, attributes and identifiers are unchanged');
  }
  const changed = new Set([...routes, 'product-guide.css', 'test-product-guide.cjs', 'test-projection-flow.cjs', 'GUIA-PRODUCTO.md']);
  const previousFlow = fs.readFileSync(path.join(baseline, 'test-projection-flow.cjs'), 'utf8');
  const currentFlow = fs.readFileSync(path.join(root, 'test-projection-flow.cjs'), 'utf8');
  check(currentFlow.replace("assert(h.includes('¿Cómo se vería tu asesoría?'))", "assert(h.includes('19 alternativas de inversión'))") === previousFlow, 'The existing flow test only updates its obsolete content assertion');
  function compare(dir = '') {
    for (const entry of fs.readdirSync(path.join(baseline, dir), {withFileTypes:true})) {
      const relative = path.join(dir, entry.name);
      if (entry.isDirectory()) compare(relative);
      else if (!changed.has(relative.replaceAll('\\','/'))) check(fs.readFileSync(path.join(baseline, relative)).equals(fs.readFileSync(path.join(root, relative))), 'Unrelated file unchanged: ' + relative);
    }
  }
  compare();
}
console.log(checks + ' focused advisory content and change-boundary checks passed.');
