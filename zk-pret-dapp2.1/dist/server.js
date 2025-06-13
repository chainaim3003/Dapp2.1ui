import dotenv from 'dotenv';
dotenv.config(); // This line should be very early
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger.js';
import { zkPretClient } from './services/zkPretClient.js';
import { composedProofService } from './services/ComposedProofService.js';
// Import blockchain state service with error handling
let blockchainStateService = null;
try {
    const { blockchainStateService: service } = await import('./services/blockchainStateService.js');
    blockchainStateService = service;
    logger.info('Blockchain state service loaded successfully');
}
catch (error) {
    logger.warn('Blockchain state service failed to load', { error: error instanceof Error ? error.message : String(error) });
}
dotenv.config();
const app = express();
const server = createServer(app);
const ZK_PRET_WEB_APP_PORT = parseInt(process.env.ZK_PRET_WEB_APP_PORT || '3000', 10);
const ZK_PRET_WEB_APP_HOST = process.env.ZK_PRET_WEB_APP_HOST || 'localhost';
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/api/v1/health', async (_req, res) => {
    const zkPretStatus = await zkPretClient.healthCheck();
    res.json({
        status: zkPretStatus.connected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: { zkPretServer: zkPretStatus.connected }
    });
});
app.get('/api/v1/tools', async (_req, res) => {
    try {
        const tools = await zkPretClient.listTools();
        res.json({ tools, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to list tools' });
    }
});
app.post('/api/v1/tools/execute', async (req, res) => {
    try {
        const { toolName, parameters } = req.body;
        const result = await zkPretClient.executeTool(toolName, parameters);
        res.json({
            ...result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Execution failed' });
    }
});
// Blockchain State API Endpoints
// Get current blockchain state
app.get('/api/v1/blockchain/state', async (_req, res) => {
    try {
        if (!blockchainStateService) {
            return res.status(503).json({
                error: 'Blockchain state service not available',
                message: 'Service failed to load during server startup'
            });
        }
        const state = await blockchainStateService.getCurrentState();
        res.json({
            state,
            formatted: blockchainStateService.formatStateForDisplay(state),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger.error('Failed to get blockchain state', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to get blockchain state' });
    }
});
// Execute GLEIF verification with state tracking
app.post('/api/v1/tools/execute-with-state', async (req, res) => {
    try {
        const { toolName, parameters } = req.body;
        // Check if blockchain state service is available
        if (!blockchainStateService) {
            logger.warn('Blockchain state service not available, falling back to regular execution');
            // Fall back to regular execution without state tracking
            const result = await zkPretClient.executeTool(toolName, parameters);
            return res.json({
                ...result,
                message: 'Executed without state tracking (service unavailable)',
                timestamp: new Date().toISOString()
            });
        }
        // Check if this is a GLEIF-related tool that should have state tracking
        const stateTrackingTools = [
            'get-GLEIF-verification-with-sign',
            'get-Corporate-Registration-verification-with-sign',
            'get-EXIM-verification-with-sign'
        ];
        if (stateTrackingTools.includes(toolName)) {
            const { result, stateComparison } = await blockchainStateService.executeWithStateTracking(toolName, parameters, (tool, params) => zkPretClient.executeTool(tool, params));
            res.json({
                ...result,
                stateComparison: {
                    ...stateComparison,
                    beforeFormatted: blockchainStateService.formatStateForDisplay(stateComparison.before),
                    afterFormatted: blockchainStateService.formatStateForDisplay(stateComparison.after)
                },
                timestamp: new Date().toISOString()
            });
        }
        else {
            // For non-state-tracking tools, use regular execution
            const result = await zkPretClient.executeTool(toolName, parameters);
            res.json({
                ...result,
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        logger.error('Execution with state tracking failed', { error: error instanceof Error ? error.message : String(error) });
        // Try to fall back to regular execution
        try {
            const { toolName, parameters } = req.body;
            const result = await zkPretClient.executeTool(toolName, parameters);
            res.json({
                ...result,
                message: 'Fallback execution succeeded (state tracking failed)',
                timestamp: new Date().toISOString()
            });
        }
        catch (fallbackError) {
            res.status(500).json({ error: 'Both state tracking and fallback execution failed' });
        }
    }
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
                            timestamp: new Date().toISOString()
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
// Composed Proof API Endpoints
// Get all available composition templates
app.get('/api/v1/composed-proofs/templates', async (_req, res) => {
    try {
        const templates = composedProofService.getTemplates();
        const categories = [...new Set(templates.map(t => t.metadata?.category).filter(Boolean))];
        const response = {
            templates,
            categories,
            total: templates.length
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to get composition templates', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to get templates' });
    }
});
// Get a specific template by ID
app.get('/api/v1/composed-proofs/templates/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const template = composedProofService.getTemplate(templateId);
        if (!template) {
            return res.status(404).json({ error: `Template not found: ${templateId}` });
        }
        res.json(template);
    }
    catch (error) {
        logger.error('Failed to get template', {
            templateId: req.params.templateId,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ error: 'Failed to get template' });
    }
});
// Execute a composed proof
app.post('/api/v1/composed-proofs/execute', async (req, res) => {
    try {
        const composedProofRequest = req.body;
        // Validate request
        if (!composedProofRequest.templateId && !composedProofRequest.customComposition) {
            return res.status(400).json({
                error: 'Either templateId or customComposition must be provided'
            });
        }
        logger.info('Received composed proof execution request', {
            templateId: composedProofRequest.templateId,
            hasCustomComposition: !!composedProofRequest.customComposition,
            requestId: composedProofRequest.requestId
        });
        // Start execution (this will run asynchronously)
        const executionPromise = composedProofService.executeComposedProof(composedProofRequest);
        // For now, we'll wait for completion, but in production you might want to 
        // return immediately and provide status endpoints for long-running operations
        const result = await executionPromise;
        const response = {
            success: result.success,
            executionId: result.executionId,
            requestId: result.requestId,
            status: result.success ? 'COMPLETED' : 'FAILED',
            progressUrl: `/api/v1/composed-proofs/status/${result.executionId}`,
            resultUrl: `/api/v1/composed-proofs/results/${result.executionId}`
        };
        // Return the full result for now (in production, you might return just the response above)
        res.json({
            ...response,
            result: result
        });
    }
    catch (error) {
        logger.error('Composed proof execution failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Composed proof execution failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// Get execution status
app.get('/api/v1/composed-proofs/status/:executionId', async (req, res) => {
    try {
        const { executionId } = req.params;
        const execution = composedProofService.getExecution(executionId);
        if (!execution) {
            return res.status(404).json({ error: `Execution not found: ${executionId}` });
        }
        const response = {
            executionId: execution.id,
            status: execution.status,
            progress: {
                percentage: Math.round((execution.progress.completed + execution.progress.failed) / execution.progress.total * 100),
                currentPhase: execution.currentPhase,
                completedComponents: execution.results.filter(r => r.status === 'PASS').map(r => r.componentId),
                runningComponents: execution.components
                    .filter(c => execution.progress.running > 0)
                    .map(c => c.id),
                failedComponents: execution.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').map(r => r.componentId)
            },
            estimatedCompletion: execution.estimatedCompletion,
            partialResults: execution.results
        };
        res.json(response);
    }
    catch (error) {
        logger.error('Failed to get execution status', {
            executionId: req.params.executionId,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ error: 'Failed to get execution status' });
    }
});
// Get cache statistics
app.get('/api/v1/composed-proofs/cache/stats', async (_req, res) => {
    try {
        const stats = composedProofService.getCacheStats();
        res.json(stats);
    }
    catch (error) {
        logger.error('Failed to get cache stats', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to get cache stats' });
    }
});
// Clear cache
app.post('/api/v1/composed-proofs/cache/clear', async (_req, res) => {
    try {
        composedProofService.clearCache();
        res.json({ success: true, message: 'Cache cleared successfully' });
    }
    catch (error) {
        logger.error('Failed to clear cache', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});
// Add a new composition template
app.post('/api/v1/composed-proofs/templates', async (req, res) => {
    try {
        const template = req.body;
        composedProofService.addTemplate(template);
        res.json({ success: true, templateId: template.id });
    }
    catch (error) {
        logger.error('Failed to add template', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to add template' });
    }
});
// Bill of Lading Files API - Get available bill of lading files for data integrity verification
app.get('/api/v1/bill-of-lading-files', async (_req, res) => {
    try {
        const basePath = process.env.ZK_PRET_STDIO_PATH;
        const relativePath = process.env.ZK_PRET_DATA_BILLOFLADING;
        if (!relativePath || !basePath) {
            return res.status(400).json({
                error: 'Bill of Lading path not configured',
                relativePath: !!relativePath,
                basePath: !!basePath
            });
        }
        const fullPath = path.join(basePath, relativePath);
        logger.info('Reading bill of lading files', {
            relativePath,
            fullPath
        });
        // Check if directory exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                error: 'Bill of Lading directory not found',
                path: fullPath
            });
        }
        const files = fs.readdirSync(fullPath)
            .filter(f => f.endsWith('.json'))
            .sort(); // Sort alphabetically
        res.json({
            files,
            path: relativePath,
            dataType: 'DCSA-BillofLading-V3',
            count: files.length
        });
    }
    catch (error) {
        logger.error('Failed to read bill of lading files', {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Failed to read bill of lading directory',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
const startServer = async () => {
    await zkPretClient.initialize();
    server.listen(ZK_PRET_WEB_APP_PORT, ZK_PRET_WEB_APP_HOST, () => {
        logger.info(`ZK-PRET-WEB-APP started on http://${ZK_PRET_WEB_APP_HOST}:${ZK_PRET_WEB_APP_PORT}`);
    });
};
startServer();
//# sourceMappingURL=server.js.map