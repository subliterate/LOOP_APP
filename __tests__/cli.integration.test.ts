import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { MockServer, createMockServer, waitForServer } from './utils/mockServer.js';

const CLI_PATH = path.join(__dirname, '../cli-dist/cli.js');
const TEST_PORT = 4001;

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

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: -1 });
    }, 30000);
  });
};

describe('CLI Integration Tests', () => {
  let mockServer: MockServer;

  beforeAll(async () => {
    mockServer = await createMockServer({ port: TEST_PORT });
    const ready = await waitForServer(TEST_PORT);
    expect(ready).toBe(true);
  }, 10000);

  afterAll(async () => {
    if (mockServer) {
      await mockServer.stop();
    }
  });

  beforeEach(() => {
    mockServer.resetOptions();
    mockServer.clearRequestLog();
  });

  describe('Single loop research', () => {
    it('performs single research loop successfully', async () => {
      const result = await runCLI(['quantum', 'computing']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[Loop 1/1] Researching: "quantum computing"');
      expect(result.stdout).toContain('--- Summary ---');
      expect(result.stdout).toContain('Mock research summary for: quantum computing');
      expect(result.stdout).toContain('--- Sources ---');
      expect(result.stdout).toContain('Example Article 1');
      expect(result.stdout).toContain('https://example.com/article1');
    }, 10000);

    it('sends correct API request', async () => {
      await runCLI(['AI', 'safety']);

      const log = mockServer.getRequestLog();
      const researchRequest = log.find((req) => req.path === '/api/research');

      expect(researchRequest).toBeDefined();
      expect(researchRequest?.method).toBe('POST');
      expect((researchRequest?.body as { subject?: string })?.subject).toBe('AI safety');
    }, 10000);

    it('combines multiple prompt words', async () => {
      await runCLI(['what', 'is', 'quantum', 'computing']);

      const log = mockServer.getRequestLog();
      const researchRequest = log.find((req) => req.path === '/api/research');

      expect((researchRequest?.body as { subject?: string })?.subject).toBe(
        'what is quantum computing'
      );
    }, 10000);

    it('handles research with no sources', async () => {
      mockServer.setOptions({
        customResearchResponse: {
          summary: 'Research summary without sources',
          sources: [],
        },
      });

      const result = await runCLI(['test', 'topic']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Research summary without sources');
      expect(result.stdout).not.toContain('--- Sources ---');
    }, 10000);
  });

  describe('Multiple loop research', () => {
    it('performs multiple research loops', async () => {
      const result = await runCLI(['--loops', '3', 'artificial', 'intelligence']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[Loop 1/3]');
      expect(result.stdout).toContain('[Loop 2/3]');
      expect(result.stdout).toContain('[Loop 3/3]');
      expect(result.stdout).toContain('Next inquiry: "Mock next inquiry topic"');
    }, 15000);

    it('sends correct number of API requests', async () => {
      await runCLI(['--loops', '2', 'machine', 'learning']);

      const log = mockServer.getRequestLog();
      const researchRequests = log.filter((req) => req.path === '/api/research');
      const inquiryRequests = log.filter((req) => req.path === '/api/next-inquiry');

      expect(researchRequests.length).toBe(2);
      expect(inquiryRequests.length).toBe(1); // Only 1 because last loop doesn't need next inquiry
    }, 15000);

    it('uses next inquiry result as subject for subsequent loop', async () => {
      mockServer.setOptions({
        customNextInquiryResponse: {
          nextSubject: 'Deep learning architectures',
        },
      });

      await runCLI(['--loops', '2', 'neural', 'networks']);

      const log = mockServer.getRequestLog();
      const researchRequests = log.filter((req) => req.path === '/api/research');

      expect((researchRequests[0]?.body as { subject?: string })?.subject).toBe(
        'neural networks'
      );
      expect((researchRequests[1]?.body as { subject?: string })?.subject).toBe(
        'Deep learning architectures'
      );
    }, 15000);

    it('stops early if next inquiry fails', async () => {
      mockServer.setOptions({
        failOnNextInquiry: true,
      });

      const result = await runCLI(['--loops', '3', 'test']);

      expect(result.exitCode).toBe(0); // Should exit gracefully, not with error
      expect(result.stdout).toContain('[Loop 1/3]');
      expect(result.stdout).not.toContain('[Loop 2/3]');
      expect(result.stderr).toContain('Failed to locate the next inquiry');
    }, 15000);

    it('stops early if next inquiry returns empty subject', async () => {
      mockServer.setOptions({
        customNextInquiryResponse: {
          nextSubject: '',
        },
      });

      const result = await runCLI(['--loops', '3', 'test']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[Loop 1/3]');
      expect(result.stdout).not.toContain('[Loop 2/3]');
      expect(result.stdout).toContain('Next inquiry not provided. Ending loop early.');
    }, 15000);
  });

  describe('Error handling', () => {
    it('exits with error when research fails', async () => {
      mockServer.setOptions({
        failOnResearch: true,
      });

      const result = await runCLI(['test', 'prompt']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('An error occurred during research:');
    }, 10000);

    it('displays error message from server', async () => {
      mockServer.setOptions({
        failOnResearch: true,
      });

      const result = await runCLI(['test']);

      expect(result.stderr).toContain('Mock research failure');
    }, 10000);

    it('handles network errors gracefully', async () => {
      // Use wrong port to simulate connection error
      const result = await runCLI(['test'], { PORT: '9999' });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('An error occurred during research:');
    }, 10000);

    it('handles server timeout', async () => {
      mockServer.setOptions({
        delayMs: 5000, // 5 second delay
      });

      const result = await runCLI(['test']);

      // Should eventually complete or timeout
      expect(result.exitCode).not.toBe(-1); // Not killed by our timeout
    }, 15000);
  });

  describe('Output formatting', () => {
    it('displays loop progress correctly', async () => {
      const result = await runCLI(['--loops', '2', 'test']);

      expect(result.stdout).toMatch(/\[Loop 1\/2\] Researching: "test"/);
      expect(result.stdout).toMatch(/\[Loop 2\/2\] Researching:/);
    }, 15000);

    it('formats sources correctly', async () => {
      mockServer.setOptions({
        customResearchResponse: {
          summary: 'Test summary',
          sources: [
            { web: { uri: 'https://test1.com', title: 'Test Article 1' } },
            { web: { uri: 'https://test2.com', title: 'Test Article 2' } },
            { web: { uri: 'https://test3.com', title: 'Test Article 3' } },
          ],
        },
      });

      const result = await runCLI(['test']);

      expect(result.stdout).toContain('--- Sources ---');
      expect(result.stdout).toContain('- Test Article 1: https://test1.com');
      expect(result.stdout).toContain('- Test Article 2: https://test2.com');
      expect(result.stdout).toContain('- Test Article 3: https://test3.com');
    }, 10000);

    it('displays next inquiry prompt', async () => {
      mockServer.setOptions({
        customNextInquiryResponse: {
          nextSubject: 'Advanced quantum algorithms',
        },
      });

      const result = await runCLI(['--loops', '2', 'quantum']);

      expect(result.stdout).toContain('Next inquiry: "Advanced quantum algorithms"');
    }, 15000);
  });

  describe('Loop count validation', () => {
    it('accepts loop count of 1', async () => {
      const result = await runCLI(['--loops', '1', 'test']);

      expect(result.stdout).toContain('[Loop 1/1]');
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('accepts loop count of 10', async () => {
      const result = await runCLI(['--loops', '10', 'test']);

      expect(result.stdout).toContain('[Loop 1/10]');
      // We won't wait for all 10 loops in tests, just verify it started
      expect(result.exitCode).not.toBe(1);
    }, 20000);
  });

  describe('Environment configuration', () => {
    it('uses PORT environment variable', async () => {
      const customPort = 4002;
      const customServer = await createMockServer({ port: customPort });

      try {
        await waitForServer(customPort);
        const result = await runCLI(['test'], { PORT: String(customPort) });

        expect(result.exitCode).toBe(0);
      } finally {
        await customServer.stop();
      }
    }, 15000);

    it('uses VITE_API_BASE_URL if provided', async () => {
      const result = await runCLI(['test'], {
        VITE_API_BASE_URL: `http://localhost:${TEST_PORT}`,
      });

      expect(result.exitCode).toBe(0);
    }, 10000);
  });
});
