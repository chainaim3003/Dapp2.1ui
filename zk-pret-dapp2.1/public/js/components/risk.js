class RiskComponent {
    constructor() {
        console.log('📌 RiskComponent constructor called');
        
        try {
            this.showStateChanges = false;
            console.log('📌 Starting RiskComponent render...');
            this.render();
            console.log('📌 RiskComponent render completed');
            
            console.log('📌 Setting up RiskComponent event listeners...');
            this.setupEventListeners();
            console.log('📌 RiskComponent event listeners setup completed');
            
            console.log('✅ RiskComponent constructor completed successfully');
        } catch (error) {
            console.error('❌ RiskComponent constructor failed:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    render() {
        console.log('🎨 RiskComponent render() called');
        
        const container = document.getElementById('risk-content');
        console.log('🗺 Container found:', !!container, container);
        
        if (!container) {
            console.error('❌ risk-content container not found!');
            return;
        }
        
        try {
            container.innerHTML = `
                <form id="risk-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Risk Model Type</label>
                        <select id="risk-model-select" name="riskModel" class="form-input">
                            <option value="Advanced Risk Model">Advanced Risk Model</option>
                            <option value="Basel III Compliance">Basel III Compliance</option>
                            <option value="Stablecoin Proof of Reserves">Stablecoin Proof of Reserves</option>
                        </select>
                        <div class="text-xs text-gray-500 mt-1">Select the risk assessment model for verification</div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Risk Threshold</label>
                        <input type="number" id="risk-threshold" name="threshold" class="form-input" 
                               placeholder="Enter threshold value" min="0" step="0.01" value="1.00">
                        <div class="text-xs text-gray-500 mt-1">Risk threshold value (supports decimal places)</div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">ACTUS Server URL</label>
                        <input type="url" id="actus-url" name="actusUrl" class="form-input" 
                               placeholder="Enter ACTUS server URL" value="${this.getDefaultActusUrl()}">
                        <div class="text-xs text-gray-500 mt-1">ACTUS framework server endpoint for risk calculations</div>
                    </div>
                    
                    <!-- Blockchain State Tracking Option -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="text-sm font-medium text-gray-900 mb-1">Blockchain State Tracking</h4>
                                <p class="text-xs text-gray-600">Show before/after blockchain state changes</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="risk-state-tracking-toggle" class="sr-only" ${this.showStateChanges ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-full">
                        <i class="fas fa-chart-line mr-2"></i>Generate Risk & Liquidity ZK Proof
                    </button>
                </form>
                
                <!-- Blockchain State Display Section -->
                <div id="risk-blockchain-state-section" class="mt-6 hidden">
                    <div class="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4 flex items-center">
                            <i class="fas fa-cube mr-2 text-blue-600"></i>
                            Blockchain State Changes
                        </h3>
                        
                        <!-- Loading State -->
                        <div id="risk-state-loading" class="hidden text-center py-8">
                            <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                                <span class="text-sm text-blue-700">Querying blockchain state...</span>
                            </div>
                        </div>
                        
                        <!-- State Comparison Display -->
                        <div id="risk-state-comparison" class="hidden">
                            <div class="grid md:grid-cols-2 gap-6">
                                <!-- Before State -->
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        <i class="fas fa-clock mr-2 text-gray-500"></i>
                                        Before Execution
                                    </h4>
                                    <div id="risk-before-state" class="space-y-2">
                                        <!-- Before state will be populated here -->
                                    </div>
                                </div>
                                
                                <!-- After State -->
                                <div class="bg-green-50 rounded-lg p-4">
                                    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        <i class="fas fa-check-circle mr-2 text-green-500"></i>
                                        After Execution
                                    </h4>
                                    <div id="risk-after-state" class="space-y-2">
                                        <!-- After state will be populated here -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Changes Summary -->
                            <div id="risk-changes-summary" class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 class="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                                    <i class="fas fa-list-ul mr-2"></i>
                                    Changes Detected
                                </h4>
                                <div id="risk-changes-list" class="space-y-1">
                                    <!-- Changes will be populated here -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- No Changes Display -->
                        <div id="risk-no-changes" class="hidden text-center py-6">
                            <div class="text-gray-500">
                                <i class="fas fa-equals text-2xl mb-2"></i>
                                <p class="text-sm">No blockchain state changes detected</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            console.log('✅ RiskComponent HTML content set successfully');
        } catch (error) {
            console.error('❌ Error setting RiskComponent HTML content:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // State tracking toggle
        document.getElementById('risk-state-tracking-toggle').addEventListener('change', (e) => {
            this.showStateChanges = e.target.checked;
            this.toggleStateSection();
        });
        
        // Form submission
        document.getElementById('risk-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const riskModel = document.getElementById('risk-model-select').value;
            const threshold = document.getElementById('risk-threshold').value;
            const actusUrl = document.getElementById('actus-url').value;
            
            // Validate required fields
            if (!riskModel) {
                if (window.app && window.app.showNotification) {
                    window.app.showNotification('Missing Information', 'Please select a risk model', 'error');
                }
                return;
            }
            
            if (!threshold) {
                if (window.app && window.app.showNotification) {
                    window.app.showNotification('Missing Information', 'Please enter a threshold value', 'error');
                }
                return;
            }
            
            if (!actusUrl) {
                if (window.app && window.app.showNotification) {
                    window.app.showNotification('Missing Information', 'Please enter ACTUS URL', 'error');
                }
                return;
            }
            
            // Validate threshold is a positive number
            const thresholdValue = parseFloat(threshold);
            if (isNaN(thresholdValue) || thresholdValue < 0) {
                if (window.app && window.app.showNotification) {
                    window.app.showNotification('Invalid Threshold', 'Please enter a valid positive number for threshold', 'error');
                }
                return;
            }
            
            // Map risk model to script name
            const scriptMapping = this.getScriptMapping(riskModel);
            
            const parameters = {
                riskModel: riskModel,
                scriptName: scriptMapping,
                threshold: thresholdValue,
                actusUrl: actusUrl
            };
            
            if (this.showStateChanges) {
                await this.executeWithStateTracking(parameters);
            } else {
                await this.executeRiskVerification(parameters);
            }
        });
    }
    
    getScriptMapping(riskModel) {
        const mappings = {
            'Advanced Risk Model': 'RiskLiquidityACTUSVerifierTest_adv_zk_WithSign.js',
            'Basel III Compliance': 'RiskLiquidityACTUSVerifierTest_basel3_Withsign.js',
            'Stablecoin Proof of Reserves': 'StablecoinProofOfReservesRiskVerificationTestWithSign.js'
        };
        
        return mappings[riskModel] || mappings['Advanced Risk Model'];
    }
    
    async executeRiskVerification(parameters) {
        try {
            console.log('Executing risk verification with parameters:', parameters);
            
            // Map risk model to correct tool name from zkPretClient
            let toolName;
            switch (parameters.riskModel) {
                case 'Advanced Risk Model':
                    toolName = 'get-RiskLiquidityACTUS-Verifier-Test_adv_zk';
                    break;
                case 'Basel III Compliance':
                    toolName = 'get-RiskLiquidityACTUS-Verifier-Test_Basel3_Withsign';
                    break;
                case 'Stablecoin Proof of Reserves':
                    toolName = 'get-StablecoinProofOfReservesRisk-verification-with-sign';
                    break;
                default:
                    toolName = 'get-RiskLiquidityACTUS-Verifier-Test_adv_zk';
            }
            
            // Prepare parameters for the tool (threshold and actusUrl)
            const toolParameters = {
                threshold: parameters.threshold,
                actusUrl: parameters.actusUrl
            };
            
            if (window.app && window.app.executeTool) {
                await window.app.executeTool(toolName, toolParameters);
            } else {
                console.error('App or executeTool method not available');
                if (window.app && window.app.showNotification) {
                    window.app.showNotification('Error', 'Application not properly initialized', 'error');
                }
            }
        } catch (error) {
            console.error('Error executing risk verification:', error);
            if (window.app && window.app.showNotification) {
                window.app.showNotification('Execution Error', error.message, 'error');
            }
        }
    }
    
    toggleStateSection() {
        const stateSection = document.getElementById('risk-blockchain-state-section');
        if (this.showStateChanges) {
            stateSection.classList.remove('hidden');
        } else {
            stateSection.classList.add('hidden');
        }
    }
    
    async executeWithStateTracking(parameters) {
        try {
            // Show state section and loading
            document.getElementById('risk-blockchain-state-section').classList.remove('hidden');
            document.getElementById('risk-state-loading').classList.remove('hidden');
            document.getElementById('risk-state-comparison').classList.add('hidden');
            document.getElementById('risk-no-changes').classList.add('hidden');
            
            // Map risk model to correct tool name from zkPretClient
            let toolName;
            switch (parameters.riskModel) {
                case 'Advanced Risk Model':
                    toolName = 'get-RiskLiquidityACTUS-Verifier-Test_adv_zk';
                    break;
                case 'Basel III Compliance':
                    toolName = 'get-RiskLiquidityACTUS-Verifier-Test_Basel3_Withsign';
                    break;
                case 'Stablecoin Proof of Reserves':
                    toolName = 'get-StablecoinProofOfReservesRisk-verification-with-sign';
                    break;
                default:
                    toolName = 'get-RiskLiquidityACTUS-Verifier-Test_adv_zk';
            }
            
            // Prepare parameters for the tool (threshold and actusUrl)
            const toolParameters = {
                threshold: parameters.threshold,
                actusUrl: parameters.actusUrl
            };
            
            // Execute tool with state tracking
            const response = await fetch('/api/v1/tools/execute-with-state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toolName: toolName,
                    parameters: toolParameters
                })
            });
            
            const result = await response.json();
            
            // Hide loading
            document.getElementById('risk-state-loading').classList.add('hidden');
            
            // Display results in the main execution results area
            if (window.app && window.app.displayExecutionResult) {
                window.app.displayExecutionResult({
                    success: result.success,
                    result: result.result,
                    executionTime: result.executionTime
                });
            }
            
            // Display state changes if available
            if (result.stateComparison) {
                this.displayStateComparison(result.stateComparison);
            } else {
                document.getElementById('risk-no-changes').classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Error executing with state tracking:', error);
            
            // Hide loading and show error
            document.getElementById('risk-state-loading').classList.add('hidden');
            document.getElementById('risk-no-changes').classList.remove('hidden');
            document.getElementById('risk-no-changes').innerHTML = `
                <div class="text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p class="text-sm">Failed to retrieve blockchain state changes</p>
                    <p class="text-xs mt-1">${error.message}</p>
                </div>
            `;
            
            // Still show the execution result if available
            if (window.app && window.app.showNotification) {
                window.app.showNotification('State Tracking Error', 'Failed to retrieve blockchain state changes', 'error');
            }
        }
    }
    
    displayStateComparison(stateComparison) {
        const { beforeFormatted, afterFormatted, changes, hasChanges } = stateComparison;
        
        if (!hasChanges) {
            document.getElementById('risk-no-changes').classList.remove('hidden');
            return;
        }
        
        // Show state comparison
        document.getElementById('risk-state-comparison').classList.remove('hidden');
        
        // Populate before state
        const beforeContainer = document.getElementById('risk-before-state');
        beforeContainer.innerHTML = Object.entries(beforeFormatted).map(([key, value]) => `
            <div class="flex justify-between text-xs">
                <span class="text-gray-600">${key}:</span>
                <span class="font-mono text-gray-800">${value}</span>
            </div>
        `).join('');
        
        // Populate after state
        const afterContainer = document.getElementById('risk-after-state');
        afterContainer.innerHTML = Object.entries(afterFormatted).map(([key, value]) => `
            <div class="flex justify-between text-xs">
                <span class="text-gray-600">${key}:</span>
                <span class="font-mono text-gray-800">${value}</span>
            </div>
        `).join('');
        
        // Populate changes summary
        const changesContainer = document.getElementById('risk-changes-list');
        const changedFields = changes.filter(change => change.changed);
        
        if (changedFields.length === 0) {
            changesContainer.innerHTML = '<p class="text-xs text-blue-700">No changes detected</p>';
        } else {
            changesContainer.innerHTML = changedFields.map(change => {
                const icon = this.getChangeIcon(change.type, change.before, change.after);
                const formattedBefore = this.formatValue(change.before);
                const formattedAfter = this.formatValue(change.after);
                
                return `
                    <div class="flex items-center text-xs text-blue-800">
                        <i class="${icon} mr-2 text-green-500"></i>
                        <span class="font-medium">${this.formatFieldName(change.field)}:</span>
                        <span class="ml-2 font-mono">${formattedBefore} → ${formattedAfter}</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    getChangeIcon(type, before, after) {
        if (type === 'boolean') {
            return after ? 'fas fa-toggle-on' : 'fas fa-toggle-off';
        } else if (type === 'number') {
            return after > before ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        } else {
            return 'fas fa-edit';
        }
    }
    
    formatValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        return String(value);
    }
    
    formatFieldName(field) {
        return field.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .replace(/^Is /, '');
    }
    
    getDefaultActusUrl() {
        // Default URL from .env configuration
        return 'http://98.84.165.146:8083/eventsBatch';
    }
}

window.RiskComponent = RiskComponent;
