# Guide a client kickoff

Use this protocol when adapting base-landing-mocklab for a real client, not when maintaining or exploring the starter. It guides an agent conversation; it is not a CLI wizard or runtime automation. Start from [AGENTS.md](../AGENTS.md) and persist decisions in [the project brief](project-brief.md).

## Quick path

1. Confirm client-kickoff intent if unclear. For base maintenance, work on the requested base change without demanding client answers.
2. Read the brief, supplied context and existing approved brand material. Extract known answers with their source and approval status; do not interview from scratch.
3. Ask a small block of 1–3 focused questions in the human's language, then **wait**. Start with the highest-impact unknown for the next slice.
4. After each answered block, update the brief's decisions, unresolved items and next question. Repeat only for relevant gaps or conflicts.
5. Present the [approval summary](#approval-gate), wait for required agreement, and implement only the approved slice.

## Conversation rules

- The discovery areas below are a reference, not a questionnaire to send in one message. Branch on answers and skip irrelevant areas. Never re-ask an answered decision unless a conflict or change affects it.
- Use open text for facts such as URLs, business goals and copy. If using a choice tool, obey its supported option limits; do not force facts into unsuitable choices. Plain conversation is sufficient.
- Reuse approved material; identify conflicts and ask only for resolution. Supplied facts need not be collected again, but unapproved suggestions remain proposed.
- Let the human request agent proposals. If material is missing, offer to propose options; record proposals as **proposed** until explicitly approved. Do not invent palette, typography or visual direction from fallback tokens.
- Accept **pending** and **not applicable**, recording why and what work they affect. Block only consequential dependent work, not unrelated safe work. A pending item never silently authorizes the affected work.
- Do not implement client UI/features until that slice's necessary scope and visual decisions are agreed. Safe discovery or starter maintenance may continue independently.
- Never ask for passwords, secret keys or personal data in the brief. Discuss field types and requirements, not real submissions or private customer records. If credentials are actually required later, use appropriate environment/secret tooling outside the brief; never paste secret values into chat or documentation.
- Avoid legal compliance promises. Identify who owns privacy, consent, licensing and other relevant legal review; do not treat a technical checklist as legal approval.

## Progressive discovery

Choose only the next relevant area. Each suggested block is at most three questions; do not send multiple blocks together. Adapt the wording to the human's language and omit already answered parts.

### 1. Identity and outcome

Establish the business/project identity, what the website is for, whom it serves, the primary conversion and how success will be assessed. Distinguish approved public identity from internal working names.

Possible first block when nothing is known:

1. What is the project or business, and what does it offer?
2. Who is the main audience, and what action should they take?
3. What observable outcome would make the first release successful?

Record concrete success criteria rather than assuming that traffic, sales or lead collection is the goal.

### 2. Scope and structure

Resolve the first release and what is explicitly excluded. Ask for the sitemap/pages and navigation priorities. Spanish is mandatory; all other languages are optional. English resources are ready but disabled by default. Ask which additional languages the client needs, which pages each covers, and who supplies/approves content, UI and metadata. English being disabled does not rule out French or another language.

A compact block might ask for required pages, the priority launch slice and additional languages. Follow with only relevant translation readiness/ownership questions. The base already implements unprefixed Spanish, prefixed optional languages, translated slugs and no fallback; do not reopen these as unanswered decisions. See [the multilingual guide](i18n.md). Absent optional translations stay unpublished; incomplete published translations fail the build. Keep deferred pages visible as out of scope; do not build them from a vague future wish. For RTL languages, direction metadata is available but client-specific design, fonts and browser review are still required.

### 3. Brand and visual direction

Ask for existing guidelines, approved palette, typography, visual references and available assets. Record links or safe repository paths, approval status, usage rights/licensing and any restrictions. Clarify what the human likes about references rather than copying another site's identity.

If a palette is already approved, reuse it and ask only for missing relevant items such as typeface rights or imagery. If no identity exists, ask whether the human wants proposals, then seek explicit approval before visual implementation.

The technology decision is fixed: Astro, strict TypeScript, Tailwind CSS 4, semantic tokens and native Astro components. Follow [the existing styling contract](../README.md#styling-contract) and [placement rules](../AGENTS.md#placement-rules); do not duplicate or replace them. Neutral starter tokens are technical fallbacks, not design decisions.

### 4. Content and approvals

Determine what copy and assets exist, who supplies missing content, who approves it and when it is available. Identify any content that blocks the next slice.

Use truthful approved copy. Never invent testimonials, clients, certifications, statistics, guarantees or unsupported claims. Mark draft copy as proposed; do not present placeholders as real endorsements. Track image/font/content licensing and review ownership where relevant.

### 5. Interactions and conditional integrations

First ask what visitors must be able to do. Keep a static site if that satisfies the need; do not introduce platforms, dependencies or code generators by default.

Only explore a branch when requested or required by an agreed interaction:

| Branch | Resolve progressively before dependent implementation |
| --- | --- |
| Forms | Fields and required/optional status; recipient role or approved destination and provider; success/error handling; data purpose, minimization, storage/retention and privacy/consent review owner. Do not store private recipient details or actual submissions in the brief. |
| CMS | What must be editable, by whom, publishing/approval flow and existing system constraints. |
| Booking | Booking rules, existing provider, availability and confirmation/cancellation behavior. |
| Payments | Products/pricing ownership, provider, purchase/failure/refund flow and responsible reviewer. |
| Authentication | Why access is restricted, roles, protected content and account/session behavior. |
| Analytics or other services | Concrete need, approved provider, data flows and privacy review ownership. |

Spread complex branch discovery across multiple 1–3 question blocks. Record unused branches as not applicable rather than provisioning them. Provider selection and data review must precede affected integration work; they do not authorize live data collection.

### 6. Discovery, quality and verification

Resolve SEO title/description ownership, the production domain, indexing intent and any launch restrictions. For an existing site, ask about old URLs, migration content and redirects; skip migration otherwise. Never assume a preview should be indexed. Follow the README's production `site` URL guidance when the domain is known.

Agree accessibility, responsive and performance expectations with observable acceptance checks. Clarify target devices/browsers, keyboard/focus and contrast checks, and any performance target and measurement conditions. Do not promise compliance or performance without verification.

Use Node 24.x, pinned pnpm 12.16.1 and the existing `pnpm run validate` command for implementation, plus affected-page browser checks for visual/interaction work per [AGENTS verification](../AGENTS.md#verification). Add project-specific acceptance checks to the brief; a successful build does not prove visual quality, accessibility or live integration behavior.

### 7. Delivery and responsibility

Resolve hosting/domain ownership and access responsibilities, delivery timing, final approver and post-launch maintenance owner. Ask for role or team references, not personal contact details or credentials. Do not assume a hosting platform or require a new account.

Keep separate decisions for scope/design approval, implementation readiness, deployment/publication authorization and personal-data collection authorization. Record the launch destination, permitted actions, restrictions and authorizing role before any release. A design sign-off is not permission to publish, charge customers or collect personal data.

## Keep the brief resumable

After every answered block, update [project-brief.md](project-brief.md):

- Record confirmed facts and explicitly approved decisions separately from proposals and pending items, with safe source references.
- Keep the next unresolved question/block short, naming the affected work and any safe work that can continue.
- Update slice acceptance criteria and the short decisions/changes record, including the human's approval when given.
- On resumption, read existing answers and ask only for the next relevant gap. When requirements change, reopen only affected decisions and checks; preserve unrelated approvals.

The blank template stays not started in the reusable base. In each client copy, the filled brief becomes the persistent source of truth; do not backfill the starter with invented client answers.

## Approval gate

Conclude discovery for the next implementation slice with this short summary:

1. **Confirmed scope:** purpose, audience, conversion, pages/locales and approved visual/content decisions for this slice.
2. **Proposed choices:** anything still needing explicit approval, clearly separated from confirmed decisions.
3. **Blockers and deferrals:** missing decisions, affected work and noncritical pending items that will remain excluded.
4. **Next implementation slice and checks:** exact deliverable, acceptance criteria and verification; separately state launch/data permissions, including anything not granted.

Ask for explicit human agreement wherever approval is still needed, then **wait**. Mark kickoff **ready for the named slice only** when its necessary scope, visual and other consequential decisions are approved. Otherwise keep it **in progress** with the next unresolved question. Noncritical pending items may remain visible but do not authorize their deferred work. Readiness is not deployment approval.

## Structural walkthroughs (not runtime interview tests)

### Sparse brief

The brief is blank and the human requests a client website. The agent asks the identity/outcome block in the human's language and waits. After the reply, it records supplied facts and moves to only the next relevant scope questions. It does not choose a palette or implement a homepage from defaults.

### Approved palette already supplied

The human supplies approved guidelines and a palette. The agent records their source and approval, skips palette selection and asks only for missing relevant decisions, such as typography licensing or page priorities. Suggested alternatives remain proposed, not replacements for approved choices.

### Resume versus base maintenance

For a client brief with approved pages but a pending form provider, the agent resumes at the form decision and blocks that integration, not unrelated approved work. A changed page list reopens only dependent decisions. If the request is instead to maintain this reusable starter, the agent makes that bounded base change without requiring client identity, brand or launch answers.
