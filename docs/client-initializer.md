# Prepare a client in an existing clone

`corepack pnpm init:client` is a **read-only, plan-only T1 preview**, not a complete initializer. It collects client identity, checks the existing starter clone, and shows the proposed in-place changes. Even after confirmation it changes **nothing**: no files, backups, Git history, remotes, environment files or directories.

## Quick path

1. Start in the root of your existing, clean, normal GitHub clone of `mocklabapp/base-landing-mocklab`. Use Node 24.x and the pinned pnpm; follow the [README installation steps](../README.md#quick-start).
2. Run `corepack pnpm init:client` (or `corepack pnpm init:client --help`).
3. Enter the display name and review/edit the suggested lowercase package/repository slug. Leave the portfolio UUID blank when unused.
4. Review the exact plan, source commit, proposed external backup path and eventual directory name. Type `PLAN <slug>` exactly to acknowledge the plan. This is **not** consent to edit, replace history or publish.
5. Continue [client discovery](project-kickoff.md). Automated application is pending T2; do not interpret a confirmed plan as a configured client website.

For a public, noninteractive invocation:

```sh
node scripts/init-client.mjs --name 'Clínica Norte' --slug clinica-norte --confirm-plan clinica-norte
```

Omitting `--confirm-plan` prompts for the exact confirmation phrase. EOF, refusal, invalid input or failed preflight exits with status 1. A confirmed plan or `--help` exits with status 0. Unknown/duplicate options and `--apply` are rejected. No `--yes` bypass exists.

## What the plan covers

| Input/check | Behavior |
| --- | --- |
| Display name | 1–100 characters; no control characters or surrounding spaces. Distinct from the slug. |
| Slug | 1–63 lowercase ASCII letters/digits with single internal hyphens; must differ from the starter name. |
| Git origin | Exact base repository over HTTPS, SCP-style SSH or `ssh://git@github.com/`; optional `.git` suffix. No credential-bearing origin is printed. |
| Local clone | Root invocation, normal `.git` directory, full self-contained history, clean tracked/untracked state, tracked regular identity targets. Links, shared object alternates and shallow clones are rejected. |
| Proposed identity | Only `package.json` name, shared `src/config/site.ts` name and confirmed identity in `docs/project-brief.md`. No global replacement or invented copy/domain/design. |
| Destinations | Refuse an existing sibling client directory or proposed backup path. No new project directory is generated. |
| Recovery | Show a proposed sibling `.<slug>-client-init-backup` path and original source commit. **No backup is created, validated or promised recoverable by T1.** |

This is an initial preflight, not an apply-time safety certificate. It does not validate GitHub permissions, Git author identity, write permissions, complete object integrity or every possible filesystem/configuration race. No network access or GitHub lookup occurs. T2 must recheck the state before any mutation; a plan is not a durable progress/resume record.

## Optional portfolio

With interactive input, a blank UUID disables portfolio configuration. With complete `--name` and `--slug` flags, omitting `--uid` also disables it. To propose portfolio configuration noninteractively, supply both `--uid` and `--projects-url`.

- UUIDs must use the standard versioned UUID form.
- URLs must use HTTPS and a DNS hostname, without user credentials, queries, fragments or custom ports. Literal IPs and local hostnames are rejected. This syntactic check does not resolve DNS or prove service availability/public ownership.
- The interactive prompt explicitly offers `https://mygqfdbloqojffhsurgo.supabase.co/functions/v1/public-projects`. Accept it only when appropriate; no live probe is performed.
- The plan names `MOCKLAB_PROJECTS_URL` and `MOCKLAB_USER_ID` for a future ignored local `.env`. An existing `.env` stops a portfolio plan; its contents are never read. No key/JWT is requested. The human-owned blank environment template is never opened or modified.

The plan prints the supplied public owner/URL, so do not enter private data or credentials. Future Vercel setup is manual; configure the same two variables there if portfolio is enabled. See the [projects guide](projects.md).

## Remaining application and recovery work

T2 must preserve a verified, retained copy of original Git metadata **and every touched file outside the client repository before edits**, then apply local identity, validate it, and only then replace inherited history with separate explicit approval. New GitHub repositories must be private under `mocklabapp`, with independent publication consent and safe collision/uncertain-operation handling. Directory rename comes last.

T1 cannot resume an interrupted initializer: it has not performed one. If preflight rejects an existing backup/destination, inspect it rather than deleting, overwriting or adopting it. No automatic rollback/deletion, force push, Vercel deployment, design approval or launch approval is provided.

## Verification

```sh
node --test tests/client-init*.test.mjs
corepack pnpm run check:client-init
corepack pnpm run validate
```

CLI tests run the public entry point only against disposable repositories with fake Git identity and no network. The full suite includes an actual renamed bilingual fixture build, preserving Spanish/English content, metadata and language navigation checks. Run the dedicated strict JavaScript/JSDoc check alongside `validate`; the existing validation command remains unchanged. No browser verification is required for this CLI-only slice.
