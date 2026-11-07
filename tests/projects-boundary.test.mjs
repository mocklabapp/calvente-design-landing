import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fixture } from './helpers/build-fixture.mjs';

test('Astro rejects browser imports of the privileged projects function', async () => {
  const result = await fixture(async ({ root }) => {
    await appendFile(join(root, 'src/pages/index.astro'), `
<script>
  import { getProjects } from '../lib/projects';
  getProjects().then(console.log);
</script>
`);
  });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /astro:env\/server/);
  assert.match(result.output, /ServerOnlyModule|server-side/i);
});
