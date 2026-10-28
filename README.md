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
