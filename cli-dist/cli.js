#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const path = require("node:path");
const geminiService_node_js_1 = require("./services/geminiService.node.js");
const loadLocalEnv = () => {
    if (typeof process === 'undefined') {
        return;
    }
    const envPath = path.resolve(process.cwd(), '.env');
    if (!(0, node_fs_1.existsSync)(envPath)) {
        return;
    }
    try {
        const contents = (0, node_fs_1.readFileSync)(envPath, 'utf8');
        contents.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                return;
            }
            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex <= 0) {
                return;
            }
            const key = trimmed.slice(0, separatorIndex).trim();
            let value = trimmed.slice(separatorIndex + 1).trim();
            if (!key) {
                return;
            }
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            value = value.replace(/\\n/g, '\n');
            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        });
    }
    catch (error) {
        console.warn('Warning: Failed to load .env file:', error);
    }
};
loadLocalEnv();
async function main() {
    const args = process.argv.slice(2);
    let showHelp = false;
    let showVersion = false;
    let loopCount = 1;
    // Load defaults from environment variables
    let depth = process.env.RESEARCH_DEPTH || 'scholarly';
    let academicLevel = process.env.RESEARCH_ACADEMIC_LEVEL || 'ba';
    const promptParts = [];
    const parseLoopValue = (value) => {
        if (!value) {
            console.error('Error: --loops option requires a number.');
            process.exit(1);
        }
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
            console.error('Error: Loop count must be a valid number.');
            process.exit(1);
        }
        if (parsed < 1) {
            console.error('Error: Loop count must be at least 1.');
            process.exit(1);
        }
        if (parsed > 10) {
            console.error('Error: Loop count cannot exceed 10.');
            process.exit(1);
        }
        loopCount = parsed;
    };
    const parseDepthValue = (value) => {
        if (!value) {
            console.error('Error: --depth option requires a value: casual, professional, scholarly, or expert.');
            process.exit(1);
        }
        if (!['casual', 'professional', 'scholarly', 'expert'].includes(value)) {
            console.error(`Error: Invalid depth level "${value}". Must be one of: casual, professional, scholarly, expert`);
            process.exit(1);
        }
        depth = value;
    };
    const parseAcademicLevelValue = (value) => {
        if (!value) {
            console.error('Error: --academic-level option requires a value: ba, ma, or phd.');
            process.exit(1);
        }
        if (!['ba', 'ma', 'phd'].includes(value)) {
            console.error(`Error: Invalid academic level "${value}". Must be one of: ba, ma, phd`);
            process.exit(1);
        }
        academicLevel = value;
    };
    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
            showHelp = true;
            continue;
        }
        if (arg === '--version' || arg === '-v') {
            showVersion = true;
            continue;
        }
        if (arg === '--loops' || arg === '-n') {
            const next = args[i + 1];
            parseLoopValue(next);
            i += 1;
            continue;
        }
        if (arg.startsWith('--loops=')) {
            parseLoopValue(arg.split('=')[1]);
            continue;
        }
        if (arg.startsWith('-n=')) {
            parseLoopValue(arg.split('=')[1]);
            continue;
        }
        if (arg === '--depth') {
            const next = args[i + 1];
            parseDepthValue(next);
            i += 1;
            continue;
        }
        if (arg.startsWith('--depth=')) {
            parseDepthValue(arg.split('=')[1]);
            continue;
        }
        if (arg === '--academic-level') {
            const next = args[i + 1];
            parseAcademicLevelValue(next);
            i += 1;
            continue;
        }
        if (arg.startsWith('--academic-level=')) {
            parseAcademicLevelValue(arg.split('=')[1]);
            continue;
        }
        if (arg.startsWith('-') && arg.length > 1) {
            console.error(`Error: Unknown option "${arg}".`);
            process.exit(1);
        }
        promptParts.push(arg);
    }
    const prompt = promptParts.join(' ').trim();
    if (showVersion && !prompt) {
        const version = process.env.npm_package_version || '0.0.0';
        console.log(`loop-app CLI v${version}`);
        return;
    }
    const usage = [
        'Loop App CLI',
        '',
        'Usage: loop-app [options] <prompt>',
        '',
        'Options:',
        '  -h, --help              Show this help message',
        '  -v, --version           Show CLI version',
        '  -n, --loops NUM         Number of research loops to run (1-10, default: 1)',
        '  --depth LEVEL           Research depth: casual, professional, scholarly, expert (default: scholarly)',
        '  --academic-level LEVEL  Academic level: ba, ma, phd (default: ba)',
        '',
        'Environment Variables:',
        '  VITE_API_BASE_URL        Custom backend API URL (e.g., https://api.example.com)',
        '  PORT                     Backend port if using localhost (default: 4000)',
        '  RESEARCH_DEPTH           Default research depth: casual, professional, scholarly, expert',
        '  RESEARCH_ACADEMIC_LEVEL  Default academic level: ba, ma, phd',
        '  LOG_LEVEL                Logging level: DEBUG, INFO, WARN, ERROR (default: INFO)',
        '  LOG_FORMAT               Set to "json" for JSON output (default: text)',
        '',
        'Examples:',
        '  loop-app "machine learning trends"',
        '  loop-app "quantum computing" --loops 3',
        '  loop-app "artificial intelligence" --depth scholarly --academic-level ba',
        '  loop-app "physics" --depth expert --academic-level phd',
        '  RESEARCH_DEPTH=expert loop-app "research topic"',
        '  RESEARCH_DEPTH=professional RESEARCH_ACADEMIC_LEVEL=ma loop-app "topic"',
        '  VITE_API_BASE_URL=https://api.prod.com loop-app "research topic"',
        '  LOG_LEVEL=DEBUG loop-app "research topic"',
    ].join('\n');
    if (showHelp) {
        console.log(usage);
        return;
    }
    if (!prompt) {
        console.error('Error: A prompt is required.');
        console.log('');
        console.log(usage);
        process.exit(1);
    }
    // Log configuration if debug mode is enabled
    if (process.env.LOG_LEVEL === 'DEBUG') {
        console.error('[DEBUG] Configuration:', {
            apiBaseUrl: process.env.VITE_API_BASE_URL || `localhost:${process.env.PORT || 4000}`,
            loopCount,
            depth,
            academicLevel,
            logLevel: process.env.LOG_LEVEL,
            logFormat: process.env.LOG_FORMAT || 'text',
        });
    }
    let currentSubject = prompt;
    for (let step = 1; step <= loopCount; step += 1) {
        console.log('');
        console.log(`[Loop ${step}/${loopCount}] Researching: "${currentSubject}"`);
        try {
            const results = await (0, geminiService_node_js_1.performDeepResearch)(currentSubject, {
                depth,
                academicLevel,
                includePerspectives: true,
                includeCaseStudies: true,
                includeMethodology: false,
            });
            console.log('--- Summary ---');
            console.log(results.summary);
            if (results.sources.length > 0) {
                console.log('--- Sources ---');
                results.sources.forEach((source) => {
                    if (source.web) {
                        console.log(`- ${source.web.title}: ${source.web.uri}`);
                    }
                });
            }
            if (step === loopCount) {
                break;
            }
            let nextSubject;
            try {
                nextSubject = await (0, geminiService_node_js_1.findNextInquiry)(results.summary);
            }
            catch (error) {
                const message = typeof error === 'object' && error !== null && 'message' in error
                    ? String(error.message ?? '')
                    : undefined;
                if (message?.includes('Next inquiry was not provided by the research service.')) {
                    console.log('Next inquiry not provided. Ending loop early.');
                    break;
                }
                console.error('Failed to locate the next inquiry. Stopping loop.', error);
                break;
            }
            if (!nextSubject) {
                console.log('Next inquiry not provided. Ending loop early.');
                break;
            }
            console.log(`Next inquiry: "${nextSubject}"`);
            currentSubject = nextSubject;
        }
        catch (error) {
            console.error('An error occurred during research:', error);
            process.exit(1);
        }
    }
}
main();
