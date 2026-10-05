// scripts/lib/template.mjs
// 파셜을 먼저 펼친 뒤 변수를 한 번만 치환한다. 치환 결과는 재해석하지 않는다.
export function fill(tpl, ctx, partials) {
  const expanded = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`unknown partial: ${name}`);
    return partials[name];
  });
  return expanded.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, key) => {
    if (!(key in ctx)) throw new Error(`unknown variable: ${key}`);
    return ctx[key];
  });
}
