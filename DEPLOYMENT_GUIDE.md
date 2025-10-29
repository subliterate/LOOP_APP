# Deployment & Configuration Guide

This guide covers deployment, configuration, and production best practices for Loop App.

## Table of Contents

- [Quick Start](#quick-start)
- [Production Readiness Improvements](#production-readiness-improvements)
- [Environment Configuration](#environment-configuration)
- [Error Recovery & Retry Logic](#error-recovery--retry-logic)
- [Logging & Observability](#logging--observability)
- [Deployment Scenarios](#deployment-scenarios)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Development

```bash
# Terminal 1: Backend API Server
npm run server

# Terminal 2: Frontend (Vite dev server with API proxy)
npm run dev

# Terminal 3: CLI
npm run build:cli
node cli-dist/cli.js "your research topic" --loops 1
```

### Production Build

```bash
# Frontend
npm run build

# CLI Binary
npm run pkg

# Output: release/loop-app (Linux/Windows executables)
```

## Production Readiness Improvements

### 1. Error Recovery with Exponential Backoff ✅

**What was added:**
- Automatic retry logic with exponential backoff
- Jitter to prevent thundering herd
- Smart retry detection (retries network errors, not client errors)

**Configuration:**

Service layer (`services/geminiServiceCore.ts`):
```
- Max attempts: 3
- Initial delay: 500ms
- Max delay: 5000ms
- Backoff multiplier: 2
```

Server API (`server/index.js`):
```
- Max attempts: 3
- Initial delay: 1000ms
- Max delay: 10000ms
- Backoff multiplier: 2
```

**Example behavior:**
```
Request 1 fails → Wait 500ms
Request 2 fails → Wait 1000ms
Request 3 fails → Throw error
```

### 2. Structured Logging ✅

**What was added:**
- Lightweight structured logging (no external dependencies)
- JSON or text output formats
- Configurable log levels
- Service-aware logging (timestamp, level, service name, context)

**Configuration via environment variables:**

```bash
# Text format (default)
LOG_LEVEL=INFO npm run server

# JSON format for production
LOG_FORMAT=json npm run server

# Debug mode (verbose)
LOG_LEVEL=DEBUG npm run server
```

**Example output (text):**
```
[2025-10-29T14:32:45.123Z] [INFO] [server] Server initializing {"port":4000}
[2025-10-29T14:32:45.234Z] [INFO] [server] API server started successfully {"port":4000,"url":"http://localhost:4000","environment":"development"}
[2025-10-29T14:32:50.456Z] [INFO] [server] Research completed successfully {"subject":"machine learning","sourcesCount":5}
```

**Example output (JSON):**
```json
{"timestamp":"2025-10-29T14:32:45.123Z","level":"INFO","service":"server","message":"Server initializing","port":4000}
```

### 3. Flexible Remote API Configuration ✅

**What was added:**
- Support for custom API base URLs
- Better CLI help documentation
- Debug mode configuration logging

**Environment Variables:**

| Variable | Default | Example |
|----------|---------|---------|
| `VITE_API_BASE_URL` | - | `https://api.example.com` |
| `PORT` | `4000` | `3000` |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `WARN`, `ERROR` |
| `LOG_FORMAT` | `text` | `json` |

**Usage Examples:**

```bash
# Local development
npm run dev

# Custom backend port
PORT=3000 npm run server

# Remote production API
VITE_API_BASE_URL=https://api.prod.example.com npm run build

# CLI with remote API
VITE_API_BASE_URL=https://api.prod.example.com npm run build:cli
node cli-dist/cli.js "research topic"

# Debug mode
LOG_LEVEL=DEBUG npm run server
```

## Environment Configuration

### .env File (Local Development)

Create `.env` in project root:

```bash
# Gemini API Key (required)
GEMINI_API_KEY=your-api-key-here

# Backend server port
PORT=4000

# Frontend API base URL (optional, for proxy bypass)
VITE_API_BASE_URL=http://localhost:4000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=text
```

### Production Environment Variables

For production deployment:

```bash
# Required
GEMINI_API_KEY=<your-production-key>

# Optional
VITE_API_BASE_URL=https://your-api.example.com
PORT=4000
NODE_ENV=production
LOG_LEVEL=WARN
LOG_FORMAT=json
```

## Error Recovery & Retry Logic

### How It Works

When an API call fails, the system automatically retries with exponential backoff:

1. **First attempt**: Immediate
2. **On failure**: Check if error is retryable
3. **Retryable errors**: Network issues, 5xx errors, rate limits (429)
4. **Non-retryable**: Client errors (400, 401, 403)
5. **Retry backoff**: Wait + jitter, then retry
6. **Max attempts**: Give up after 3 attempts
7. **Total max wait**: ~10 seconds per request

### Monitoring Retries

Watch server logs for retry activity:

```bash
LOG_LEVEL=DEBUG npm run server
```

Output:
```
[warn] api/research attempt failed, retrying
  {"function":"api/research","attempt":1,"delayMs":523,"error":"timeout"}
[warn] api/research attempt failed, retrying
  {"function":"api/research","attempt":2,"delayMs":1087,"error":"timeout"}
[info] Research completed successfully
  {"subject":"machine learning","sourcesCount":5}
```

## Logging & Observability

### Log Levels

| Level | When to Use | Example |
|-------|------------|---------|
| `DEBUG` | Development/troubleshooting | Configuration details, all retries |
| `INFO` | Normal operation | Successful requests, server startup |
| `WARN` | Degraded operation | Retries, empty responses |
| `ERROR` | Failures | API failures after retries |

### Structured Logging Fields

Each log entry includes:
- `timestamp`: ISO 8601 format
- `level`: DEBUG, INFO, WARN, ERROR
- `service`: Identifies the component (e.g., "server")
- `message`: Human-readable description
- `...context`: Operation-specific fields

### Production Logging Setup

For production, use JSON format with centralized logging:

```bash
# Server with JSON logging
LOG_FORMAT=json LOG_LEVEL=WARN npm run server

# Pipe to log aggregation service
LOG_FORMAT=json npm run server | jq '.' | tee /var/log/loop-app.log
```

## Deployment Scenarios

### Scenario 1: Docker Container (Recommended)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY server/ ./server/
COPY dist/ ./dist/

ENV NODE_ENV=production
ENV LOG_FORMAT=json
ENV LOG_LEVEL=WARN

EXPOSE 4000
CMD ["node", "server/index.js"]
```

Build and run:

```bash
docker build -t loop-app-server .
docker run -e GEMINI_API_KEY=xxx -p 4000:4000 loop-app-server
```

### Scenario 2: AWS Lambda

Use AWS Lambda with Node.js 18 runtime:

```javascript
// handler.mjs (Lambda entry point)
import { GoogleGenAI } from '@google/genai';

export const handler = async (event) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = event.subject || '';
  // ... implement research logic
};
```

Deploy:

```bash
npm run build:cli
# Package and deploy to Lambda
```

### Scenario 3: CLI Binary Distribution

Create standalone executables:

```bash
npm run pkg
# Outputs: release/loop-app (Linux), release/loop-app.exe (Windows)
```

Distribute and run:

```bash
VITE_API_BASE_URL=https://api.example.com ./loop-app "research topic"
```

### Scenario 4: npm Package

Users can install as CLI tool:

```bash
npm install -g loop-app
loop-app "machine learning" --loops 3
```

## Troubleshooting

### Issue: "Failed to perform deep research" (After Retries)

**Cause**: API calls failed after 3 attempts

**Solution:**
1. Check Gemini API key: `echo $GEMINI_API_KEY`
2. Verify API quota at Google Cloud Console
3. Check network connectivity
4. Enable debug logging: `LOG_LEVEL=DEBUG`

### Issue: Empty research summary

**Logs**: `[warn] Empty research summary returned`

**Cause**: Gemini returned empty response

**Solution:**
1. Try different research topic
2. Check Gemini model availability
3. Verify prompt format

### Issue: API timeout

**Logs**: `[warn] api/research attempt failed, retrying`

**Cause**: Request taking too long

**Solution:**
1. Network is slow - retries will continue
2. Backend is overloaded - scale up
3. Gemini API slow - monitor their status page

### Issue: Remote API not working

**Setup:**
```bash
VITE_API_BASE_URL=https://api.prod.com npm run build:cli
node cli-dist/cli.js "topic"
```

**Debugging:**
```bash
LOG_LEVEL=DEBUG VITE_API_BASE_URL=https://api.prod.com npm run build:cli
node cli-dist/cli.js "topic"

# Check output for:
# [DEBUG] Configuration {"apiBaseUrl":"https://api.prod.com",...}
```

### Issue: High memory usage in production

**Solution:**
1. Set `NODE_OPTIONS=--max-old-space-size=512`
2. Use clustering: multiple worker processes
3. Monitor with: `node --inspect server/index.js`

## Performance Tips

### Optimize for Production

1. **Reduce logging overhead:**
   ```bash
   LOG_LEVEL=ERROR npm run server  # Minimal logging
   ```

2. **Enable JSON logging for parsing:**
   ```bash
   LOG_FORMAT=json npm run server
   ```

3. **Use process managers:**
   ```bash
   # PM2 example
   pm2 start server/index.js --name "loop-app-server"
   pm2 logs loop-app-server
   ```

4. **Monitor metrics:**
   - Request latency
   - Error rate
   - Retry frequency
   - API quota usage

## Related Documentation

- See [README.md](./README.md) for basic setup
- See [CLAUDE.md](./CLAUDE.md) for architecture
- See [TESTING.md](./TESTING.md) for test setup
- See [ANALYSIS_QUICK_REFERENCE.md](./ANALYSIS_QUICK_REFERENCE.md) for project overview

## Summary of Improvements

| Concern | Solution | Status |
|---------|----------|--------|
| No retry logic | Exponential backoff (3 attempts) | ✅ Implemented |
| Minimal logging | Structured logging with levels | ✅ Implemented |
| Remote API inflexible | Env vars support (VITE_API_BASE_URL, PORT) | ✅ Implemented |
| No JSDoc | Added comprehensive documentation | ✅ Implemented |
| Sparse test coverage | Foundation for expansion | 🔄 Ongoing |

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
**Status**: Production Ready (with recommendations above)
