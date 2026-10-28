// superpowers-dsh — DeepSeek Harness port of obra/superpowers (Shape B analog).
//
// Zero runtime dependencies. Registers:
//   1. every vendored `skills/<name>/SKILL.md` as a runtime skill on ctx.skills
//      (model-invocable, resourceBase points at the skill directory so
//      references/scripts resolve), and
//   2. the `using-superpowers` session-start bootstrap as a system-prompt
//      section — <EXTREMELY_IMPORTANT>-wrapped, frontmatter stripped, with the
//      DeepSeek Harness tool mapping inlined (porting guide Part 5, Step 3/4).
//
// A system-prompt section is the harness-sanctioned injection point
// (practices: "Add prompt text with ctx.systemPrompt.section()"). It is
// re-assembled before every model step, so it needs no dedup guard, no
// compaction re-injection, and no per-session opt-in.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const name = "superpowers";

// Activate after the skill registry and system-prompt registry exist.
export const inject = ["skills", "systemPrompt"];

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BOOTSTRAP_SECTION = "superpowers:bootstrap";
// After MCP_SERVERS (3100), before TOOLS_SDK (5000).
const BOOTSTRAP_ORDER = 3150;
const PROVIDER = "superpowers";

/** @param ctx - Cordis plugin context (services injected via `inject`). */
export function apply(ctx) {
	const skillsRoot = fileURLToPath(new URL("./skills/", import.meta.url));

	let registered = 0;
	for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const dir = join(skillsRoot, entry.name);
		const mdPath = join(dir, "SKILL.md");
		let raw;
		try {
			raw = readFileSync(mdPath, "utf8");
		} catch {
			continue;
		}
		const parsed = parseSkillFile(raw);
		if (parsed === undefined || !SKILL_NAME.test(parsed.name)) {
			ctx.logger.warn(`superpowers: ignoring "${entry.name}" (missing or invalid SKILL.md frontmatter)`);
			continue;
		}
		ctx.skills.register({
			name: parsed.name,
			description: parsed.description,
			invocation: { modelInvocable: true, userInvocable: true },
			provider: PROVIDER,
			source: PROVIDER,
			path: mdPath,
			resourceBase: { kind: "directory", path: dir },
			content: parsed.body
		});
		registered += 1;
	}

	ctx.systemPrompt.section({
		name: BOOTSTRAP_SECTION,
		order: BOOTSTRAP_ORDER,
		text: buildBootstrap(skillsRoot),
		// Skill bodies may contain literal {{...}} text; never interpolate.
		interpolate: false
	});

	ctx.logger.info?.(`superpowers: registered ${registered} skills and the session-start bootstrap`);
}

/**
 * Parse one SKILL.md: YAML frontmatter with `name` / `description` scalar
 * fields, body after the closing `---` (trimmed). Returns undefined when the
 * frontmatter shape is not exactly this.
 */
function parseSkillFile(raw) {
	const text = raw.replace(/^\uFEFF/, "");
	const firstLineEnd = text.indexOf("\n");
	if (firstLineEnd < 0) return undefined;
	if (text.slice(0, firstLineEnd).replace(/\r$/, "") !== "---") return undefined;
	const start = firstLineEnd + 1;
	const closing = findClosingFrontmatter(text, start);
	if (closing === undefined) return undefined;
	const fields = {};
	for (const line of text.slice(start, closing.start).split("\n")) {
		const match = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line.replace(/\r$/, ""));
		if (match) fields[match[1]] = unquoteScalar(match[2]);
	}
	if (typeof fields.name !== "string" || fields.name.length === 0) return undefined;
	if (typeof fields.description !== "string" || fields.description.length === 0) return undefined;
	return { name: fields.name, description: fields.description, body: text.slice(closing.bodyStart).trim() };
}

function findClosingFrontmatter(raw, start) {
	let lineStart = start;
	while (lineStart <= raw.length) {
		const nextNewline = raw.indexOf("\n", lineStart);
		const lineEnd = nextNewline < 0 ? raw.length : nextNewline;
		if (raw.slice(lineStart, lineEnd).replace(/\r$/, "") === "---") {
			return { start: lineStart, bodyStart: nextNewline < 0 ? raw.length : nextNewline + 1 };
		}
		if (nextNewline < 0) return undefined;
		lineStart = nextNewline + 1;
	}
	return undefined;
}

function unquoteScalar(value) {
	const trimmed = value.trim();
	if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
		return trimmed.slice(1, -1).replaceAll('\\"', '"').replaceAll("\\\\", "\\").replaceAll("\\n", "\n");
	}
	if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
		return trimmed.slice(1, -1).replaceAll("''", "'");
	}
	return trimmed;
}

/** Assemble the bootstrap: preamble + using-superpowers body + DSH tool mapping. */
function buildBootstrap(skillsRoot) {
	let body = "";
	try {
		const parsed = parseSkillFile(readFileSync(join(skillsRoot, "using-superpowers", "SKILL.md"), "utf8"));
		if (parsed !== undefined) body = parsed.body;
	} catch {
		// Fall through with an empty body; the preamble and mapping still load.
	}
	if (body.length === 0) {
		// using-superpowers/SKILL.md is missing from the bundle; fail loud so
		// the broken install is diagnosed instead of silently half-working.
		throw new Error("superpowers: skills/using-superpowers/SKILL.md is missing from the installed bundle");
	}
	return [
		"<EXTREMELY_IMPORTANT>",
		"You have superpowers: a library of process skills is installed in this harness.",
		"The `using-superpowers` skill instructions below are ALREADY LOADED — do NOT load",
		"`using-superpowers` itself with the skill tool again. For every OTHER skill that",
		"applies to your current task, load it with the `skill` tool BEFORE acting",
		"(the available_skills catalog in your context lists them). If the `skill` tool is",
		"unavailable in your current context, reading the skill's SKILL.md file directly is",
		"the sanctioned fallback — its path is shown in the skill's resource hint.",
		"",
		body,
		"",
		"## DeepSeek Harness (DSH) tool mapping",
		"",
		"Skills name actions, not tools. On this harness, translate actions like this:",
		"",
		"- *invoke a skill* → the `skill` tool (parameter `name`; see available_skills).",
		"- *read a file* → `read` · *create/replace a file* → `write` · *targeted edit* → `edit`.",
		"- *find files by pattern* → `glob` · *search file contents* → `grep`.",
		"- *run shell commands / verification* → `pwsh` (PowerShell). Long or blocking commands:",
		"  pass `run_in_background`, then collect with `job_output` / stop with `job_kill`.",
		"- *dispatch a subagent / task tool* → `subagent` (self-contained task) or",
		"  `subagent_fork` (inherits this conversation); continue or steer it with",
		"  `send_message`, list with `list_agents`, stop with `interrupt_agent`.",
		"- *create a todo / task list* → `todo_write`.",
		"- *ask your human partner* → `ask_user_question`.",
		"- *web search / fetch a page* → `web_search` / `web_fetch`.",
		"- *read an image* → `read_image` (detailed evidence: `modlens_read_image`).",
		"- *browser automation* → the `dsh_browser_*` tools (`dsh_browser_open`,",
		"  `dsh_browser_snapshot`, `dsh_browser_click`, ...).",
		"- *persistent goal across continuation rounds* → `create_goal` / `update_goal`.",
		"- Skills may invoke bundled scripts (e.g. `scripts/foo.sh`). Run them through their",
		"  interpreter — `bash scripts/foo.sh` — never as a bare `./scripts/foo.sh`.",
		"</EXTREMELY_IMPORTANT>"
	].join("\n");
}
