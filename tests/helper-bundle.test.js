import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createUiLoader, DEFAULT_COMPONENT_REGISTRY } from '../vendor/helpers/js/ui/ui.loader.js';
const graph = JSON.parse(readFileSync(new URL('../scripts/map-shell-graph.json', import.meta.url)));
test('canonical loader resolves every used factory from pinned bundle and shell has only three Helper artifacts', async () => {
  const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: true });
  for (const name of graph.helperComponents) {
    const result = await loader.get(name, { css: false });
    assert.equal(typeof result, DEFAULT_COMPONENT_REGISTRY[name].export ? 'function' : 'object', name);
  }
  const context = { self: {} }; vm.runInNewContext(readFileSync(new URL('../shell-manifest.js', import.meta.url), 'utf8'), context);
  const helper = context.self.PBB_MAP_SHELL.files.filter(f => f.url.startsWith('vendor/helpers/')).map(f => f.url);
  assert.deepEqual([...helper].sort(), ['vendor/helpers/dist/helpers.ui.bundle.min.css', 'vendor/helpers/dist/helpers.ui.bundle.min.js', 'vendor/helpers/js/ui/ui.loader.js']);
});
test('canonical selected bundle errors never attempt modular fallback for absent bundle or absent factory', async () => {
  const registry = { 'ui.required': { js: './missing-modular-sentinel.js', css: [], deps: [], export: 'createRequired' } };
  const missingFactory = createUiLoader(registry, { preferBundles: true });
  await assert.rejects(missingFactory.get('ui.required', { css: false }), /bundle.*missing module/);
  const missingBundle = createUiLoader(registry, { preferBundles: true, bundles: { ui: { prefixes: ['ui.'], js: './missing-bundle-sentinel.js', css: [] } } });
  await assert.rejects(missingBundle.get('ui.required', { css: false }), e => e.message.includes('missing-bundle-sentinel') && !e.message.includes('missing-modular-sentinel'));
});
