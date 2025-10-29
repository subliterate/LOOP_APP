# Testing Guide - Quick Reference

## Quick Commands

```bash
# Fast validation (recommended for pre-commit)
npm run test:unit && npm run test:smoke

# Full test suite (unit + integration + smoke)
npm run test:all

# Individual test suites
npm run test:unit         # Unit tests only
npm run test:cli          # CLI argument parsing tests
npm run test:integration  # Integration tests with mock server
npm run test:e2e          # E2E tests with real API (requires GEMINI_API_KEY)
npm run test:smoke        # Quick bash-based smoke tests

# Coverage report
npm run test:coverage
```

## Test Pyramid

```
        /\
       /E2E\        ← Slow, expensive (requires API key)
      /------\
     /  Intg  \     ← Medium speed, mock server
    /----------\
   /   Unit     \   ← Fast, isolated
  /--------------\
 /     Smoke      \ ← Fastest, critical paths only
/------------------\
```

## Pre-Deployment Checklist

- [ ] `npm run test:unit` - All unit tests pass
- [ ] `npm run build:cli` - CLI builds successfully
- [ ] `npm run test:smoke` - Smoke tests pass
- [ ] `npm run test:integration` - Integration tests pass
- [ ] `npm run test:e2e` - E2E tests pass (if API key available)
- [ ] `npm run pkg` - Binary builds successfully (Linux/Windows)
- [ ] Manual test: Run binary with real query

## Test Structure

```
__tests__/
├── cli.test.ts              # CLI argument parsing (15 tests)
├── cli.integration.test.ts  # Mock server integration (30+ tests)
├── cli.e2e.test.ts         # Real API tests (optional)
└── utils/
    └── mockServer.ts        # Mock Express server

scripts/
└── smoke-test.sh            # Bash smoke tests (15 checks)

services/__tests__/
└── geminiService.test.ts    # Service layer tests
```

## Coverage Goals

| Component | Current | Target |
|-----------|---------|--------|
| CLI (`cli.ts`) | ~90% | 95% |
| Services | ~85% | 90% |
| Integration | E2E | E2E |

## Common Workflows

### During Development
```bash
# Watch mode for rapid feedback
npm test -- --watch

# Test specific file
npm test -- cli.test.ts
```

### Before Commit
```bash
# Quick validation
npm run test:unit && npm run test:smoke
```

### Before PR
```bash
# Full validation
npm run test:all
```

### Before Release
```bash
# Complete validation + binary build
npm run test:all && npm run pkg && ./release/loop-app --help
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "No CLI found" | Run `npm run build:cli` |
| Port in use | `lsof -i :4001` then `kill -9 <PID>` |
| Tests timeout | Check port availability, increase timeout |
| E2E fails | Set `GEMINI_API_KEY` environment variable |
| Build errors | `rm -rf cli-dist && npm ci && npm run build:cli` |

## CI/CD Integration

**Minimal (fast):**
```yaml
- npm ci
- npm run test:unit
- npm run build:cli
- npm run test:smoke
```

**Complete (thorough):**
```yaml
- npm ci
- npm run test:all
- npm run pkg
```

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Real API access for E2E tests | E2E only |
| `PORT` | Backend server port | No (default: 4000) |
| `VITE_API_BASE_URL` | API base URL override | No |

## Need More Details?

See [__tests__/README.md](./__tests__/README.md) for comprehensive documentation.

---

**TL;DR:** Run `npm run test:unit && npm run test:smoke` before committing.
