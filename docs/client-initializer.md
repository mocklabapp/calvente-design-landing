# Initialize a client in the existing clone

The initializer works **in place** in a normal clone of `mocklabapp/base-landing-mocklab`. Its default remains a read-only plan. Explicit `--apply` prepares client identity and independent history; separate approval creates and publishes a **private** `mocklabapp/<slug>` repository. The directory is renamed last. It never configures or deploys Vercel.

## Quick path

1. Use Node 24.x. Complete the [explicit frozen dependency installation](../README.md#quick-start) before starting. Install/authenticate GitHub CLI yourself. No dependency installation is performed by the initializer.
2. Start at the clean clone root. Preview with `corepack pnpm init:client` or the command below. `PLAN <slug>` confirms only the read-only plan.
3. Apply with an explicit Git author. Review the exact absolute backup location and type each requested confirmation. Do not paste a blanket approval.
4. After local validation and new history, either decline publication or approve the separately identified private repository and push. **A push can trigger deployment integrations.**
5. After successful publication, the existing directory is renamed to the slug. Change your shell's directory to the printed location. Keep the backup.

```sh
# Read-only, backward-compatible planning:
node scripts/init-client.mjs --name 'Clínica Norte' --slug clinica-norte --confirm-plan clinica-norte

# Apply; confirmations remain interactive:
node scripts/init-client.mjs --apply --name 'Clínica Norte' --slug clinica-norte \
  --author-name 'Project Maintainer' --author-email 'maintainer@example.com'
```

Use your real, approved commit author, not the example identity. Omitted display name/slug fields are prompted; the suggested slug is editable. `--help` requires no clone. No `--yes`, force push, existing-repository adoption, rollback or backup-deletion option exists.

## Approval and ordering

| Confirmation | What follows |
| --- | --- |
| `PLAN <slug>` / `--confirm-plan <slug>` | Read-only preview; no backup or durable operation record. Legacy plan output is retained for compatibility. |
| `APPLY <slug>` then `BACKUP <absolute-path>` | Recheck source; create a private external backup of original Git metadata and exact touched-file bytes. Verify hashes and source object integrity before edits. |
| After backup verification | Change package name, shared `site.name` and append confirmed identity/source version to the brief. Optionally create an ignored local environment file. Run local validation. |
| `HISTORY <slug>` | Retain the original Git directory too, then initialize an independent `main` commit with the explicit author and source/operation IDs. No original history is deleted. |
| `PUBLISH mocklabapp/<slug>` | Recheck collision/rights; create a private repository, verify its exact identity, then push without force. Rename the existing directory only after verifying the published commit. |
| `RESUME <slug>` | Reconcile an explicitly selected operation against the actual root, backup, files and history. |
| `REMOTE mocklabapp/<slug> <recorded-id>` | Resume publication only for the verified operation-created repository. This can push and trigger deployment integrations. |

Ordinary refusal/EOF stops before mutation wherever possible. Refusal after preparation retains actual completed work. Declining publication exits 0 with **LOCAL PREPARED — publication pending**, not a completion claim; directory rename also remains pending. Other refusal/failure exits 1. Only verified publication plus final directory identity produces **INITIALIZATION COMPLETE**.

## Supported input and clone

- Display name: 1–100 characters, no controls or surrounding whitespace. Slug: 1–63 lowercase ASCII letters/digits separated by single internal hyphens; not the starter name.
- Source origin: exactly `mocklabapp/base-landing-mocklab` over HTTPS, SCP-style SSH or `ssh://git@github.com/`, with optional `.git`. Credentials in URLs are rejected and never echoed.
- A clean, complete, self-contained normal clone at its canonical root is required. No worktrees, submodules, alternate object stores, shallow history, replace refs, linked/hardlinked managed files, custom active hooks, attributes, filters or Git configuration includes/overrides.
- The parent directory must be owned by the current user and not writable by other users. Source, backup and destination must not be changed concurrently. Destination/backup collisions are stops, never overwrite/adoption requests.
- Apply requires authenticated **active mocklabapp membership** and verified repository-creation capability. Administrators are supported; ordinary members additionally require the organization's explicit private-repository creation policy. General/public-only creation permission is insufficient. Unknown response shapes, missing policy and auth/network failures stop before local edits. A repository lookup's HTTP 404 is provisional: members may not see an existing private repository. Creation remains authoritative; a denied, colliding or ambiguous creation retains local recovery and never authorizes adoption, replay or a public fallback.
- Installed Astro must resolve inside this clone's `node_modules`. The supported `validate` script is the existing `astro check && astro build && node --test tests/*.test.mjs`. The initializer executes the local Astro binary and tracked Node tests directly, in that order, without a package manager or shell. Custom validation contracts stop before edits.

Only known source-tracked regular files are staged for the fresh history. The canonical `.env.example` is required: runtime validation permits only the two approved blank assignments, whitespace and comments (no unknown, missing, duplicate or nonblank keys). It is included byte-for-byte unchanged in the new commit, so fresh clones retain the setup contract. Other environment files, generated directories, credential/key filenames and excluded paths are not staged. Unknown environment material is not opened; only the verified operation-created public file may be checked. Ignored working files are never copied into the backup. The original Git object database is retained as history; this is **not** a secret-removal/sanitization tool for previously committed material.

## Optional portfolio

Omit `--uid` to skip portfolio when both identity flags are supplied. Interactive input offers a blank UUID to skip. Otherwise supply a versioned UUID and explicitly choose a public HTTPS DNS service URL:

```sh
node scripts/init-client.mjs --apply --name 'Clínica Norte' --slug clinica-norte \
  --author-name 'Project Maintainer' --author-email 'maintainer@example.com' \
  --uid 123e4567-e89b-42d3-a456-426614174000 \
  --projects-url https://service.example.com/public-projects
```

The interactive prompt offers `https://mygqfdbloqojffhsurgo.supabase.co/functions/v1/public-projects` explicitly; accept only if appropriate. No live service probe occurs. URLs cannot contain credentials, query strings, fragments, literal IPs or custom ports. Validation is syntactic, not a DNS/availability guarantee.

Apply and resume refuse unknown root environment filenames without opening them, including when portfolio is skipped: otherwise downstream validation could load human-owned data. Move them yourself before running. The runtime reads and validates the canonical blank `.env.example`, but never modifies it or echoes invalid input. An optional `.env` is created exclusively, mode 0600, only if Git already ignores it; it contains only `MOCKLAB_PROJECTS_URL` and `MOCKLAB_USER_ID`. Before downstream validation, resume checks its recorded device/inode/user identity and private mode before opening it, then requires the exact expected public bytes. Added files, replacement files and altered content/modes stop without overwriting anything. No Supabase key/JWT is requested. These public selector values are not secrets.

For Vercel, manually import the private repository and set those two variable names if enabled. Identity initialization grants no content, design, domain or launch approval. Continue [client discovery](project-kickoff.md) and the [projects guide](projects.md).

## Resume and manual recovery

The printed sibling `.<slug>-client-init-backup` is retained with mode 0700. Copied files and the atomic journal are private (0600). It contains original Git metadata, exact original identity bytes, hash manifests, source commit, root filesystem identity and minimal progress. The explicit author/public identity data are needed for deterministic recovery; no credential or environment-file contents are copied into it. The journal checksum detects corruption, not an adversarial rewrite by its owning user.

From the operation's **current** root:

```sh
node scripts/init-client.mjs --resume /absolute/path/.clinica-norte-client-init-backup
```

`--resume` cannot be combined with identity/apply options. It never means “adopt this existing repository.” Backups, file hashes/modes, independent commit/tree, root inode and recorded GitHub numeric/node IDs must match. A verified final rename can be reconciled by directory identity if the process stopped before saving its new path.

| Stopped state | What to do |
| --- | --- |
| Before a complete backup journal | Original source remains; inspect the partial backup manually. Do not overwrite it or pretend it is a verified recovery record. |
| Identity edits / failed validation / declined history | Preserve the backup. Investigate the failing local check; explicit resume recognizes only exact original/expected identity bytes and repeats validation before history replacement. Foreign edits stop. |
| Interrupted environment creation | If creation or its filesystem identity was not recorded, an existing file is ambiguous (including older journals recording only a creation boolean). Inspect manually; the tool will not read, replace or adopt it. |
| Interrupted history transition | A finished independent commit is recognized from its actual tree/message/author. A missing Git directory or partial index requires manual inspection of `original.git`, `retired.git` and the working directory. No automatic destructive rollback. |
| Declined publication | Resume later, confirm the operation, then approve publication. The prepared local commit remains intact. |
| Creation started but identity not recorded | **Stop for manual GitHub inspection.** Success, timeout, failure or crash can be ambiguous; creation is never blindly replayed and an existing repository is never adopted. There is no automatic escape hatch. |
| Push interrupted | Confirm the recorded remote. If its actual `main` commit matches, continue without another push. A missing/different branch after an uncertain push stops for manual inspection. |
| Final rename collision/failure | Source and backup remain. Resolve the filesystem collision/permissions yourself, then explicitly resume; nothing is overwritten or removed. |
| Hash, journal, ownership or repository identity mismatch | Preserve all evidence and inspect manually. Do not edit the journal to force progress. |

There is no concurrent-run coordination with other tools. Keep exclusive control of the clone and sibling paths while initializing. Filesystem checks and same-parent rename avoid ordinary collisions but are not a sandbox against a malicious same-user process racing filesystem operations.

## Verification

```sh
node --test tests/client-init*.test.mjs
corepack pnpm run check:client-init
corepack pnpm run validate
```

Public CLI tests use isolated temporary Git repositories, fake GitHub and intercepted pushes, with fake installed validation tools for command-flow tests. They exercise refusal, backup/new-history evidence, fresh-clone blank-template/setup compatibility, environment ownership checks before validation, admin/member private permissions, private publication, resume, ambiguous results, crashes and rename collisions without real network or credential access. The full suite also builds a renamed bilingual fixture and preserves the existing site/i18n contracts. These are not real GitHub/Vercel deployment or browser proofs.
