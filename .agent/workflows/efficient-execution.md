---
description: Token-efficient execution guidelines for this project
---

# Efficient Execution

## Core Principles
1. **Skip greetings/apologies** - Jump straight to action
2. **Batch file views** - View multiple files in parallel when possible
3. **Minimize re-viewing** - Trust the code context summary from truncation
4. **One task_boundary per major phase** - Not every tool call

## When to Update Artifacts
- `task.md`: Only when completing/starting a major phase
- `implementation_plan.md`: Only for new features requiring design
- `walkthrough.md`: Only at feature completion

## Code Style (This Project)
- React/Next.js (App Router), TypeScript, Tailwind
- Functional components, no classes
- JSDoc for exported functions
- No `console.log` in production code

## Before Complex Solutions
Ask yourself:
1. Is there simpler existing code to reuse?
2. What edge cases matter?
3. Does this break anything else?

## Error Recovery
If a command fails: analyze error → attempt fix → retry once → then ask user.

## File Operations
- Never modify files outside workspace (except `~/.gemini/antigravity/`)
- Check `.env.example` for secret patterns
- Use service role client only when RLS bypass needed
