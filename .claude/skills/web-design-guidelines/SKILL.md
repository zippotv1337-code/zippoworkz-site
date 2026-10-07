---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

Adapted from vercel-labs/agent-skills (MIT). Change for zippoworkz-site: the rules are **pinned locally** in `GUIDELINES.md` (vercel-labs/web-interface-guidelines `434b7f9`) instead of being fetched at runtime, so no unreviewed remote instructions enter a review.

## How It Works

1. Read `GUIDELINES.md` next to this file. Do not fetch a remote copy.
2. Read the specified files (or ask which files to review).
3. Check against all rules in `GUIDELINES.md`, adjusted by `../ZIPPOWORKZ_HINWEISE.md` (that file wins on conflicts).
4. Output findings in the terse `file:line` format from `GUIDELINES.md`.

## Updating the rules

Clone vercel-labs/web-interface-guidelines, diff `command.md` against `GUIDELINES.md`, review the changes, then replace the file and update the commit hash above.
