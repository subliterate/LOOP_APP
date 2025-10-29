# CLI Test Suite Documentation

Comprehensive test coverage for the Loop App CLI executable targeting Linux platforms.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Test Requirements](#test-requirements)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This test suite provides multi-layered testing for the CLI executable:

1. **Unit Tests** - Test individual components and argument parsing logic
2. **Integration Tests** - Test the compiled CLI with a mock server
3. **E2E Tests** - Test with the real Gemini API (optional)
4. **Smoke Tests** - Quick validation scripts for deployment verification

### Test Coverage

| Category | Files Tested | Coverage |
|----------|-------------|----------|
| CLI Argument Parsing | `cli.ts` | ~90% |
| Service Layer | `services/geminiServiceCore.ts` | ~85% |
| Integration | Full CLI workflow | End-to-end |
| Smoke Tests | Built executable | Critical paths |

## Test Structure

```
__tests__/
├── README.md                     # This file
├── cli.test.ts                   # Unit tests for CLI argument parsing
├── cli.integration.test.ts       # Integration tests with mock server
├── cli.e2e.test.ts              # End-to-end tests with real API
└── utils/
    └── mockServer.ts             # Mock server implementation

scripts/
└── smoke-test.sh                 # Bash smoke test script
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Build the CLI (required for integration/E2E tests)
npm run build:cli
```

### Test Commands

```bash
# Run all unit tests (services + CLI)
npm run test:unit

# Run CLI argument parsing tests
npm run test:cli

# Run integration tests with mock server
npm run test:integration

# Run end-to-end tests with real API (requires GEMINI_API_KEY)
npm run test:e2e

# Run smoke tests (fast validation)
npm run test:smoke

# Run all tests (unit + CLI + integration + smoke)
npm run test:all

# Run tests with coverage report
npm run test:coverage
```

### Quick Start

```bash
# Fastest test run (unit + smoke)
npm run test:unit && npm run test:smoke

# Full test suite
npm run test:all

# Watch mode for development
npm test
```

## Test Categories

### 1. Unit Tests (`cli.test.ts`)

Tests CLI argument parsing logic by spawning the compiled JavaScript.

**What's tested:**
- `--help` and `-h` flags
- `--version` and `-v` flags
- `--loops` and `-n` flags with validation
- Prompt handling (required, multi-word)
- Unknown option rejection
- Error messages

**Example:**
```bash
npm run test:cli
```

**Key test cases:**
- ✅ Display help message
- ✅ Display version
- ✅ Validate loop count (1-10)
- ✅ Reject invalid options
- ✅ Require prompt
- ✅ Parse combined arguments

### 2. Integration Tests (`cli.integration.test.ts`)

Tests the full CLI workflow with a mock Express server.

**What's tested:**
- Single-loop research workflow
- Multi-loop research with next inquiry
- API request/response handling
- Error scenarios (server failures, timeouts)
- Output formatting
- Environment variable configuration

**Example:**
```bash
npm run test:integration
```

**Mock Server Features:**
- Configurable responses
- Request logging
- Failure simulation
- Delay injection
- Custom responses

**Key test cases:**
- ✅ Successful research completion
- ✅ Multiple loop iterations
- ✅ Next inquiry generation
- ✅ API error handling
- ✅ Network failure handling
- ✅ Source formatting
- ✅ Environment variable usage

### 3. End-to-End Tests (`cli.e2e.test.ts`)

Tests with the real backend server and Gemini API.

**What's tested:**
- Real API integration
- Actual research summaries
- Real web search sources
- Multi-loop workflows
- Server health checks

**Requirements:**
- `GEMINI_API_KEY` environment variable
- Network connectivity
- API quota available

**Example:**
```bash
# Set API key
export GEMINI_API_KEY="your-api-key-here"

# Run E2E tests
npm run test:e2e
```

**Note:** E2E tests are automatically skipped if `GEMINI_API_KEY` is not set.

**Key test cases:**
- ✅ Real research with Gemini API
- ✅ Multi-loop real workflow
- ✅ Meaningful summary generation
- ✅ Real source URLs
- ✅ API error handling
- ✅ Server health validation

### 4. Smoke Tests (`scripts/smoke-test.sh`)

Fast bash-based validation for quick deployment checks.

**What's tested:**
- Executable availability
- Basic flag functionality
- Error handling
- Help/version output format

**Example:**
```bash
npm run test:smoke

# Or directly
./scripts/smoke-test.sh
```

**Tests (15 total):**
1. Help display (`--help`)
2. Help short form (`-h`)
3. Version display (`--version`)
4. Version short form (`-v`)
5. No arguments error
6. Unknown flag rejection
7. Invalid loop count (0)
8. Invalid loop count (11)
9. Non-numeric loop count
10. Loops without value
11. Help contains usage info
12. Help contains options
13. Version format check
14. Error message validation
15. Unknown option error message

**Output:**
```
================================
   CLI SMOKE TESTS
================================

Test 1: Display help with --help ... PASS
Test 2: Display help with -h ... PASS
...
Tests run:    15
Tests passed: 15
Tests failed: 0

✓ All smoke tests passed!
```

## Test Requirements

### System Requirements

- **Node.js**: v18 or higher
- **OS**: Linux (primary target)
- **Shell**: Bash (for smoke tests)
- **Network**: Required for E2E tests

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `GEMINI_API_KEY` | E2E only | - | Gemini API authentication |
| `API_KEY` | E2E only | - | Alternative API key name |
| `PORT` | No | `4000` | Backend server port |
| `VITE_API_BASE_URL` | No | `http://localhost:{PORT}` | API base URL |

### Dependencies

All test dependencies are in `package.json`:

```json
{
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitest/coverage-v8": "^4.0.3",
    "vitest": "^4.0.3"
  },
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5"
  }
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CLI Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Build CLI
        run: npm run build:cli

      - name: Run smoke tests
        run: npm run test:smoke

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests (if API key available)
        if: ${{ secrets.GEMINI_API_KEY }}
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### GitLab CI Example

```yaml
test:
  image: node:18
  script:
    - npm ci
    - npm run test:unit
    - npm run build:cli
    - npm run test:smoke
    - npm run test:integration
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run test:unit && npm run test:smoke
```

## Troubleshooting

### Common Issues

#### 1. "No CLI found" Error

**Problem:** Smoke tests can't find the CLI executable.

**Solution:**
```bash
# Build the CLI first
npm run build:cli

# Then run tests
npm run test:smoke
```

#### 2. Integration Tests Timeout

**Problem:** Tests hang waiting for server response.

**Solution:**
- Check if port 4001 is already in use
- Increase timeout in `vitest.config.ts`
- Check network/firewall settings

```bash
# Check if port is in use
lsof -i :4001

# Kill process if needed
kill -9 <PID>
```

#### 3. E2E Tests Fail with API Error

**Problem:** "Missing GEMINI_API_KEY" or API errors.

**Solution:**
```bash
# Set API key
export GEMINI_API_KEY="your-key-here"

# Verify it's set
echo $GEMINI_API_KEY

# Run tests
npm run test:e2e
```

#### 4. Mock Server Won't Start

**Problem:** "EADDRINUSE" error in integration tests.

**Solution:**
```bash
# Find process using port 4001
lsof -i :4001

# Kill it
kill -9 <PID>

# Or use a different port
PORT=4002 npm run test:integration
```

#### 5. TypeScript Compilation Errors

**Problem:** Build fails before tests run.

**Solution:**
```bash
# Clean build artifacts
rm -rf cli-dist/

# Reinstall dependencies
npm ci

# Rebuild
npm run build:cli
```

#### 6. Tests Pass Locally but Fail in CI

**Problem:** Environment differences.

**Checklist:**
- [ ] Node version matches (check `package.json` engines)
- [ ] All dependencies installed (`npm ci` not `npm install`)
- [ ] Environment variables set
- [ ] Correct working directory
- [ ] Sufficient timeout values

### Debug Mode

Run tests with verbose output:

```bash
# Vitest debug mode
DEBUG=* npm run test:integration

# Or with Vitest UI
npx vitest --ui
```

### Test Coverage Issues

If coverage is incomplete:

```bash
# Generate detailed coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html

# Check specific file coverage
npx vitest --coverage --coverage.include="cli.ts"
```

## Best Practices

### For Developers

1. **Always build before testing:**
   ```bash
   npm run build:cli && npm run test:smoke
   ```

2. **Run tests incrementally:**
   - Unit tests during development (fast)
   - Integration tests before commit
   - E2E tests before release

3. **Use watch mode during development:**
   ```bash
   npm test -- --watch
   ```

4. **Check coverage regularly:**
   ```bash
   npm run test:coverage
   ```

### For CI/CD

1. **Cache node_modules:**
   Speeds up builds significantly

2. **Run tests in parallel:**
   ```yaml
   test:
     parallel:
       matrix:
         type: [unit, integration, e2e]
   ```

3. **Fail fast:**
   Stop on first failure to save CI time

4. **Upload artifacts:**
   Save test reports and coverage for debugging

## Contributing

When adding new tests:

1. Place unit tests in `__tests__/*.test.ts`
2. Update this README with new test categories
3. Add smoke test cases if testing CLI flags
4. Ensure tests are isolated (no shared state)
5. Use descriptive test names
6. Add comments for complex test logic

### Test Naming Convention

```typescript
describe('Feature Name', () => {
  describe('Specific behavior', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)
- [Express Testing](https://expressjs.com/en/guide/testing.html)
- [Google GenAI SDK](https://github.com/google/generative-ai-js)

## License

Same as parent project.

---

**Last Updated:** 2025-10-27
**Maintained By:** Development Team
