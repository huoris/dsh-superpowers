# dsh-superpowers

[English](./README.md) | 中文

[obra/superpowers](https://github.com/obra/superpowers)（v7.0.1）的 DeepSeek
Harness（DSH）移植版，以 profile bundle 形式安装。

安装全部 15 个 Superpowers 过程技能，并在每次会话开始自动注入
`using-superpowers` 引导——无需每次会话手动开启。移植遵循
[Superpowers 移植指南](https://github.com/obra/superpowers/blob/main/docs/porting-to-a-new-harness.md)
（Shape B：进程内插件）。

## 功能

- 把每个 `skills/<name>/SKILL.md` 注册为 `ctx.skills` 上的 runtime
  技能：harness 的技能目录会列出它们，原生 `skill` 工具即可按需加载；每个技能
  引用的资源（references、scripts 等）在其自身目录内解析。
- 注册一个系统提示段（`superpowers:bootstrap`）：`using-superpowers`
  技能正文以 `<EXTREMELY_IMPORTANT>` 包裹，并附带 DeepSeek Harness 工具映射
  （`skill`/`read`/`write`/`edit`/`glob`/`grep`/`pwsh`/`subagent`/
  `todo_write`/`ask_user_question`/`web_search`/`web_fetch`/`read_image`/
  `dsh_browser_*`）。提示段在每次模型步骤前重新装配，因此引导天然不需要去重
  保护，也不会被上下文压缩丢失。
- 零运行时依赖。

## 功能对照

obra/superpowers 中所有在运行时生效的能力，本 bundle 均已复刻：

| 上游能力 | 本 bundle 中的实现 |
|---|---|
| 15 个技能、84 个文件（SKILL.md + references / scripts / prompts / templates） | 逐字 vendor——`skills/` 目录与上游 v7.0.1 逐文件哈希一致，仅含移植指南允许的两处改动（见[署名与改动范围](#署名与改动范围)） |
| 会话启动引导（`<EXTREMELY_IMPORTANT>` 包裹的 `using-superpowers`） | 注册为系统提示段，每次模型步骤前重新装配——无需去重保护，上下文压缩后不丢失 |
| 各平台工具映射（`references/<harness>-tools.md`） | `skills/using-superpowers/references/dsh-tools.md`，从 Platform Adaptation 列表链接，并内联在引导文本中 |
| 技能子资源（references、scripts、prompts、templates） | 每个技能的资源根目录指向自身目录，用 `read` 工具按需加载 |
| 技能内置脚本（`*.sh`、`*.cjs`、`*.js`） | 通过解释器执行（`bash`、`node`）；Windows 上由 Git Bash 提供 `bash`（注意 PATH 里的 `bash` 可能被 WSL 启动器抢占） |
| 子代理工作流（dispatching-parallel-agents、subagent-driven-development） | DSH 的 `subagent` / `subagent_fork` 工具 |
| 任务清单跟踪 | `todo_write` |
| 网络查询（diagnosing-superpowers、brainstorming 的 recon） | `web_search` / `web_fetch` / 内置浏览器 |
| Git worktree（using-git-worktrees） | 任意 DSH shell 中的系统 `git` |

刻意不打包的部分（与上游自身对各平台的分发范围一致）：其他平台的清单与 hooks
（`.claude-plugin/`、`hooks/` 等）、marketplace 元数据、开发测试工具
（`tests/`、`evals/`、发布脚本）。它们是其他 harness 的安装机构；DSH 的等价物
就是本 bundle 的 `index.js` 与 `cordis.patch.yml`。

已用上游验收测试验证：全新会话中发送 "Let's make a react todo list"，会在写任何
代码之前自动触发 `brainstorming`。

## 安装

```sh
dsh plugin --profile <profile> add Huoris/dsh-superpowers
```

或在 DSH 插件市场（如 [dsh-market](https://github.com/dsh-market/dsh-market)）
中搜索 **Superpowers** 直接安装。重启 DSH（或等 HMR 激活 bundle）后，新会话
即带引导与完整技能目录。

## 技能列表

以下标识符即调用 `skill` 工具时使用的 `name` 参数：

brainstorming、diagnosing-superpowers、dispatching-parallel-agents、
executing-plans、finishing-a-development-branch、receiving-code-review、
requesting-code-review、subagent-driven-development、systematic-debugging、
test-driven-development、using-git-worktrees、using-superpowers、
verification-before-completion、writing-plans、writing-skills。

## 署名与改动范围

`skills/` 目录逐字取自
[obra/superpowers](https://github.com/obra/superpowers)（MIT，© Jesse
Vincent）——遵循上游贡献者规则，未修改任何技能正文。唯一的新增是
`skills/using-superpowers/SKILL.md` 的 Platform Adaptation 指针列表中加入
一行 DeepSeek Harness，以及新文件
`skills/using-superpowers/references/dsh-tools.md` 工具映射——两者均为
[移植指南](https://github.com/obra/superpowers/blob/main/docs/porting-to-a-new-harness.md)
明确允许的改动。DSH 集成层（`index.js`、`cordis.patch.yml`、locale 文件、
图标）为新代码，MIT，© 2026 Huoris。见 [LICENSE](./LICENSE)。

## 卸载

通过 DSH 插件管理器移除该 bundle，或：

```sh
dsh plugin --profile <profile> remove dsh-superpowers
```
