class RiskComponent {
    constructor() {
        console.log('📌 RiskComponent constructor called');
        
        try {
            this.currentRiskTab = 'basel3'; // Default to Basel III Compliance tab
            this.showStateChanges = false;
            this.actusUrl = 'http://98.84.165.146:8083/eventsBatch'; // Default fallback
            
            console.log('📌 Starting RiskComponent render...');
            this.render();
            console.log('📌 RiskComponent render completed');
            
            console.log('📌 Setting up RiskComponent event listeners...');
            this.setupEventListeners();
            console.log('📌 RiskComponent event listeners setup completed');
            
            // Initialize configuration
            this.initializeConfiguration();
            
            console.log('✅ RiskComponent constructor completed successfully');
        } catch (error) {
            console.error('❌ RiskComponent constructor failed:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    async initializeConfiguration() {
        // Load ACTUS URL from server environment
        await this.loadActusConfiguration();
        
        // Load Basel III config files
        await this.populateBasel3ConfigFiles();
    }

    async loadActusConfiguration() {
        try {
            console.log('🔄 Loading ACTUS configuration from server...');
            
            const response = await fetch('/api/v1/actus-config');
            if (response.ok) {
                const data = await response.json();
                this.actusUrl = data.actusUrl;
                
                // Update the input field if it exists
                const actusInput = document.getElementById('basel3-actus-url');
                if (actusInput) {
                    actusInput.value = this.actusUrl;
                }
                
                console.log(`✅ ACTUS URL loaded from ${data.source}:`, this.actusUrl);
            } else {
                console.log('⚠️ Failed to load ACTUS configuration, using default');
            }
        } catch (error) {
            console.error('Failed to load ACTUS configuration:', error);
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
                <!-- Risk & Liquidity Tab Navigation -->
                <div class="mb-6">
                    <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button class="risk-tab-btn flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors active" 
                                data-risk-tab="basel3">
                            <i class="fas fa-university mr-2"></i>Basel III Compliance
                        </button>
                        <button class="risk-tab-btn flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors" 
                                data-risk-tab="stablecoin">
                            <i class="fas fa-coins mr-2"></i>Stablecoin
                        </button>
                        <button class="risk-tab-btn flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors" 
                                data-risk-tab="advanced">
                            <i class="fas fa-chart-area mr-2"></i>Advanced
                        </button>
                    </div>
                </div>

                <!-- Basel III Compliance Tab -->
                <div id="basel3-risk-tab" class="risk-tab-content">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center mb-3">
                            <i class="fas fa-university text-blue-600 text-lg mr-3"></i>
                            <h3 class="text-lg font-semibold text-blue-800">Basel III Compliance Verification</h3>
                        </div>
                        <p class="text-blue-700 text-sm">
                            Verify compliance with Basel III regulatory requirements for capital adequacy, stress testing, and market liquidity risk.
                        </p>
                    </div>

                    <form id="basel3-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <strong>Basel III Configuration File</strong>
                            </label>
                            <select id="basel3-config-select" class="form-input">
                                <option value="">Select Basel III configuration file...</option>
                            </select>
                            <div class="text-xs text-gray-500 mt-1">Configuration files from the Basel III CONFIG directory</div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <strong>LCR Threshold</strong>
                                </label>
                                <input type="number" id="basel3-lcr-threshold" class="form-input" 
                                       placeholder="Enter LCR threshold" min="0" step="0.01" value="100">
                                <div class="text-xs text-gray-500 mt-1">Liquidity Coverage Ratio threshold</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <strong>NSFR Threshold</strong>
                                </label>
                                <input type="number" id="basel3-nsfr-threshold" class="form-input" 
                                       placeholder="Enter NSFR threshold" min="0" step="0.01" value="100">
                                <div class="text-xs text-gray-500 mt-1">Net Stable Funding Ratio threshold</div>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <strong>ACTUS Server URL</strong>
                            </label>
                            <input type="url" id="basel3-actus-url" class="form-input bg-gray-50" 
                                   value="${this.getDefaultActusUrl()}" readonly>
                            <div class="text-xs text-gray-500 mt-1">ACTUS framework server endpoint (configured)</div>
                        </div>
                        
                        <!-- Blockchain State Tracking Option -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="text-sm font-medium text-gray-900 mb-1">Blockchain State Tracking</h4>
                                    <p class="text-xs text-gray-600">Show before/after blockchain state changes</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="basel3-state-tracking-toggle" class="sr-only">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-full">
                            <i class="fas fa-university mr-2"></i>Generate Basel III Compliance ZK Proof
                        </button>
                    </form>
                </div>

                <!-- Stablecoin Tab -->
                <div id="stablecoin-risk-tab" class="risk-tab-content hidden">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center mb-3">
                            <i class="fas fa-coins text-green-600 text-lg mr-3"></i>
                            <h3 class="text-lg font-semibold text-green-800">Stablecoin Proof of Reserves</h3>
                        </div>
                        <p class="text-green-700 text-sm">
                            Verify stablecoin reserves and backing collateral through zero-knowledge proofs.
                        </p>
                    </div>

                    <form id="stablecoin-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <strong>Stablecoin Type</strong>
                            </label>
                            <select id="stablecoin-type-select" class="form-input">
                                <option value="USDC">USD Coin (USDC)</option>
                                <option value="USDT">Tether (USDT)</option>
                                <option value="DAI">MakerDAO (DAI)</option>
                                <option value="BUSD">Binance USD (BUSD)</option>
                                <option value="CUSTOM">Custom Stablecoin</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <strong>Reserve Threshold</strong>
                            </label>
                            <input type="number" id="stablecoin-threshold" class="form-input" 
                                   placeholder="Enter reserve threshold" min="0" step="0.01" value="1.00">
                            <div class="text-xs text-gray-500 mt-1">Minimum collateralization ratio (e.g., 1.00 = 100%)</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <strong>ACTUS Server URL</strong>
                            </label>
                            <input type="url" id="stablecoin-actus-url" class="form-input" 
                                   placeholder="Enter ACTUS server URL" value="${this.getDefaultActusUrl()}">
                            <div class="text-xs text-gray-500 mt-1">ACTUS framework server endpoint for reserve calculations</div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-full">
                            <i class="fas fa-coins mr-2"></i>Generate Stablecoin Proof of Reserves ZK Proof
                        </button>
                    </form>
                </div>

                <!-- Advanced Tab -->
                <div id="advanced-risk-tab" class="risk-tab-content hidden">
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center mb-3">
                            <i class="fas fa-chart-area text-purple-600 text-lg mr-3"></i>
                            <h3 class="text-lg font-semibold text-purple-800">Advanced Risk Model</h3>
                        </div>
                        <p class="text-purple-700 text-sm">
                            Advanced risk assessment models with custom parameters and sophisticated analytics.
                        </p>
                    </div>

                    <form id="advanced-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <strong>Risk Model Type</strong>
                            </label>
                            <select id="advanced-model-select" class="form-input">
                                <option value="VaR">Value at Risk (VaR)</option>
                                <option value="CVaR">Conditional Value at Risk (CVaR)</option>
                                <option value="ES">Expected Shortfall (ES)</option>
                                <option value="Monte_Carlo">Monte Carlo Simulation</option>
                                <option value="Black_Scholes">Black-Scholes Model</option>
                            </select>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Threshold</label>
                                <input type="number" id="advanced-threshold" class="form-input" 
                                       placeholder="0.05" min="0" step="0.001" value="0.05">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Confidence Level</label>
                                <input type="number" id="advanced-confidence" class="form-input" 
                                       placeholder="0.95" min="0.01" max="0.99" step="0.01" value="0.95">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <strong>ACTUS Server URL</strong>
                            </label>
                            <input type="url" id="advanced-actus-url" class="form-input" 
                                   placeholder="Enter ACTUS server URL" value="${this.getDefaultActusUrl()}">
                            <div class="text-xs text-gray-500 mt-1">ACTUS framework server endpoint for advanced calculations</div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-full">
                            <i class="fas fa-chart-area mr-2"></i>Generate Advanced Risk Model ZK Proof
                        </button>
                    </form>
                </div>
                
                <!-- Blockchain State Display Section (shared across all tabs) -->
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
        // Risk tab navigation
        document.querySelectorAll('.risk-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.riskTab || e.target.closest('.risk-tab-btn').dataset.riskTab;
                this.switchRiskTab(tabName);
            });
        });

        // Basel III form submission
        const basel3Form = document.getElementById('basel3-form');
        if (basel3Form) {
            basel3Form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.executeBasel3Verification();
            });
        }

        // Stablecoin form submission
        const stablecoinForm = document.getElementById('stablecoin-form');
        if (stablecoinForm) {
            stablecoinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.executeStablecoinVerification();
            });
        }

        // Advanced form submission
        const advancedForm = document.getElementById('advanced-form');
        if (advancedForm) {
            advancedForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.executeAdvancedVerification();
            });
        }

        // State tracking toggle for Basel III
        const basel3StateToggle = document.getElementById('basel3-state-tracking-toggle');
        if (basel3StateToggle) {
            basel3StateToggle.addEventListener('change', (e) => {
                this.showStateChanges = e.target.checked;
                this.toggleStateSection();
            });
        }
    }

    switchRiskTab(tabName) {
        console.log(`🔄 Switching to risk tab: ${tabName}`);
        
        // Update tab buttons
        document.querySelectorAll('.risk-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600', 'text-white');
            btn.classList.add('text-gray-600', 'hover:text-gray-800');
        });
        
        const targetBtn = document.querySelector(`[data-risk-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.remove('text-gray-600', 'hover:text-gray-800');
            targetBtn.classList.add('active', 'bg-blue-600', 'text-white');
        }
        
        // Update tab content
        document.querySelectorAll('.risk-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        const targetContent = document.getElementById(`${tabName}-risk-tab`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }
        
        this.currentRiskTab = tabName;
        console.log(`✅ Risk tab switched to: ${tabName}`);
    }

    async populateBasel3ConfigFiles() {
        try {
            console.log('🔄 Loading Basel III config files...');
            
            const response = await fetch('/api/v1/basel3-config-files');
            if (response.ok) {
                const data = await response.json();
                
                const configSelect = document.getElementById('basel3-config-select');
                if (configSelect) {
                    configSelect.innerHTML = '<option value="">Select Basel III configuration file...</option>';
                    data.files.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.textContent = file;
                        
                        // Default to basel3-VALID-1.json if available
                        if (file === 'basel3-VALID-1.json') {
                            option.selected = true;
                        }
                        
                        configSelect.appendChild(option);
                    });
                    console.log(`✅ Loaded ${data.files.length} Basel III config files`);
                    
                    // Log which file was selected as default
                    const selectedFile = configSelect.value;
                    if (selectedFile) {
                        console.log(`🎯 Default Basel III config file selected: ${selectedFile}`);
                    }
                }
            } else {
                console.log('⚠️ Failed to load Basel III config files:', await response.text());
                this.showNotification('Config Loading Error', 'Failed to load Basel III configuration files', 'error');
            }
        } catch (error) {
            console.error('Failed to load Basel III config files:', error);
            this.showNotification('Config Loading Error', 'Failed to load Basel III configuration files', 'error');
        }
    }

    async executeBasel3Verification() {
        const configFile = document.getElementById('basel3-config-select')?.value;
        const lcrThreshold = document.getElementById('basel3-lcr-threshold')?.value;
        const nsfrThreshold = document.getElementById('basel3-nsfr-threshold')?.value;
        const actusUrl = document.getElementById('basel3-actus-url')?.value;
        
        // Validate required fields
        if (!configFile) {
            this.showNotification('Missing Information', 'Please select a Basel III configuration file', 'error');
            return;
        }
        
        if (!lcrThreshold) {
            this.showNotification('Missing Information', 'Please enter an LCR threshold value', 'error');
            return;
        }
        
        if (!nsfrThreshold) {
            this.showNotification('Missing Information', 'Please enter an NSFR threshold value', 'error');
            return;
        }
        
        if (!actusUrl) {
            this.showNotification('Missing Information', 'ACTUS URL is required', 'error');
            return;
        }
        
        // Validate thresholds are positive numbers
        const lcrThresholdValue = parseFloat(lcrThreshold);
        if (isNaN(lcrThresholdValue) || lcrThresholdValue < 0) {
            this.showNotification('Invalid LCR Threshold', 'Please enter a valid positive number for LCR threshold', 'error');
            return;
        }
        
        const nsfrThresholdValue = parseFloat(nsfrThreshold);
        if (isNaN(nsfrThresholdValue) || nsfrThresholdValue < 0) {
            this.showNotification('Invalid NSFR Threshold', 'Please enter a valid positive number for NSFR threshold', 'error');
            return;
        }

        // Construct the file path for the command pattern
        const relativeConfigPath = `src/data/RISK/Basel3/CONFIG/${configFile}`;
        
        const parameters = {
            command: 'node ./build/tests/with-sign/RiskLiquidityBasel3OptimMerkleVerificationTestWithSign.js',
            lcrThreshold: lcrThresholdValue,
            nsfrThreshold: nsfrThresholdValue,
            actusUrl: actusUrl,
            configFilePath: relativeConfigPath
        };

        // Use the standard tool execution pattern like other components
        const toolName = 'get-RiskLiquidityBasel3Optim-Merkle-verification-with-sign';

        if (this.showStateChanges) {
            await this.executeWithStateTracking(toolName, parameters);
        } else {
            await this.executeRiskVerification(toolName, parameters);
        }
    }

    async executeStablecoinVerification() {
        const stablecoinType = document.getElementById('stablecoin-type-select')?.value;
        const threshold = document.getElementById('stablecoin-threshold')?.value;
        const actusUrl = document.getElementById('stablecoin-actus-url')?.value;
        
        // Validate required fields
        if (!stablecoinType) {
            this.showNotification('Missing Information', 'Please select a stablecoin type', 'error');
            return;
        }
        
        if (!threshold) {
            this.showNotification('Missing Information', 'Please enter a reserve threshold', 'error');
            return;
        }
        
        if (!actusUrl) {
            this.showNotification('Missing Information', 'Please enter ACTUS URL', 'error');
            return;
        }
        
        // Validate threshold is a positive number
        const thresholdValue = parseFloat(threshold);
        if (isNaN(thresholdValue) || thresholdValue < 0) {
            this.showNotification('Invalid Threshold', 'Please enter a valid positive number for threshold', 'error');
            return;
        }

        const parameters = {
            stablecoinType: stablecoinType,
            threshold: thresholdValue,
            actusUrl: actusUrl,
            typeOfNet: 'TESTNET'
        };

        const toolName = 'get-StablecoinProofOfReservesRisk-verification-with-sign';
        await this.executeRiskVerification(toolName, parameters);
    }

    async executeAdvancedVerification() {
        const modelType = document.getElementById('advanced-model-select')?.value;
        const threshold = document.getElementById('advanced-threshold')?.value;
        const confidence = document.getElementById('advanced-confidence')?.value;
        const actusUrl = document.getElementById('advanced-actus-url')?.value;
        
        // Validate required fields
        if (!modelType) {
            this.showNotification('Missing Information', 'Please select a risk model type', 'error');
            return;
        }
        
        if (!threshold) {
            this.showNotification('Missing Information', 'Please enter a threshold value', 'error');
            return;
        }
        
        if (!confidence) {
            this.showNotification('Missing Information', 'Please enter a confidence level', 'error');
            return;
        }
        
        if (!actusUrl) {
            this.showNotification('Missing Information', 'Please enter ACTUS URL', 'error');
            return;
        }
        
        // Validate threshold is a positive number
        const thresholdValue = parseFloat(threshold);
        if (isNaN(thresholdValue) || thresholdValue < 0) {
            this.showNotification('Invalid Threshold', 'Please enter a valid positive number for threshold', 'error');
            return;
        }
        
        // Validate confidence level
        const confidenceValue = parseFloat(confidence);
        if (isNaN(confidenceValue) || confidenceValue <= 0 || confidenceValue >= 1) {
            this.showNotification('Invalid Confidence', 'Please enter a confidence level between 0.01 and 0.99', 'error');
            return;
        }

        const parameters = {
            modelType: modelType,
            threshold: thresholdValue,
            confidence: confidenceValue,
            actusUrl: actusUrl,
            typeOfNet: 'TESTNET'
        };

        const toolName = 'get-RiskLiquidityACTUS-Verifier-Test_adv_zk';
        await this.executeRiskVerification(toolName, parameters);
    }

    async executeRiskVerification(toolName, parameters) {
        try {
            console.log('Executing risk verification with parameters:', { toolName, parameters });
            
            if (window.app && window.app.executeTool) {
                await window.app.executeTool(toolName, parameters);
            } else {
                console.error('App or executeTool method not available');
                this.showNotification('Error', 'Application not properly initialized', 'error');
            }
        } catch (error) {
            console.error('Error executing risk verification:', error);
            this.showNotification('Execution Error', error.message, 'error');
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
    
    async executeWithStateTracking(toolName, parameters) {
        try {
            // Show state section and loading
            document.getElementById('risk-blockchain-state-section').classList.remove('hidden');
            document.getElementById('risk-state-loading').classList.remove('hidden');
            document.getElementById('risk-state-comparison').classList.add('hidden');
            document.getElementById('risk-no-changes').classList.add('hidden');
            
            // Execute tool with state tracking
            const response = await fetch('/api/v1/tools/execute-with-state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toolName: toolName,
                    parameters: parameters
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
            
            this.showNotification('State Tracking Error', 'Failed to retrieve blockchain state changes', 'error');
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
        // Return the instance variable that was loaded from server environment
        return this.actusUrl || 'http://98.84.165.146:8083/eventsBatch';
    }

    showNotification(title, message, type) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(title, message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }
}

window.RiskComponent = RiskComponent;