# dsh-superpowers

English | [中文](./README.zh.md)

[obra/superpowers](https://github.com/obra/superpowers) (v7.0.1) ported to the
DeepSeek Harness (DSH) as a profile bundle.

Installs the 15 Superpowers process skills and injects the
`using-superpowers` bootstrap at every session start — no per-session opt-in,
following the [Superpowers porting guide](https://github.com/obra/superpowers/blob/main/docs/porting-to-a-new-harness.md)
(Shape B: in-process plugin).

## What it does

- Registers every vendored `skills/<name>/SKILL.md` as a runtime skill on
  `ctx.skills`, so the harness catalog lists them and the native `skill` tool
  can load them. Each skill's resources resolve inside its own directory.
- Registers a system-prompt section (`superpowers:bootstrap`) containing the
  `using-superpowers` skill body wrapped in `<EXTREMELY_IMPORTANT>`, plus a
  DeepSeek Harness tool mapping (`skill`/`read`/`write`/`edit`/`glob`/`grep`/
  `pwsh`/`subagent`/`todo_write`/`ask_user_question`/`web_search`/`web_fetch`/
  `read_image`/`dsh_browser_*`). Sections re-assemble before every model step,
  so the bootstrap needs no dedup guard and survives compaction.
- Zero runtime dependencies.

## Feature parity

Everything in obra/superpowers that applies at runtime is replicated here:

| Upstream capability | In this bundle |
|---|---|
| 15 skills, 84 files (SKILL.md + references / scripts / prompts / templates) | Vendored verbatim — the `skills/` tree is file-for-file hash-identical to upstream v7.0.1, except the two changes the porting guide sanctions (see [Attribution](#attribution--scope-of-changes)) |
| Session-start bootstrap (`using-superpowers` wrapped in `<EXTREMELY_IMPORTANT>`) | A system-prompt section, re-assembled before every model step — no dedup guard needed and it survives compaction |
| Per-harness tool mapping (`references/<harness>-tools.md`) | `skills/using-superpowers/references/dsh-tools.md`, linked from the Platform Adaptation list and inlined in the bootstrap |
| Skill sub-resources (references, scripts, prompts, templates) | Each skill's resource base points at its own directory; files load with the `read` tool |
| Bundled scripts (`*.sh`, `*.cjs`, `*.js`) | Run through their interpreter (`bash`, `node`); on Windows, Git Bash provides `bash` (watch for the WSL launcher shadowing it on PATH) |
| Subagent workflows (dispatching-parallel-agents, subagent-driven-development) | DSH `subagent` / `subagent_fork` tools |
| Task tracking | `todo_write` |
| Web lookups (diagnosing-superpowers, brainstorming recon) | `web_search` / `web_fetch` / the built-in browser |
| Git worktrees (using-git-worktrees) | System `git` from any DSH shell |

Not shipped, matching what upstream's own per-harness distributions exclude: the other platforms' manifests and hooks (`.claude-plugin/`, `hooks/`, …), marketplace metadata, and dev tooling (`tests/`, `evals/`, release scripts). Those are install machinery for other harnesses; their DSH equivalents are this bundle's `index.js` and `cordis.patch.yml`.

Verified with the upstream acceptance test: in a fresh session, the prompt
"Let's make a react todo list" auto-invokes `brainstorming` before any code.

## Install

```sh
dsh plugin --profile <profile> add Huoris/dsh-superpowers
```

or search for **Superpowers** in a DSH plugin marketplace (e.g. dsh-market)
and install from there. Restart DSH (or let HMR activate the bundle); new
sessions then start with the bootstrap and the full skill catalog.

## Skills

brainstorming, diagnosing-superpowers, dispatching-parallel-agents,
executing-plans, finishing-a-development-branch, receiving-code-review,
requesting-code-review, subagent-driven-development, systematic-debugging,
test-driven-development, using-git-worktrees, using-superpowers,
verification-before-completion, writing-plans, writing-skills.

## Attribution & scope of changes

The `skills/` directory is vendored verbatim from
[obra/superpowers](https://github.com/obra/superpowers) (MIT, © Jesse Vincent)
— skill bodies are not modified, per the upstream contributor rules. The only
additions are a one-line DeepSeek Harness entry in
`skills/using-superpowers/SKILL.md`'s Platform Adaptation pointer list and the
new `skills/using-superpowers/references/dsh-tools.md` tool mapping, both
explicitly allowed by the [porting guide](https://github.com/obra/superpowers/blob/main/docs/porting-to-a-new-harness.md).
The DSH integration layer (`index.js`, `cordis.patch.yml`, locale files, icon)
is new code, MIT, © 2026 Huoris. See [LICENSE](./LICENSE).

## Uninstall

Remove the bundle via the DSH Plugin Manager or
`dsh plugin --profile <profile> remove dsh-superpowers`.
