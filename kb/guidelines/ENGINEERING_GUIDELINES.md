# Engineering Guidelines

> Language-agnostic standards for all projects. Written to be followed by both humans and AI coding assistants.
> When an AI assistant works in a repo containing (or referencing) this file, it MUST follow these rules unless the user explicitly overrides them.

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Architecture & Design](#2-architecture--design)
3. [Project Structure](#3-project-structure)
4. [Naming Conventions](#4-naming-conventions)
5. [Functions & Code Structure](#5-functions--code-structure)
6. [Error Handling](#6-error-handling)
7. [Testing](#7-testing)
8. [Git Workflow](#8-git-workflow)
9. [Code Review](#9-code-review)
10. [Security](#10-security)
11. [API Design](#11-api-design)
12. [Data & Persistence](#12-data--persistence)
13. [Configuration & Secrets](#13-configuration--secrets)
14. [Logging & Observability](#14-logging--observability)
15. [Performance](#15-performance)
16. [Dependencies](#16-dependencies)
17. [Documentation](#17-documentation)
18. [CI/CD & Releases](#18-cicd--releases)
19. [Concurrency & Async](#19-concurrency--async)
20. [Privacy & Compliance](#20-privacy--compliance)
21. [Accessibility & Internationalization](#21-accessibility--internationalization)
22. [Incident Response & Postmortems](#22-incident-response--postmortems)
23. [Technical Debt & Refactoring](#23-technical-debt--refactoring)
24. [Definition of Done](#24-definition-of-done)
25. [Guidelines for AI Assistants](#25-guidelines-for-ai-assistants)

---

## 1. Core Principles

- **KISS (Keep It Simple).** Prefer the simplest design that solves the problem. Complexity must be justified by a real, current requirement — not a hypothetical future one.
- **YAGNI (You Aren't Gonna Need It).** Do not build features, abstractions, or configuration options "just in case." Add them when they are actually needed.
- **DRY — but not prematurely.** Duplicate code twice before abstracting. A wrong abstraction is more expensive than duplication. Extract shared code only when the duplication is real and stable (rule of three).
- **Single Responsibility.** Every module, class, and function should have one reason to change.
- **Explicit over implicit.** Prefer clear, boring code over clever code. Code is read 10x more than it is written.
- **Fail fast.** Detect and report errors at the earliest possible point. Do not silently swallow failures or continue in a corrupted state.
- **Make it work, make it right, make it fast — in that order.** Never optimize before correctness is proven and a measurement shows the bottleneck.
- **Leave the codebase better than you found it** (Boy Scout Rule) — but keep unrelated cleanup out of feature commits.
- **Reversibility matters.** Prefer decisions that are easy to change later. Irreversible decisions (schema design, public API contracts, technology choices) deserve extra scrutiny and documentation.

---

## 2. Architecture & Design

### Layering

- Separate concerns into layers with **one-directional dependencies**:
  - `presentation / API` → `business logic / domain` → `data access / infrastructure`
- The domain layer must not import from the presentation or infrastructure layers. Use interfaces/ports if the domain needs to trigger infrastructure work (dependency inversion).
- Keep business logic out of controllers, route handlers, UI components, and database models. Handlers should be thin: parse input → call service → format output.

### Boundaries & Coupling

- **High cohesion, low coupling.** Things that change together live together; things that change independently are separated.
- Communicate between modules through well-defined interfaces, not by reaching into internals.
- Avoid circular dependencies. If two modules import each other, extract the shared part into a third module.
- Prefer **composition over inheritance**. Use inheritance only for genuine "is-a" relationships with shared behavior; prefer interfaces + composition otherwise.

### Design Decisions

- Record significant architecture decisions as short **ADRs** (Architecture Decision Records) in `docs/adr/`: context, options considered, decision, consequences. One file per decision, numbered (`0001-use-postgres.md`).
- A decision is "significant" if it is expensive to reverse or affects multiple teams/modules.
- When choosing between technologies, evaluate: fit for the problem, operational burden, team familiarity, ecosystem maturity, and exit cost — in that order. Novelty is not a criterion.

### State & Side Effects

- Keep functions **pure** where practical; isolate side effects (I/O, network, time, randomness) at the edges of the system.
- Minimize shared mutable state. Prefer passing data explicitly over global state.
- Make time, randomness, and environment injectable/mockable — never call them directly deep inside business logic.

### When to Abstract

- Do **not** create an interface/abstraction with only one implementation unless it isolates a genuinely unstable dependency (e.g., a third-party API).
- Do **not** add a design pattern because it exists. Patterns are vocabulary for solutions you already need, not goals.

---

## 3. Project Structure

- Every repo must have at its root:
  - `README.md` — what it is, how to run it, how to test it (see [§17](#17-documentation))
  - `.gitignore` — appropriate for the stack
  - A dependency manifest with **locked versions** (lockfile committed)
- Standard directories (adapt names to language conventions):
  ```
  src/          # production code
  tests/        # test code, mirroring src/ structure
  docs/         # documentation, ADRs
  scripts/      # dev/ops helper scripts
  config/       # configuration templates (never real secrets)
  ```
- Group code **by feature/domain first**, by technical type second. `orders/service`, `orders/repository` beats `services/order`, `repositories/order` once a project has more than a handful of features.
- One concept per file. Avoid 1000+ line files; split when a file accumulates unrelated responsibilities.
- Test files mirror the structure and names of the code they test (`src/orders/service.*` → `tests/orders/service_test.*`).

---

## 4. Naming Conventions

- **Names reveal intent.** A reader should understand what a thing is/does without opening it. `daysUntilExpiry` beats `days`, `d`, or `data2`.
- Follow the **idiomatic casing of the language** (snake_case in Python, camelCase in JS/TS, PascalCase for types/classes in most languages). Never mix styles within one codebase.
- Rules:
  - Functions/methods: **verb phrases** — `calculateTotal`, `sendInvoice`, `parseHeader`
  - Booleans: **predicate form** — `isActive`, `hasPermission`, `canRetry` (never `flag`, `status2`)
  - Classes/types: **nouns** — `InvoiceGenerator`, `RetryPolicy`
  - Constants: `UPPER_SNAKE_CASE`
  - Collections: **plural** — `users`, `pendingJobs`
- Avoid:
  - Abbreviations except universally known ones (`id`, `url`, `max`)
  - Meaningless names: `data`, `info`, `manager`, `helper`, `util`, `temp`, `stuff`
  - Encoding types into names (`strName`, `arrUsers`) — the type system does that
  - Negated booleans (`isNotReady`) — invert the name instead
- Rename when the meaning changes. A misleading name is a bug waiting to happen.

---

## 5. Functions & Code Structure

- **Small functions, one job.** If you need "and" to describe what a function does, split it. Soft limit ~40 lines; hard-think past that.
- **Max 3–4 parameters.** More than that → group into a parameter object/struct.
- **No boolean flag parameters** that switch behavior (`render(data, true)`). Split into two functions or use an enum with named values.
- **Return early.** Use guard clauses instead of deep nesting. Max nesting depth ~3; refactor beyond that.
- **No magic values.** Named constants for any literal whose meaning isn't obvious in context (`MAX_RETRIES = 3`, not a bare `3`).
- **Immutability by default.** Use `const`/`final`/immutable structures unless mutation is required and local.
- **Command–query separation.** A function either changes state or returns information; avoid doing both (except idiomatic cases like `pop()`).
- **Comments explain WHY, not WHAT.** Good code makes the *what* obvious. Comment constraints, trade-offs, workarounds, and links to specs/tickets. Delete commented-out code — git remembers it.
- No `TODO` without an owner or ticket reference. `// TODO(#123): remove after migration` — yes. `// TODO: fix later` — no.
- Delete dead code immediately. Unused functions, unreachable branches, and unused parameters are noise and a maintenance tax.

---

## 6. Error Handling

- **Never swallow errors silently.** An empty catch block is forbidden. Minimum: log with context. Ideal: handle or propagate.
- **Catch specific error types**, not blanket catch-alls, except at top-level boundaries (request handler, main loop, worker entrypoint) where a catch-all prevents crashes and must log the full error.
- **Errors carry context.** Include what operation failed, with what inputs (sanitized), and what the caller can do. `"Failed to load invoice 4711: storage timeout after 30s"` beats `"error occurred"`.
- **Exceptions are for exceptional cases.** Expected outcomes (validation failure, not-found) should be modeled in return types where the language supports it (Result/Option/error returns), or as domain-specific errors — not generic runtime exceptions.
- **Validate at boundaries.** All external input (HTTP requests, file contents, CLI args, message queue payloads, third-party API responses) is untrusted and must be validated on entry. Internal code may then trust validated data — don't re-validate at every layer.
- **Clean up reliably.** Use the language's resource-safety construct (try/finally, `with`, `defer`, RAII, `using`) for files, connections, locks.
- **Design for partial failure** in distributed calls: timeouts on every network call, bounded retries with backoff + jitter for transient errors only, idempotency for anything that may be retried.
- User-facing error messages must be helpful and safe: say what went wrong and what to do next; never leak stack traces, internal paths, or SQL to end users.

---

## 7. Testing

### What to Test

- **Test behavior, not implementation.** Tests assert on observable outcomes (return values, state changes, emitted events), not on internal call sequences. Refactoring without behavior change must not break tests.
- Follow the **test pyramid**: many fast unit tests, fewer integration tests, few end-to-end tests.
- Every bug fix gets a **regression test** that fails without the fix. No exception.
- Cover the edges: empty inputs, null/missing values, boundaries (0, 1, max, max+1), unicode, concurrent access where relevant — not just the happy path.

### How to Write Tests

- Structure: **Arrange – Act – Assert** (or Given–When–Then). One logical assertion focus per test.
- Test names describe the scenario and expected outcome: `rejects_expired_token`, `returns_empty_list_when_no_orders`. Not `test1`, `testService`.
- Tests must be:
  - **Deterministic** — no reliance on real time, network, ordering, or shared state. Flaky tests get fixed or deleted, never ignored.
  - **Independent** — runnable alone and in any order.
  - **Fast** — the unit suite should run in seconds so people actually run it.
- Mock only at boundaries you own the interface for (network, filesystem, clock, third-party services). Over-mocking couples tests to implementation.
- Use test data builders/factories for complex objects instead of repeating setup blobs.

### Discipline

- New code ships with tests in the **same commit/PR**. "I'll add tests later" means never.
- Coverage is a signal, not a goal. Don't chase a percentage; do look at uncovered critical paths.
- Never delete or weaken a failing test to make CI green. Fix the code or, if the test is genuinely wrong, fix the test with an explanation in the commit.

---

## 8. Git Workflow

### Commits

- **Small, atomic commits.** One logical change per commit. It should be possible to revert any commit without collateral damage.
- Use **Conventional Commits** format:
  ```
  <type>(<optional scope>): <imperative subject, ≤50 chars>

  <body: WHY the change was made, if not obvious>
  ```
  Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`.
- Subject in imperative mood: "add retry to uploader", not "added" or "adds".
- Never mix refactoring and behavior changes in one commit. Refactor first (separate commit), then change behavior.
- Never commit: secrets, generated artifacts, dependencies, editor junk, commented-out experiments, `console.log`/debug prints.

### Branches

- Trunk-based or short-lived feature branches: branch from `main`, merge back within days, not weeks.
- Branch names: `feat/order-export`, `fix/login-timeout`, `chore/upgrade-ci`.
- Keep `main` always releasable. Broken main is everyone's top priority.
- Rebase local work to keep history clean; **never rewrite history that has been pushed and shared**.

### Pull Requests

- Small PRs (< ~400 changed lines) get reviewed faster and better. Split big work into stacked or sequential PRs.
- PR description states: what changed, why, how it was tested, and anything the reviewer should focus on. Screenshots for UI changes.
- CI must be green before merge. No self-merging around a red build.

---

## 9. Code Review

### For Authors

- Review your own diff before requesting review. You'll catch half the issues yourself.
- Respond to every comment — with a change, or with a reason. Don't silently ignore.
- Don't take feedback personally; the code is being reviewed, not you.

### For Reviewers

- Prioritize, in order: **correctness → security → design → readability → style**. Don't blockade a PR over style when a linter should enforce it.
- Every blocking comment must be actionable: state the problem, the failure scenario, and a suggested fix.
- Distinguish severity explicitly: `blocking:` vs `nit:` vs `question:`.
- Approve when the code is better than what's there and has no defects — not when it's exactly how you would have written it.
- Review latency matters: respond within one business day or hand off.

### What Reviews Must Catch

- Logic errors, unhandled edge cases, race conditions
- Missing input validation, injection risks, auth gaps
- Missing tests for new behavior
- Breaking changes to public APIs or schemas without migration
- Performance traps: N+1 queries, unbounded loops, loading unbounded data into memory

---

## 10. Security

- **Never commit secrets** (API keys, passwords, tokens, private keys) — not in code, config, tests, docs, or commit history. Use environment variables or a secrets manager. If a secret leaks into git history, rotate it immediately; deleting the commit is not enough.
- **All input is hostile until validated** — HTTP params, headers, cookies, file uploads, filenames, CLI args, webhook payloads, data from your own database if another system writes to it.
- **Injection defense:** parameterized queries always (never string-concatenated SQL); context-aware output encoding for HTML/JS (XSS); never pass user input to shell commands, `eval`, or deserializers of arbitrary types.
- **AuthN vs AuthZ:** authenticate identity, then authorize every action against that identity server-side. Never trust client-side checks, hidden fields, or "the UI doesn't show that button."
- **Least privilege everywhere:** DB accounts, service tokens, file permissions, CI credentials — grant the minimum needed.
- **Passwords:** only store slow adaptive hashes (bcrypt/scrypt/argon2) with per-user salt. Never roll your own crypto or session management — use vetted libraries.
- **Transport:** TLS for everything in transit. No plaintext credentials on the wire, ever.
- **Dependencies are attack surface:** enable automated vulnerability scanning (Dependabot/`npm audit`/`pip-audit` equivalents); patch critical CVEs promptly.
- **Don't log sensitive data:** no passwords, tokens, full card numbers, or personal data in logs.
- **Fail closed.** When an auth or validation check errors out, deny — don't allow.
- Rate-limit authentication endpoints and anything expensive or abusable.

---

## 11. API Design

- **Contract first.** Design and document the interface (OpenAPI/schema/type signatures) before implementing. The API is a promise; breaking it breaks consumers.
- REST conventions where applicable:
  - Nouns for resources (`/orders/{id}`), verbs via HTTP methods
  - Correct status codes: `200/201/204` success, `400` bad input, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict, `422` validation, `429` rate limited, `5xx` server fault
  - `GET` is safe and cacheable; `PUT`/`DELETE` idempotent; unsafe retried operations need idempotency keys
- **Consistent error body** across the whole API: machine-readable code, human-readable message, optional details/field errors, correlation id.
- **Version from day one** (`/v1/` or header-based). Breaking changes require a new version and a deprecation window — never break existing consumers silently. Additive changes (new optional fields) are non-breaking; removing/renaming/retyping fields is breaking.
- **Paginate every collection endpoint** from the start. Retrofitting pagination is a breaking change.
- Be **strict in what you produce, careful in what you accept**: validate requests hard, and never return more data than the consumer needs (no leaking internal fields, no `SELECT *` straight to JSON).
- Document for every endpoint: purpose, auth requirements, request/response examples, error cases, rate limits.

---

## 12. Data & Persistence

- **Schema changes only via versioned migrations** — never manual edits to a live database. Every migration is committed, ordered, and runs in CI/staging before production.
- Migrations must be **backward compatible with the running code** during deploy (expand → migrate → contract pattern): add new column, dual-write, backfill, switch reads, then drop old column in a later release.
- Constraints belong in the database: NOT NULL, foreign keys, unique constraints. The application also validates, but the DB is the last line of defense.
- **Transactions around multi-step invariants.** If two writes must both happen, wrap them; decide explicitly what happens on partial failure.
- Avoid N+1 access patterns; fetch what you need in bounded, indexed queries. Any query on a large table needs a matching index — verify with the query planner, not intuition.
- Soft-delete vs hard-delete is a per-domain decision — document it. Personal data must be actually deletable (compliance).
- **Backups are only real if restore is tested.** Schedule restore drills.
- Don't use the database as a queue, a cache, and a search engine by default — but also don't add Kafka/Redis/Elasticsearch until the database measurably can't do the job (see YAGNI).

---

## 13. Configuration & Secrets

- **Config comes from the environment**, not from code. Same artifact runs in every environment; only config differs (12-factor).
- Provide a committed **template** (`.env.example`, `config.example.yaml`) listing every variable with a comment and a safe default where possible. Real values never enter git.
- Validate configuration **at startup** and fail fast with a clear message naming the missing/invalid variable — not at first use, hours later.
- Defaults should be **safe for production** (debug off, verbose logging off, real TLS verification on). Development convenience is opted into, never the default.
- Feature flags: fine for gradual rollout; every flag gets an owner and a removal date. Dead flags are dead code.

---

## 14. Logging & Observability

- **Structured logging** (key-value/JSON), not free-text string concatenation. Machines aggregate logs; make them parseable.
- Use levels correctly:
  - `ERROR` — something failed and needs attention; should be actionable
  - `WARN` — unexpected but handled; watch for trends
  - `INFO` — significant business/lifecycle events (started, request served, job completed)
  - `DEBUG` — developer detail, off in production by default
- Every log line should answer: what happened, to which entity (ids), in which request (**correlation/trace id** propagated across services).
- Log at boundaries and decisions, not every line. Noise buries signal.
- Never log secrets or personal data ([§10](#10-security)).
- Beyond logs: expose **health checks**, and track the basic service metrics — request rate, error rate, latency percentiles (p50/p95/p99), and resource saturation. Alert on symptoms users feel (error rate, latency), not on every internal blip.
- An unhandled exception at the top level must always be logged with a full stack trace before the process dies or the request 500s.

---

## 15. Performance

- **Measure first.** No optimization without a profile/benchmark showing the bottleneck. Intuition about performance is usually wrong.
- Define what "fast enough" means (latency budget, throughput target) before optimizing; stop when you hit it.
- Big-O beats micro-optimization: fixing an O(n²) loop or an N+1 query outweighs a thousand micro-tweaks.

### Algorithmic Complexity

- **Know the input scale before choosing an algorithm.** Ask "how big can n get?" — O(n²) is fine for n=100 and fatal for n=1,000,000. If the answer is "unbounded," design for growth or bound the input explicitly.
- **Pick data structures by access pattern:** membership tests and lookups → hash set/map (O(1)), not a list scan (O(n)); sorted order + range queries → tree/sorted structure; FIFO → queue, not array-shift.
- **Watch for hidden quadratic behavior** — it rarely looks like two nested `for` loops: `contains`/`indexOf` inside a loop, repeated string concatenation in a loop, `remove` from the middle of an array in a loop, per-item queries over a result set (N+1). Each is O(n²) in disguise.
- **State the complexity of non-trivial code.** A function processing collections in a hot path gets a comment or doc note with its time and space complexity — reviewers check it against the expected input size.
- **Space complexity counts too:** don't materialize an entire dataset in memory to process it item by item — stream, paginate, or chunk. Watch for accidental copies (slicing, `toList()` on a lazy sequence, building intermediate collections in a pipeline).
- Prefer the standard library's algorithms and collections — they're already optimal and battle-tested. Hand-rolled sorting/searching needs a justification.
- The usual suspects, in order of likelihood: unnecessary I/O in loops, missing DB indexes, chatty network calls that could be batched, loading unbounded datasets into memory, missing caching for hot read-heavy data.
- **Caching is a last resort, not a first move.** Every cache adds an invalidation problem. When you cache: define TTL/invalidation explicitly, and make the system correct (if slower) when the cache is cold or wrong.
- Set explicit limits everywhere: request timeouts, max payload sizes, pagination limits, connection pool sizes, queue depths. Unbounded anything eventually takes the system down.
- Don't sacrifice readability for unmeasured performance gains. Clever bit-twiddling with no benchmark is a net loss.

---

## 16. Dependencies

- **Every dependency is a liability**: attack surface, upgrade burden, and a bet on someone else's maintenance. Before adding one, ask: can the standard library do this? Is it ~50 lines we could own ourselves?
- Evaluate before adopting: maintenance activity, download/user base, open critical issues, license compatibility, transitive dependency weight.
- **Pin versions with a lockfile**, committed. Builds must be reproducible.
- Update regularly in small steps (scheduled dependency updates) rather than heroic once-a-year upgrades. Security patches take priority.
- Wrap third-party services and exotic libraries behind your own thin interface at the boundary — so replacement is a local change, not a rewrite. (Don't wrap stable, idiomatic stdlib-like things; that's noise.)
- Remove unused dependencies immediately.
- Check the license before adopting anything (beware copyleft in proprietary code).

---

## 17. Documentation

- **README answers, in order:** what this project is (one paragraph), how to install/run it, how to run the tests, how to configure it, where to learn more. A newcomer should reach "running locally" from the README alone.
- Document **why, not what** — the code shows what. Docs capture intent, constraints, trade-offs, and the things you can't see in the code (deployment topology, external contracts, domain rules).
- **Docs live next to code** in the repo and change in the same PR as the code they describe. Out-of-repo docs rot.
- Keep an `docs/adr/` directory for architecture decisions ([§2](#2-architecture--design)).
- Public functions/modules get doc comments covering: purpose, parameters, return value, errors thrown, and non-obvious behavior. Skip doc comments that just restate the name.
- Runbooks for anything operational: how to deploy, how to roll back, what to do when the pager goes off. Written before the incident, not during.
- Wrong documentation is worse than no documentation — when you touch code with stale docs, fix the docs or delete them.

---

## 18. CI/CD & Releases

- Every push runs CI: **lint → build → test**. All three gate the merge.
- Linting/formatting is enforced by tooling, never by human comments. Adopt the standard formatter for the language and stop arguing about style.
- The build must be **reproducible**: same commit → same artifact. Build once, promote the same artifact through staging → production.
- Deploys are **automated, boring, and rolled back easily**. If deploying is scary, fix the pipeline, not the schedule.
- Ship in **small increments**. Big-bang releases fail big. Feature flags let unfinished work merge safely.
- Define rollback criteria **before** deploying: what metric regression triggers a rollback and who decides. Rollback first, debug later.
- Version releases (SemVer for libraries: MAJOR breaking / MINOR feature / PATCH fix) and keep a changelog.
- Never deploy something that skipped the pipeline. No SSH-and-edit in production.

---

## 19. Concurrency & Async

- **Prefer no shared mutable state.** Message passing, immutable data, or single-writer designs beat locks. Reach for locks only when the simpler models don't fit.
- When locking: keep critical sections tiny, acquire locks in a **consistent global order** (prevents deadlock), and never hold a lock across I/O or a network call.
- **Every blocking operation gets a timeout.** A thread/coroutine waiting forever is a leak and a future outage.
- Guard against race conditions on check-then-act patterns (`if not exists → create`): use atomic operations, upserts, unique constraints, or compare-and-swap — not application-level checks alone.
- **Workers and message consumers must be idempotent.** Queues deliver at-least-once; design handlers so processing the same message twice is harmless (dedupe keys, upserts, idempotency tokens).
- Bound all concurrency: thread pools, connection pools, semaphores, queue depths. Unbounded parallelism is a self-inflicted DDoS.
- In async code: never block the event loop with CPU work or sync I/O; propagate cancellation properly; don't fire-and-forget tasks without error handling — an unobserved failed task is a swallowed error ([§6](#6-error-handling)).
- Test concurrent code for the races you can name (stress tests, injected delays) and document invariants you can't test.

---

## 20. Privacy & Compliance

- **Classify data at design time:** public / internal / confidential / personal (PII). Handling rules follow classification, and the strictest data in a store sets the store's level.
- **Data minimization:** collect only what the feature needs, keep it only as long as needed. Define a retention period for every personal-data store; enforce it with automated deletion, not intentions.
- Personal data must be **actually deletable and exportable** per user (GDPR/CCPA rights). Design for this up front — bolting deletion onto a system with PII scattered across logs, backups, and analytics is a rewrite.
- PII never goes into: logs, error messages, analytics events, URLs/query strings, test fixtures, or non-production environments. Use anonymized or synthetic data for dev/staging.
- Encrypt personal and confidential data **at rest and in transit**. Key management via a real KMS, not a config file.
- Third parties that receive user data (analytics, support tools, LLM APIs, subprocessors) are part of your compliance surface — inventory them and check contracts/DPAs before sending data.
- Record **consent and purpose**: know why you hold each piece of personal data and under what legal basis. If nobody can answer, delete it.
- Breach readiness: know who to notify, and within what deadline (e.g., 72h under GDPR), before it happens.

---

## 21. Accessibility & Internationalization

### Accessibility (a11y) — for anything with a UI

- Target **WCAG 2.1 AA** as the baseline.
- Semantic structure first: real headings, labels tied to inputs, buttons that are buttons, links that are links. ARIA is a repair tool, not a substitute for semantics.
- **Everything works with a keyboard alone:** logical tab order, visible focus indicator, no keyboard traps, skip-links for long navigation.
- Color: minimum 4.5:1 contrast for text; never encode meaning in color alone (add icons/text).
- Images get alt text (or explicit empty alt for decorative); videos get captions; form errors are announced to screen readers, not just turned red.
- Respect user settings: reduced motion, font scaling, dark mode where supported.
- Test with automated tooling (axe or equivalent) in CI **plus** a periodic manual keyboard/screen-reader pass — automation catches ~30-40% of issues at best.

### Internationalization (i18n)

- **No hardcoded user-facing strings.** All text through the translation layer from day one — retrofitting i18n is brutal.
- Never build sentences by string concatenation; use templates with named placeholders (word order differs across languages). Use proper pluralization rules (ICU MessageFormat or equivalent), not `count > 1 ? "s" : ""`.
- Store timestamps in **UTC**, render in the user's timezone/locale. Format dates, numbers, and currency with locale-aware APIs, never by hand.
- **UTF-8 everywhere.** Test with non-ASCII input (names, addresses, emoji) as a matter of course.
- Layouts must tolerate text expansion (German ~30% longer than English) and, if targeted, right-to-left scripts.

---

## 22. Incident Response & Postmortems

- Define **severity levels** ahead of time (e.g., SEV1 = user-facing outage, SEV2 = degraded, SEV3 = internal impact) with response expectations per level. During an incident nobody should debate what counts as urgent.
- During an incident, priority order: **stop the bleeding → communicate → then root-cause.** Mitigation (rollback, failover, feature-flag off) beats diagnosis; debug after users are safe. This is why rollback criteria exist before deploys ([§18](#18-cicd--releases)).
- One person is **incident commander** — coordinates and communicates; others debug. Post status updates at a predictable cadence, even if the update is "still investigating."
- Keep a timestamped log of actions taken during the incident — it's the raw material for the postmortem and prevents repeated dead ends.
- **Every significant incident gets a blameless postmortem** within a few days: timeline, impact, root cause(s), what went well, what went badly, and concrete action items with owners and deadlines.
- Blameless means the question is "what allowed this mistake to reach production?", never "who did it?" Systems and processes fail; naming and shaming guarantees the next incident is hidden longer.
- Action items are real work: tracked in the backlog, prioritized, and checked for completion. A postmortem whose actions never ship is theater.
- Define **SLOs** (e.g., 99.9% availability, p95 latency target) for user-facing services and alert on SLO burn — this gives "is it bad enough to page someone?" an objective answer.

---

## 23. Technical Debt & Refactoring

- Tech debt is a **deliberate trade, not an accident.** Taking a shortcut is legitimate when the reason is explicit — record it (ticket or `TODO(#ticket)`) with what the proper fix is. Undocumented debt is just decay.
- Maintain a visible **debt register** (labeled tickets suffice). Triage by interest rate: debt in code you touch weekly costs more than ugly code nobody opens.
- Budget continuous repayment — a sustained fraction of capacity (commonly ~10–20%) — rather than begging for a "refactoring sprint" that never comes.
- **Refactor in small, safe, behavior-preserving steps** with tests green after each step. Separate commits from behavior changes ([§8](#8-git-workflow)).
- Refactor opportunistically when you're in the code anyway ([Boy Scout Rule, §1](#1-core-principles)), but keep it out of the feature's diff — separate commit or PR.
- **Big-bang rewrites are almost always the wrong call.** Prefer strangler-fig migration: build the new path alongside the old, shift traffic incrementally, delete the old path last.
- A rewrite/major refactor needs the same justification as a feature: what does it cost, what does it save, what breaks meanwhile.
- Track the leading indicators: modules everyone fears to touch, files with chronic bug density, tests that are always flaky. That's where the debt actually is.

---

## 24. Definition of Done

A change is **done** when every line below is true — not when the code compiles:

- [ ] Does what the requirement/ticket asked — verified by running it, not by reading it
- [ ] Tests written and passing (new behavior covered; bug fixes have regression tests)
- [ ] Full CI green: lint, build, test suite
- [ ] Edge cases and error paths handled ([§6](#6-error-handling)); inputs validated at boundaries
- [ ] No secrets, debug prints, commented-out code, or dead code introduced
- [ ] Security-relevant changes reviewed against [§10](#10-security); personal data handled per [§20](#20-privacy--compliance)
- [ ] Public API/schema changes are backward compatible or properly versioned + migrated
- [ ] Docs updated in the same PR: README/config template/API docs/runbook — whatever the change touches
- [ ] Observability in place for new paths: sensible logs, metrics, alerts if user-facing
- [ ] Code reviewed and all blocking comments resolved
- [ ] Feature flag / rollout / rollback plan exists for risky changes
- [ ] No new TODO without an owner and ticket

"Done" never means "works on my machine," "will test later," or "docs to follow."

---

## 25. Guidelines for AI Assistants

Rules for AI coding tools (Claude Code, Copilot, etc.) working in a codebase governed by this document:

### Scope Discipline
- **Do exactly what was asked — no more.** No drive-by refactors, no unrequested features, no "while I was here" changes. Suggest them separately instead.
- Touch the minimum set of files needed. Don't reorganize, reformat, or rename beyond the task.
- If the task is ambiguous or has multiple materially different interpretations, ask before building.

### Code Generation
- **Match the existing codebase style** — naming, patterns, error-handling idioms, comment density, test structure. Consistency with the repo beats personal preference or even these guidelines' defaults.
- Reuse existing utilities/helpers in the repo before writing new ones. Search first.
- Never invent APIs, library functions, or config options. If unsure a function exists, verify it (read source, check docs) before using it.
- No placeholder/stub code presented as done. If something is incomplete, say so explicitly.
- Generated code follows every section of this document: validated inputs, handled errors, no secrets, no magic values, tests included.

### Verification
- **Run the code/tests before claiming it works.** "Should work" is not a status. If it can't be run, state that verification wasn't possible.
- Report failures honestly and completely — failing tests, skipped steps, and known limitations go in the summary, not swept under "done."
- After edits, confirm the project still builds/lints/tests.

### Safety
- Never delete or overwrite files not created in the current task without confirming.
- Never run destructive or irreversible commands (dropping data, force-pushing shared branches, mass deletion) without explicit approval.
- Never commit or push unless asked. Never include secrets in code, output, or commits.
- Flag security problems noticed along the way, even if out of scope — report, don't silently fix or ignore.

### Communication
- Lead with the outcome; keep explanations proportional to the change.
- State assumptions made. Distinguish facts (verified) from beliefs (unverified).
- When rejecting an approach the user suggested, explain why and offer the alternative.

---

## Quick Reference Card

| Area | The one rule to remember |
|---|---|
| Design | Simplest thing that works; abstractions must earn their existence |
| Naming | Names reveal intent; follow the language's idiom |
| Functions | Small, one job, guard clauses, no magic values |
| Errors | Never swallow; add context; validate at boundaries |
| Tests | Test behavior; every bug fix gets a regression test |
| Git | Atomic commits, Conventional Commits, small PRs, green main |
| Security | All input hostile; no secrets in git; least privilege |
| API | Contract first; version from day one; paginate everything |
| Data | Migrations only; expand→migrate→contract; test restores |
| Config | From environment; validate at startup; prod-safe defaults |
| Logs | Structured; correlation ids; correct levels; no secrets |
| Performance | Measure first; know your Big-O for the real input size; cache last |
| Dependencies | Every dependency is a liability; lock versions |
| Docs | Why, not what; docs change with the code |
| CI/CD | Lint+build+test gate merge; small boring deploys |
| Concurrency | No shared mutable state; timeouts everywhere; idempotent workers |
| Privacy | Minimize, classify, encrypt; PII never in logs or dev environments |
| A11y & i18n | WCAG AA; keyboard works; no hardcoded strings; UTC + UTF-8 |
| Incidents | Mitigate first, blameless postmortem after; action items with owners |
| Tech debt | Deliberate and tracked; strangler-fig over rewrite; ~10-20% repayment |
| Done | Verified running + tested + reviewed + documented — or not done |
| AI assistants | Minimum scope; match repo style; verify before claiming done |
