# JS naming patterns (exactly three)

**Human maintainability Wave H4.** New frontend JS must use **one** of these patterns — do not invent a fourth global dialect.

Related: [`human-maintainability.md`](human-maintainability.md) · [`engineering-a-plus-frontend-js.md`](engineering-a-plus-frontend-js.md).

## Decision tree

1. **Pure model** (no DOM; install once) → **Pattern A** (ESM leaf + bridge)  
2. **Classic multi-export host** (many `window` flats for MPA consumers) → **Pattern B** (Kiu bag + Expose)  
3. **Extracted runtime with explicit deps** → **Pattern C** (factory peel)

```
new module
├─ pure model? ──────────────► A  ESM leaf + bridge
├─ multi-export classic host? ► B  Kiu bag + Expose
└─ peel with deps object? ───► C  createKiu*Api(deps)
```

## Pattern A — ESM leaf + bridge

**When:** Pure helpers/models; load order isolated via `type="module"` then classic bridge.

```js
// foo-model.js
export const FooApi = { /* ... */ };
export function installFooModel(target = globalThis) {
  Object.assign(target, FooApi);
  return FooApi;
}

// foo-model-bridge.js (classic defer)
(function () {
  if (typeof installFooModel !== 'function') {
    throw new Error('Foo ESM leaf missing — load type=module before bridge');
  }
  installFooModel(window);
})();
```

## Pattern B — Kiu bag + Expose

**When:** Classic script host that must keep flat `window.foo` for existing callers.

```js
window.KiuFoo = window.KiuFoo || {};
const __kiuFooApi = window.KiuFoo;
window.__kiuFooApi = __kiuFooApi;
function __kiuFooExpose(map) {
  Object.keys(map).forEach((key) => {
    __kiuFooApi[key] = map[key];
    window[key] = map[key];
  });
}

__kiuFooExpose({
  renderFoo,
  handleFooClick,
});
```

Do **not** add new bare `window.renderFoo = renderFoo;` dump blocks.

## Pattern C — Factory peel

**When:** Runtime peel that should not rely on silent free vars.

```js
(function initFooRuntime() {
  if (window.__KIU_FOO_RUNTIME_LOADED) return;
  window.__KIU_FOO_RUNTIME_LOADED = true;

  window.createKiuFooApi = function createKiuFooApi(deps = {}) {
    const { text, state } = deps;
    function renderFoo() { /* uses deps */ }
    const api = { renderFoo };
    Object.assign(window, api); // or expose via Pattern B bag
    return api;
  };
})();
```

## Forbidden (fourth dialect)

- New bare `window.Name = Name` dump clusters  
- New silent free-var peels without `createKiu*Api` / `__kiuCreate*`  
- Ad-hoc `window.__FOO_API` / random namespaces that are not A, B, or C  

Legacy dumps may remain until bagged; **new** code must pick A/B/C.
