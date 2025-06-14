# Environment-Driven Script Mappings

## Overview
The ZK-PRET script mappings have been refactored to be **environment-driven** instead of hardcoded in the source code. This provides maximum flexibility for configuring which compiled JavaScript files are used for each verification type.

## Location of Mappings

### **Before (Hardcoded):**
Located in `src/services/zkPretClient.ts` at line 202-213:
```typescript
const toolScriptMap: Record<string, string> = {
  'get-BSDI-compliance-verification': 'BusinessStandardDataIntegrityVerificationTest.js', // HARDCODED
  // ... other hardcoded mappings
};
```

### **After (Environment-Driven):**
Now located in `.env` file and dynamically loaded:
```typescript
const toolScriptMap: Record<string, string> = {
  'get-BSDI-compliance-verification': process.env.ZK_PRET_SCRIPT_BSDI || 'BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js',
  // ... environment variables with fallback defaults
};
```

## Environment Variables for Script Mappings

Add these variables to your `.env` file to customize script mappings:

### **Core Verification Scripts**
```bash
# GLEIF Enhanced Verification
ZK_PRET_SCRIPT_GLEIF=GLEIFOptimMultiCompanyVerificationTestWithSign.js

# Corporate Registration Verification  
ZK_PRET_SCRIPT_CORPORATE_REG=CorporateRegistrationOptimMultiCompanyVerificationTestWithSign.js

# EXIM Verification
ZK_PRET_SCRIPT_EXIM=EXIMOptimMultiCompanyVerificationTestWithSign.js

# Composed Compliance Verification
ZK_PRET_SCRIPT_COMPOSED=ComposedRecursiveOptim3LevelVerificationTestWithSign.js
```

### **Business Integrity Scripts**
```bash
# Business Standard Data Integrity (BSDI) - THE KEY ONE!
ZK_PRET_SCRIPT_BSDI=BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js

# Business Process Integrity (BPI)
ZK_PRET_SCRIPT_BPI=BusinessProcessIntegrityVerificationFileTestWithSign.js
```

### **Risk & Liquidity Scripts**
```bash
# Advanced Risk Verification
ZK_PRET_SCRIPT_RISK_ADV=RiskLiquidityACTUSVerifierTest_adv_zk_WithSign.js

# Basel3 Risk Verification
ZK_PRET_SCRIPT_RISK_BASEL3=RiskLiquidityACTUSVerifierTest_basel3_Withsign.js
```

### **Composed Proof Scripts**
```bash
ZK_PRET_SCRIPT_COMPOSED_KYC=ComposedRecursiveOptim3LevelVerificationTestWithSign.js
ZK_PRET_SCRIPT_COMPOSED_FINANCIAL=ComposedRecurrsiveSCF3LevelProofs.js
ZK_PRET_SCRIPT_COMPOSED_INTEGRITY=ComposedRecursive3LevelVerificationTestWithSign.js
ZK_PRET_SCRIPT_COMPOSED_COMPREHENSIVE=ComposedRecursiveOptim3LevelVerificationTestWithSign.js
```

## Benefits of Environment-Driven Mappings

### **1. Flexibility**
- Switch between script versions without code changes
- Test different optimizations easily
- Deploy different configurations for different environments

### **2. Easy Script Updates**
```bash
# To switch BSDI to a different script:
ZK_PRET_SCRIPT_BSDI=BusinessStandardDataIntegrityVerificationTest.js

# To use a debug version:
ZK_PRET_SCRIPT_BSDI=BusinessStdIntegrityOptimMerkleVerificationTestWithSignDebug.js

# To use a newer optimized version:
ZK_PRET_SCRIPT_BSDI=BusinessStdIntegrityOptimMerkleV2VerificationTestWithSign.js
```

### **3. Environment-Specific Configurations**
```bash
# Development (.env.local)
ZK_PRET_SCRIPT_BSDI=BusinessStdIntegrityOptimMerkleVerificationTestWithSignDebug.js

# Production (.env)
ZK_PRET_SCRIPT_BSDI=BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js

# Testing (.env.test)
ZK_PRET_SCRIPT_BSDI=BusinessStandardDataIntegrityVerificationTest.js
```

### **4. Fallback Safety**
If environment variables are missing, the system automatically falls back to sensible defaults, ensuring the application continues to work.

## Your Specific BSDI Fix

The BSDI mapping is now correctly configured as:
```bash
ZK_PRET_SCRIPT_BSDI=BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js
```

This will execute:
```bash
node ./build/tests/with-sign/BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js ./src/data/scf/BILLOFLADING/actualBL1-VALID.json
```

## How to Change Script Mappings

1. **Edit your `.env` file**
2. **Modify the appropriate `ZK_PRET_SCRIPT_*` variable**
3. **Restart your application** (environment variables are loaded at startup)
4. **Verify the change** in the console logs during tool execution

## Console Output Enhancement

The system now shows which environment variable is being used:
```
=== STDIO TOOL EXECUTION ===
Tool Name: get-BSDI-compliance-verification
Script File: BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js
Environment Variable Used: ZK_PRET_SCRIPT_BSDI
============================
```

This makes it easy to debug and verify that the correct script mapping is being used.
