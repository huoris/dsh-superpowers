# DeepSeek Harness (DSH) tool mapping

Skills name actions, not tools. On the DeepSeek Harness (DSH), translate
actions like this:

| Action | DSH tool |
|---|---|
| invoke a skill | the `skill` tool, parameter `name` (catalog is listed at session start as `available_skills`) |
| read a file | `read` |
| create or replace a file | `write` |
| targeted edit of an existing file | `edit` |
| find files by path pattern | `glob` |
| search file contents | `grep` |
| run shell commands (TDD, verification, git) | `pwsh` (PowerShell); long runs: `run_in_background` + `job_output` / `job_kill` |
| dispatch a subagent / task | `subagent` (self-contained prompt) or `subagent_fork` (inherits the conversation); steer with `send_message`, list with `list_agents`, stop with `interrupt_agent` |
| create a todo / task list | `todo_write` |
| ask your human partner a question | `ask_user_question` |
| web search / fetch a page | `web_search` / `web_fetch` |
| read an image | `read_image` (detailed structured evidence: `modlens_read_image`) |
| browser automation | `dsh_browser_open`, `dsh_browser_snapshot`, `dsh_browser_click`, `dsh_browser_type`, ... |
| persistent goal across automatic continuation rounds | `create_goal` / `get_goal` / `update_goal` |
| delegate multi-agent fan-out at scale | `workflow` (only when the human asks for one) |

## Notes

- **No native skill tool in context?** If the `skill` tool is not available in
  your current context, reading the target skill's `SKILL.md` directly with
  `read` is the sanctioned mechanism on this harness — that honors the rule
  rather than breaking it. Each skill's resource hint shows its base directory.
- **Bundled scripts**: some skills invoke scripts shipped next to them (e.g.
  `scripts/foo.sh`). Invoke them through their interpreter — `bash
  scripts/foo.sh` — never as a bare `./scripts/foo.sh`; installers may strip
  executable bits. On Windows, Git Bash provides `bash`.
- **using-superpowers itself** is injected at session start as a system-prompt
  section by the `superpowers-dsh` bundle; do not load it via the `skill` tool.
