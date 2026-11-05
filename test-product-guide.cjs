// Focused content/integration checks. Optional first argument: previous site directory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const routes = ['simulador/index.html', 'mi-proyeccion/index.html'];
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
function section(html) {
  const start = html.indexOf('<section class="product-overview');
  assert.ok(start >= 0, 'Product information section exists');
  const tags = /<\/?section\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0, match;
  while ((match = tags.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) {
      let end = tags.lastIndex;
      if (html.slice(end).startsWith('<!-- /product-guide -->')) end += '<!-- /product-guide -->'.length;
      return {before: html.slice(0, start), body: html.slice(start, end), after: html.slice(end)};
    }
  }
  throw new Error('Unbalanced product section');
}
const pages = routes.map(route => section(fs.readFileSync(path.join(root, route), 'utf8')));
check(pages[0].body === pages[1].body, 'Both simulator routes show the same product information');
for (const page of pages) {
  check((page.body.match(/class="guide-chapter /g) || []).length === 3, 'Exactly three information chapters');
  const ids = [...page.body.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  check(new Set(ids).size === ids.length, 'No duplicate information IDs');
  for (const [, id] of page.body.matchAll(/aria-labelledby="([^"]+)"/g)) check(ids.includes(id), 'Section has an existing accessible title');
  check(!/<script\b|\bonclick\s*=|<iframe\b|<input\b/.test(page.body), 'Information does not introduce tracking, forms, scripts or input fields');
  check(!/\bETFs?\b|\bDCA\b/i.test(page.body), 'Investment explanation uses plain language');
  check(page.body.includes('18 aportaciones si pagas mensualmente'), '18 payments are explicitly conditional on monthly frequency');
  check(page.body.includes('10% de tus ingresos acumulables') && page.body.includes('5 UMA anuales'), 'Deduction limit retains both conditions');
  check(page.body.includes('La normativa permite una') && page.body.includes('no es un 20% de todo tu ahorro'), 'Article 93 withholding is qualified and not charged on all savings');
}
const css = fs.readFileSync(path.join(root, 'product-guide.css'), 'utf8');
check(!/@import|url\(/.test(css), 'No added remote dependencies');
check(css.includes('@media(max-width:760px)'), 'Mobile layout is provided');
if (process.argv[2]) {
  const baseline = path.resolve(process.argv[2]);
  for (let i = 0; i < routes.length; i++) {
    const old = section(fs.readFileSync(path.join(baseline, routes[i]), 'utf8'));
    const currentPrefix = pages[i].before.replace(/^.*<link rel="stylesheet" href="\.\.\/product-guide\.css\?v=1">\r?\n/m, '');
    check(currentPrefix === old.before, 'Everything before the information is unchanged except its stylesheet');
    check(pages[i].after === old.after, 'Footer, dialogs and scripts after the information are unchanged');
    const contract = html => html.slice(html.indexOf('<div class="product-contract">'), html.lastIndexOf('</section>')).trim();
    check(contract(pages[i].body) === contract(old.body), 'Existing contract CTA, text and measurement identifiers are unchanged');
  }
  function compare(dir = '') {
    for (const entry of fs.readdirSync(path.join(baseline, dir), {withFileTypes:true})) {
      const relative = path.join(dir, entry.name);
      if (entry.isDirectory()) compare(relative);
      else if (!routes.includes(relative.replaceAll('\\','/'))) check(fs.readFileSync(path.join(baseline, relative)).equals(fs.readFileSync(path.join(root, relative))), 'Unrelated file unchanged: ' + relative);
    }
  }
  compare();
}
console.log(checks + ' focused content and change-boundary checks passed.');
