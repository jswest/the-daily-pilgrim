# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code style

You will follow DRY patterns as much as possible. In SvelteKit, prefer creating reusable components. Global styles should go in `/src/routes/+layout.svelte`. Prefer Drizzle over raw SQLite queries.