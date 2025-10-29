import express, { Express, Request, Response } from 'express';
import { Server } from 'http';

export interface MockServerOptions {
  port?: number;
  delayMs?: number;
  failOnResearch?: boolean;
  failOnNextInquiry?: boolean;
  customResearchResponse?: {
    summary: string;
    sources: Array<{ web: { uri: string; title: string } }>;
  };
  customNextInquiryResponse?: {
    nextSubject: string;
  };
}

export class MockServer {
  private app: Express;
  private server: Server | null = null;
  private port: number;
  private options: MockServerOptions;
  private readonly defaultOptions: MockServerOptions;
  public requestLog: Array<{ method: string; path: string; body: unknown }> = [];

  constructor(options: MockServerOptions = {}) {
    this.defaultOptions = { ...options };
    this.port = this.defaultOptions.port || 4000;
    this.options = { ...this.defaultOptions };
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());

    // Log all requests
    this.app.use((req: Request, _res: Response, next) => {
      this.requestLog.push({
        method: req.method,
        path: req.path,
        body: req.body,
      });
      next();
    });

    // Add delay if specified
    if (this.options.delayMs) {
      this.app.use((_req: Request, _res: Response, next) => {
        setTimeout(next, this.options.delayMs);
      });
    }
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    // Research endpoint
    this.app.post('/api/research', (req: Request, res: Response) => {
      const { subject } = req.body || {};

      if (!subject || typeof subject !== 'string') {
        res.status(400).json({ error: 'Subject is required.' });
        return;
      }

      if (this.options.failOnResearch) {
        res.status(502).json({ error: 'Mock research failure' });
        return;
      }

      if (this.options.customResearchResponse) {
        res.json(this.options.customResearchResponse);
        return;
      }

      // Default mock response
      res.json({
        summary: `Mock research summary for: ${subject}. This is a comprehensive analysis of the topic covering key aspects and developments.`,
        sources: [
          {
            web: {
              uri: 'https://example.com/article1',
              title: 'Example Article 1',
            },
          },
          {
            web: {
              uri: 'https://example.com/article2',
              title: 'Example Article 2',
            },
          },
        ],
      });
    });

    // Next inquiry endpoint
    this.app.post('/api/next-inquiry', (req: Request, res: Response) => {
      const { summary } = req.body || {};

      if (!summary || typeof summary !== 'string') {
        res.status(400).json({ error: 'Summary is required.' });
        return;
      }

      if (this.options.failOnNextInquiry) {
        res.status(502).json({ error: 'Mock next inquiry failure' });
        return;
      }

      if (this.options.customNextInquiryResponse) {
        res.json(this.options.customNextInquiryResponse);
        return;
      }

      // Default mock response
      res.json({
        nextSubject: 'Mock next inquiry topic',
      });
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          resolve();
        });

        this.server.on('error', (error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          this.server = null;
          resolve();
        }
      });
    });
  }

  public clearRequestLog(): void {
    this.requestLog = [];
  }

  public getRequestLog(): Array<{ method: string; path: string; body: unknown }> {
    return [...this.requestLog];
  }

  public getPort(): number {
    return this.port;
  }

  public setOptions(options: Partial<MockServerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public resetOptions(): void {
    this.options = { ...this.defaultOptions };
  }
}

// Helper function to create and start a mock server
export async function createMockServer(options: MockServerOptions = {}): Promise<MockServer> {
  const server = new MockServer(options);
  await server.start();
  return server;
}

// Helper to wait for server to be ready
export async function waitForServer(port: number, maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}
