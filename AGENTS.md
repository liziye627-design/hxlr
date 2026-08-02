# AGENTS.md

## Skills

A skill is a set of local instructions stored in a `SKILL.md` file. This project keeps local copies of shared skills so Codex can use them consistently while working in this repo.

### Project-local skill directories

- Claude skills: `.claude/skills`
- Codex system skills: `.codex/skills/.system`

### Available skills

Commonly used skills for this project:

- frontend-design: UI/UX direction for platform pages and homepage polish. (file: ./.claude/skills/frontend-design/SKILL.md)
- pair-programming: Structured collaboration workflow for iterative implementation. (file: ./.claude/skills/pair-programming/SKILL.md)
- systematic-debugging: Root-cause-first debugging for frontend/backend integration issues. (file: ./.claude/skills/systematic-debugging/SKILL.md)
- testing: General testing workflow and validation discipline. (file: ./.claude/skills/testing/SKILL.md)
- webapp-testing: Browser-oriented testing workflow for web app behavior. (file: ./.claude/skills/webapp-testing/SKILL.md)
- performance-analysis: Performance investigation for slow pages, large bundles, or runtime bottlenecks. (file: ./.claude/skills/performance-analysis/SKILL.md)
- documentation: Writing and updating project docs. (file: ./.claude/skills/documentation/SKILL.md)
- code-review: Review mindset focused on bugs, regressions, and risk. (file: ./.claude/skills/code-review/SKILL.md)
- test-driven-development: TDD workflow when adding new features or fixing regressions. (file: ./.claude/skills/test-driven-development/SKILL.md)
- verification-before-completion: Final verification before closing a task. (file: ./.claude/skills/verification-before-completion/SKILL.md)
- openai-docs: Use official OpenAI docs when OpenAI product or API behavior is relevant. (file: ./.codex/skills/.system/openai-docs/SKILL.md)
- skill-creator: Create or update local skills when the project needs specialized instructions. (file: ./.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install additional Codex skills when needed. (file: ./.codex/skills/.system/skill-installer/SKILL.md)

Additional skills are also available under `.claude/skills` and can be used when the task clearly matches them.

### How to use skills

- Trigger rules: If a user explicitly names a skill, or the task clearly matches one listed above, open that `SKILL.md` and follow it for the turn.
- Scope: Use the minimal set of skills that covers the task. Do not load unrelated skills.
- Priority for this repo: Prefer `frontend-design`, `pair-programming`, and `systematic-debugging` for homepage work, platform refactors, and frontend/backend integration.
- Local resolution: Resolve any relative file references inside a skill from that skill's directory first.
- Reuse: If a skill includes scripts, templates, or references, prefer those over rewriting from scratch.
