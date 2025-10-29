import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const CLI_PATH = path.join(__dirname, '../cli-dist/cli.js');
const SERVER_PATH = path.join(__dirname, '../server/index.js');
const TEST_PORT = 4003;

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

// Helper to run CLI and capture output
const runCLI = (args: string[], env: Record<string, string> = {}): Promise<CLIResult> => {
  return new Promise((resolve) => {
    const child: ChildProcess = spawn('node', [CLI_PATH, ...args], {
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        ...env,
      },
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    // Timeout after 60 seconds for E2E tests
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: -1 });
    }, 60000);
  });
};

// Helper to start the real server
const startServer = (): Promise<ChildProcess> => {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [SERVER_PATH], {
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
      },
      stdio: 'pipe',
    });

    let output = '';

    server.stdout?.on('data', (data) => {
      output += data.toString();
      if (output.includes('API server listening')) {
        resolve(server);
      }
    });

    server.stderr?.on('data', (data) => {
      const message = data.toString();
      if (message.includes('Missing GEMINI_API_KEY')) {
        reject(new Error('GEMINI_API_KEY not set'));
      }
    });

    server.on('error', (error) => {
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      server.kill();
      reject(new Error('Server start timeout'));
    }, 10000);
  });
};

// Helper to stop server
const stopServer = (server: ChildProcess): Promise<void> => {
  return new Promise((resolve) => {
    if (!server || server.killed) {
      resolve();
      return;
    }

    server.on('close', () => {
      resolve();
    });

    server.kill();

    // Force kill after 5 seconds
    setTimeout(() => {
      server.kill('SIGKILL');
      resolve();
    }, 5000);
  });
};

// Check if we have API key for E2E tests
const hasApiKey = (): boolean => {
  return !!(process.env.GEMINI_API_KEY || process.env.API_KEY);
};

describe('CLI End-to-End Tests', () => {
  let serverProcess: ChildProcess | null = null;

  beforeAll(async () => {
    if (!hasApiKey()) {
      console.log('⚠️  Skipping E2E tests: GEMINI_API_KEY not set');
      return;
    }

    try {
      serverProcess = await startServer();
      // Wait a bit for server to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Failed to start server for E2E tests:', error);
      throw error;
    }
  }, 20000);

  afterAll(async () => {
    if (serverProcess) {
      await stopServer(serverProcess);
    }
  }, 10000);

  // Skip all tests if no API key
  describe.skipIf(!hasApiKey())('Real API Integration', () => {
    it('performs real research with Gemini API', async () => {
      const result = await runCLI(['what', 'is', 'TypeScript']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[Loop 1/1] Researching: "what is TypeScript"');
      expect(result.stdout).toContain('--- Summary ---');
      expect(result.stdout).toContain('--- Sources ---');
      // Verify it's real content, not mock
      expect(result.stdout).not.toContain('Mock research summary');
    }, 60000);

    it('performs multi-loop research with real API', async () => {
      const result = await runCLI(['--loops', '2', 'Node.js', 'basics']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[Loop 1/2]');
      expect(result.stdout).toContain('[Loop 2/2]');
      expect(result.stdout).toContain('Next inquiry:');
      // Verify real next inquiry was generated
      expect(result.stdout).not.toContain('Mock next inquiry topic');
    }, 90000);

    it('generates meaningful research summaries', async () => {
      const result = await runCLI(['JavaScript', 'async/await']);

      expect(result.exitCode).toBe(0);
      const summary = result.stdout.split('--- Summary ---')[1]?.split('--- Sources ---')[0];
      expect(summary).toBeDefined();
      expect(summary!.length).toBeGreaterThan(100);
      expect(summary!.toLowerCase()).toContain('javascript');
    }, 60000);

    it('provides real sources from web search', async () => {
      const result = await runCLI(['React', 'hooks']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('--- Sources ---');

      // Real sources should have real URLs
      const sourcesSection = result.stdout.split('--- Sources ---')[1];
      expect(sourcesSection).toMatch(/https?:\/\//);
      expect(sourcesSection).not.toContain('example.com');
    }, 60000);

    it('handles API errors gracefully', async () => {
      // Use an invalid/empty API key to trigger error
      const result = await runCLI(['test'], {
        GEMINI_API_KEY: 'invalid_key_for_testing',
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('An error occurred during research:');
    }, 60000);
  });

  describe('Server Health Check', () => {
    it('server responds to health check', async () => {
      if (!hasApiKey()) {
        console.log('⚠️  Skipping: No API key');
        return;
      }

      const response = await fetch(`http://localhost:${TEST_PORT}/api/health`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual({ status: 'ok' });
    }, 10000);
  });
});

// Additional E2E tests that can run without API key
describe('CLI Binary Tests', () => {
  it('CLI executable exists and is runnable', async () => {
    const result = await runCLI(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Loop App CLI');
  }, 10000);

  it('CLI shows version correctly', async () => {
    const result = await runCLI(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/loop-app CLI v\d+\.\d+\.\d+/);
  }, 10000);

  it('CLI handles missing server gracefully', async () => {
    // Use non-existent port
    const result = await runCLI(['test'], { PORT: '9999' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('An error occurred during research:');
    expect(result.stderr).toMatch(/fetch|ECONNREFUSED|connection/i);
  }, 10000);
});
