// @ts-check
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { defaultProjectsUrl, parseArgs, suggestSlug, validateName, validatePortfolio, validateSlug } from './client-init/input.mjs';
import { preflight } from './client-init/preflight.mjs';
import { apply, resume } from './client-init/apply.mjs';

const help = `Client initializer — default plan-only preview
Usage: corepack pnpm init:client [options]
Run from the root of an existing clean GitHub starter clone. No files are changed.

Options (omitted identity fields are prompted):
  --name NAME           Client display name, separate from the repository slug
  --slug SLUG           Lowercase package/repository name
  --uid UUID            Optional public portfolio owner; omit to skip
  --projects-url URL    Public HTTPS service URL; requires --uid
  --confirm-plan SLUG   Confirm only this read-only plan (not apply/publication)
  --help                Show help without inspecting the clone

Interactive confirmation: type PLAN <slug>. EOF/refusal stops with exit 1.
Default plan-only mode: No files are changed; no backup, history or remote changes.
Apply/resume (explicit, separate from plan confirmation):
  --apply               Apply to this clone, with interactive safety confirmations
  --author-name NAME    Explicit author for independent history (required with apply)
  --author-email EMAIL  Explicit author email (required with apply)
  --resume ABS_BACKUP   Resume only this recorded operation, from its current root
Apply checks verified mocklabapp private-repository creation permissions and collision before editing.
Retained external backup, validation and HISTORY approval precede new history.
PUBLISH approval creates a private org repository and pushes; push may deploy.
Declining publication preserves local preparation. Vercel setup remains manual.
See docs/client-initializer.md for recovery and supported-layout restrictions.
`;

async function main() {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    stdout.write(help);
    return;
  }
  if (process.versions.node.split('.')[0] !== '24') throw new Error('Node 24.x is required.');
  const args = parseArgs(process.argv.slice(2));
  const lines = createInterface({ input: stdin, crlfDelay: Infinity });
  const iterator = lines[Symbol.asyncIterator]();
  /** @param {string} prompt */
  const ask = async (prompt) => {
    stdout.write(prompt);
    const line = await iterator.next();
    if (line.done) throw new Error(args.has('--apply') || args.has('--resume')
      ? 'Input ended; no further changes made. Inspect retained state and resume explicitly.'
      : 'Input ended; no changes made.');
    return line.value;
  };
  try {
    const backup = args.get('--resume');
    if (backup !== undefined) { await resume(backup, ask); return; }
    const name = validateName(args.get('--name') ?? await ask('Client display name: '));
    const suggestion = suggestSlug(name);
    const slug = validateSlug(args.get('--slug') ?? (await ask(`Slug [${suggestion}]: `) || suggestion));
    // Fully specified identity flags default to no portfolio, useful for automation.
    const interactive = !args.has('--name') || !args.has('--slug');
    const uid = args.get('--uid') ?? (interactive ? await ask('Portfolio owner UUID (blank to skip): ') : '');
    let url = args.get('--projects-url');
    if (uid && url === undefined && interactive) {
      url = await ask(`Public HTTPS service URL [${defaultProjectsUrl}]: `) || defaultProjectsUrl;
    }
    const portfolio = validatePortfolio(uid, url);
    if (args.has('--apply')) { await apply({ name, slug, portfolio }, args, ask); return; }
    const plan = await preflight(process.cwd(), slug, !!portfolio);
    stdout.write(`\nPLAN ONLY — no files will change\nExisting clone: ${plan.root}\nSource commit: ${plan.source}\n`);
    stdout.write(`Display name: ${name}\nPackage/repository slug: ${slug}\nFuture private repository: mocklabapp/${slug}\n`);
    stdout.write('Proposed identity edits: package.json (name), src/config/site.ts (site.name), docs/project-brief.md (confirmed identity only)\n');
    stdout.write(portfolio
      ? `Portfolio: proposed ignored .env with MOCKLAB_USER_ID=${portfolio.uid} and MOCKLAB_PROJECTS_URL=${portfolio.url}\n`
      : 'Portfolio: disabled; no environment file proposed\n');
    stdout.write(`Future backup: ${plan.backup} (not created or verified)\n`);
    stdout.write('Backup must retain original Git metadata and touched files outside the client repo before any edits.\n');
    stdout.write(`Future final directory: ${plan.destination} (rename last)\n`);
    stdout.write('Pending: backup, local edits, validation, new history, GitHub, directory rename\n');
    const confirmation = args.has('--confirm-plan')
      ? `PLAN ${args.get('--confirm-plan')}` : await ask(`Type PLAN ${slug} to confirm this plan only: `);
    if (confirmation !== `PLAN ${slug}`) throw new Error('Plan not confirmed; no changes made.');
    stdout.write('PLAN CONFIRMED — no files changed, no backup created, no initialization completed.\n');
    stdout.write('T2 must recheck state and obtain separate local/history and publication approvals. Vercel remains manual.\n');
    stdout.write('Continue client discovery via docs/project-kickoff.md; this is not design or launch approval.\n');
  } finally {
    lines.close();
  }
}

try {
  await main();
} catch (error) {
  // Only controlled diagnostics; never print child-process output or remote URLs.
  console.error(error instanceof Error ? error.message : 'Preparation failed; no changes made.');
  process.exitCode = 1;
}
