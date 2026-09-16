# CLAUDE.md — SG Finance Suite

Project-level instructions for Claude Code. These override default behaviour.

---

# Verification Policy

Before completing any task, automatically execute:

```bash
npm run format
npm run lint
npm run build
```

If any command fails:

1. Analyze the error.
2. Fix the root cause.
3. Re-run the failed command.
4. Repeat until all commands succeed.

Do not consider a task complete until:

- Formatting passes.
- ESLint reports zero errors.
- The project builds successfully.

If any verification step cannot be executed, explain why and provide the exact command that should be run manually.
