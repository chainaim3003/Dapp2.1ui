import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger.js';
import { zkPretClient } from './services/zkPretClient.js';
// Simple UUID generator instead of importing uuid
function generateUUID() {
    return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
class AsyncJobManager {
    jobs = new Map();
    wss;
    isAsyncEnabled;
    constructor(wss) {
        this.wss = wss;
        this.isAsyncEnabled = process.env.ENABLE_ASYNC_JOBS === 'true';
        logger.info(`Async job management ${this.isAsyncEnabled ? 'enabled' : 'disabled'}`);
    }
    async startJob(jobId, toolName, parameters) {
        const job = {
            id: jobId,
            toolName,
            parameters,
            status: 'pending',
            startTime: new Date()
        };
        this.jobs.set(jobId, job);
        this.broadcastJobUpdate(job);
        // Start processing in background
        this.processJob(job);
        return job;
    }
    async processJob(job) {
        try {
            job.status = 'running';
            job.progress = 0;
            this.broadcastJobUpdate(job);
            // Real progress tracking instead of simulation
            logger.info(`Starting job ${job.id}: ${job.toolName}`);
            // Initial setup progress
            job.progress = 10;
            this.broadcastJobUpdate(job);
            // Execute the actual tool with real-time progress
            const startTime = Date.now();
            const result = await zkPretClient.executeTool(job.toolName, job.parameters);
            const executionTime = Date.now() - startTime;
            job.status = 'completed';
            job.result = {
                ...result,
                executionTimeMs: executionTime,
                jobId: job.id,
                completedAt: new Date().toISOString()
            };
            job.endTime = new Date();
            job.progress = 100;
            logger.info(`Job ${job.id} completed successfully in ${executionTime}ms`);
        }
        catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.endTime = new Date();
            logger.error(`Job ${job.id} failed:`, error);
        }
        this.broadcastJobUpdate(job);
    }
    broadcastJobUpdate(job) {
        const message = JSON.stringify({
            type: 'job_update',
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            result: job.result,
            error: job.error,
            timestamp: new Date().toISOString()
        });
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        });
    }
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    getAllJobs() {
        return Array.from(this.jobs.values());
    }
    getActiveJobs() {
        return Array.from(this.jobs.values()).filter(job => job.status === 'pending' || job.status === 'running');
    }
    clearCompletedJobs() {
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed') {
                this.jobs.delete(jobId);
            }
        }
    }
}
const app = express();
const server = createServer(app);
// WebSocket server setup
const wss = new WebSocketServer({ server });
const jobManager = new AsyncJobManager(wss);
const ZK_PRET_WEB_APP_PORT = parseInt(process.env.ZK_PRET_WEB_APP_PORT || '3000', 10);
const ZK_PRET_WEB_APP_HOST = process.env.ZK_PRET_WEB_APP_HOST || 'localhost';
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// WebSocket connection handling
wss.on('connection', (ws) => {
    logger.info('New WebSocket connection established');
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            logger.info('WebSocket message received:', data);
        }
        catch (error) {
            logger.error('Invalid WebSocket message:', error);
        }
    });
    ws.on('close', () => {
        logger.info('WebSocket connection closed');
    });
    // Send initial connection message
    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString()
    }));
});
// Health check endpoint
app.get('/api/v1/health', async (_req, res) => {
    const zkPretStatus = await zkPretClient.healthCheck();
    res.json({
        status: zkPretStatus.connected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
            zkPretServer: zkPretStatus.connected,
            asyncJobs: process.env.ENABLE_ASYNC_JOBS === 'true',
            websockets: wss.clients.size > 0
        },
        activeJobs: jobManager.getActiveJobs().length
    });
});
// Tools listing endpoint
app.get('/api/v1/tools', async (_req, res) => {
    try {
        const tools = await zkPretClient.listTools();
        res.json({
            tools,
            timestamp: new Date().toISOString(),
            asyncEnabled: process.env.ENABLE_ASYNC_JOBS === 'true'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to list tools' });
    }
});
// Traditional sync execution endpoint
app.post('/api/v1/tools/execute', async (req, res) => {
    try {
        const { toolName, parameters } = req.body;
        const result = await zkPretClient.executeTool(toolName, parameters);
        res.json({
            ...result,
            timestamp: new Date().toISOString(),
            mode: 'sync'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Execution failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Async job management endpoints
app.post('/api/v1/jobs/start', async (req, res) => {
    if (process.env.ENABLE_ASYNC_JOBS !== 'true') {
        return res.status(400).json({
            error: 'Async jobs are disabled',
            message: 'Set ENABLE_ASYNC_JOBS=true to use async execution'
        });
    }
    try {
        const { jobId, toolName, parameters } = req.body;
        const actualJobId = jobId || generateUUID();
        const job = await jobManager.startJob(actualJobId, toolName, parameters);
        res.json({
            jobId: job.id,
            status: job.status,
            timestamp: job.startTime.toISOString(),
            message: 'Job started successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to start job',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/v1/jobs/:jobId', (req, res) => {
    const job = jobManager.getJob(req.params.jobId);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
});
app.get('/api/v1/jobs', (_req, res) => {
    const jobs = jobManager.getAllJobs();
    res.json({
        jobs,
        total: jobs.length,
        active: jobManager.getActiveJobs().length,
        timestamp: new Date().toISOString()
    });
});
app.delete('/api/v1/jobs/completed', (_req, res) => {
    jobManager.clearCompletedJobs();
    res.json({
        message: 'Completed jobs cleared',
        timestamp: new Date().toISOString()
    });
});
// Composed Compliance Proof - Execute specific Node.js command
app.post('/api/v1/composed-compliance/execute', async (req, res) => {
    try {
        const { command, arguments: args, requestId } = req.body;
        logger.info('Received composed compliance execution request', {
            command,
            arguments: args,
            requestId
        });
        // Validate the command for security
        if (!command.includes('ComposedRecursiveOptim3LevelVerificationTestWithSign.js')) {
            return res.status(400).json({
                error: 'Invalid command - only ComposedRecursiveOptim3LevelVerificationTestWithSign.js is allowed'
            });
        }
        // Import child_process to execute the Node.js command
        const { spawn } = await import('child_process');
        const path = await import('path');
        // Get the ZK-PRET STDIO path from environment variable
        const zkPretStdioPath = process.env.ZK_PRET_STDIO_PATH;
        const zkPretBuildPath = process.env.ZK_PRET_STDIO_BUILD_PATH || './build/tests/with-sign';
        if (!zkPretStdioPath) {
            return res.status(500).json({
                error: 'ZK_PRET_STDIO_PATH not configured',
                details: 'Please set ZK_PRET_STDIO_PATH in your .env file'
            });
        }
        // Construct the full script path using environment variables
        const scriptPath = path.join(zkPretStdioPath, zkPretBuildPath, 'ComposedRecursiveOptim3LevelVerificationTestWithSign.js');
        const fullArgs = [scriptPath, ...args];
        logger.info('Executing composed compliance command', {
            zkPretStdioPath,
            zkPretBuildPath,
            scriptPath,
            fullArgs
        });
        // Execute the command
        return new Promise((resolve) => {
            const process = spawn('node', fullArgs, {
                cwd: zkPretStdioPath, // Use ZK-PRET directory as working directory
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            // Log the actual command being executed for debugging
            logger.info('Process spawn details', {
                command: 'node',
                args: fullArgs,
                cwd: zkPretStdioPath
            });
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            process.on('close', (code) => {
                logger.info('Process completed', {
                    requestId,
                    exitCode: code,
                    stdoutLength: stdout.length,
                    stderrLength: stderr.length
                });
                if (code === 0) {
                    logger.info('Composed compliance execution completed successfully', {
                        requestId,
                        outputLength: stdout.length
                    });
                    res.json({
                        success: true,
                        result: {
                            success: true,
                            executionId: requestId,
                            output: stdout,
                            exitCode: code,
                            command: `node ${fullArgs.join(' ')}`,
                            scriptPath: scriptPath,
                            timestamp: new Date().toISOString(),
                            mode: 'async-server'
                        }
                    });
                }
                else {
                    logger.error('Composed compliance execution failed', {
                        requestId,
                        exitCode: code,
                        stderr,
                        command: `node ${fullArgs.join(' ')}`
                    });
                    res.status(500).json({
                        success: false,
                        error: `Process exited with code ${code}`,
                        details: stderr || 'No error details available',
                        exitCode: code,
                        command: `node ${fullArgs.join(' ')}`,
                        scriptPath: scriptPath,
                        stdout: stdout || 'No output'
                    });
                }
            });
            process.on('error', (error) => {
                logger.error('Composed compliance process error', {
                    requestId,
                    error: error.message,
                    command: `node ${fullArgs.join(' ')}`,
                    scriptPath: scriptPath,
                    errorCode: error.code || 'UNKNOWN'
                });
                res.status(500).json({
                    success: false,
                    error: 'Process execution error',
                    details: error.message,
                    command: `node ${fullArgs.join(' ')}`,
                    scriptPath: scriptPath,
                    errorCode: error.code || 'UNKNOWN'
                });
            });
        });
    }
    catch (error) {
        logger.error('Composed compliance execution failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: 'Composed compliance execution failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// Process Files API - Get available BPMN files for file picker
app.get('/api/v1/process-files/:processType/:fileType', async (req, res) => {
    try {
        const { processType, fileType } = req.params;
        const basePath = process.env.ZK_PRET_STDIO_PATH;
        // Validate process type and file type
        if (!['SCF', 'DVP', 'STABLECOIN'].includes(processType)) {
            return res.status(400).json({ error: 'Invalid process type' });
        }
        if (!['expected', 'actual'].includes(fileType.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid file type. Must be "expected" or "actual"' });
        }
        const envVar = `ZK_PRET_DATA_PROCESS_PATH_${processType}_${fileType.toUpperCase()}`;
        const relativePath = process.env[envVar];
        if (!relativePath || !basePath) {
            return res.status(400).json({
                error: 'Path not configured',
                envVar,
                relativePath,
                basePath: !!basePath
            });
        }
        const fullPath = path.join(basePath, relativePath);
        logger.info('Reading process files', {
            processType,
            fileType,
            envVar,
            relativePath,
            fullPath
        });
        // Check if directory exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                error: 'Directory not found',
                path: fullPath
            });
        }
        const files = fs.readdirSync(fullPath)
            .filter(f => f.endsWith('.bpmn'))
            .sort(); // Sort alphabetically
        res.json({
            files,
            path: relativePath,
            processType,
            fileType,
            count: files.length
        });
    }
    catch (error) {
        logger.error('Failed to read process files', {
            error: error instanceof Error ? error.message : String(error),
            processType: req.params.processType,
            fileType: req.params.fileType
        });
        res.status(500).json({
            error: 'Failed to read directory',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// Enhanced status endpoint with job information
app.get('/api/v1/status', (_req, res) => {
    res.json({
        server: 'ZK-PRET-WEB-APP',
        version: '1.0.0',
        mode: process.env.NODE_ENV || 'development',
        asyncEnabled: process.env.ENABLE_ASYNC_JOBS === 'true',
        websocketConnections: wss.clients.size,
        activeJobs: jobManager.getActiveJobs().length,
        totalJobs: jobManager.getAllJobs().length,
        features: {
            async_jobs: process.env.ENABLE_ASYNC_JOBS === 'true',
            websockets: process.env.ENABLE_WEBSOCKETS === 'true',
            job_persistence: process.env.ENABLE_JOB_PERSISTENCE === 'true',
            browser_notifications: process.env.ENABLE_BROWSER_NOTIFICATIONS === 'true',
            job_recovery: process.env.ENABLE_JOB_RECOVERY === 'true',
            enhanced_ui: process.env.ENABLE_ENHANCED_UI === 'true',
            polling_fallback: process.env.ENABLE_POLLING_FALLBACK === 'true'
        },
        timestamp: new Date().toISOString()
    });
});
const startServer = async () => {
    await zkPretClient.initialize();
    server.listen(ZK_PRET_WEB_APP_PORT, ZK_PRET_WEB_APP_HOST, () => {
        logger.info(`ZK-PRET-WEB-APP started on http://${ZK_PRET_WEB_APP_HOST}:${ZK_PRET_WEB_APP_PORT}`);
        logger.info(`WebSocket server running on ws://${ZK_PRET_WEB_APP_HOST}:${ZK_PRET_WEB_APP_PORT}`);
        logger.info(`Async features: ${process.env.ENABLE_ASYNC_JOBS === 'true' ? 'ENABLED' : 'DISABLED'}`);
    });
};
startServer();
//# sourceMappingURL=async-server.js.map