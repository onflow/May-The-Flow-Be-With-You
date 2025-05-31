# Blockchain Tests

This directory contains test suites for the Flow blockchain integration components.

## Test Structure

```
blockchain/tests/
├── README.md                     # This file
├── Counter_test.cdc             # Cadence unit tests for Counter contract
├── vrf-integration.test.js      # VRF integration and configuration tests
├── network-detection.test.js    # Network mismatch detection tests
└── [future test files]
```

## Test Categories

### 📜 **Cadence Contract Tests** (`.cdc` files)
- **Purpose**: Unit tests for smart contracts written in Cadence
- **Framework**: Flow Testing Framework
- **Run with**: `flow test`
- **Coverage**: Contract logic, edge cases, error handling

### 🔧 **Integration Tests** (`.test.js` files)
- **Purpose**: Test frontend-blockchain integration
- **Framework**: Node.js
- **Run with**: `node blockchain/tests/[test-file].test.js`
- **Coverage**: Configuration, network detection, service integration

## Available Tests

### 1. VRF Integration Test
```bash
node blockchain/tests/vrf-integration.test.js
```
**Tests:**
- ✅ Environment variable configuration
- ✅ Contract address resolution
- ✅ Network configuration validation
- ✅ Frontend integration status
- ✅ Error handling and fallbacks

### 2. Network Detection Test
```bash
node blockchain/tests/network-detection.test.js
```
**Tests:**
- ✅ Emulator vs Testnet vs Mainnet detection
- ✅ Network mismatch scenarios
- ✅ User experience flows
- ✅ Warning message accuracy

### 3. Counter Contract Test
```bash
flow test blockchain/tests/Counter_test.cdc
```
**Tests:**
- ✅ Contract deployment
- ✅ Counter increment functionality
- ✅ Access control

## Running All Tests

### Quick Test Suite
```bash
# Run all JavaScript integration tests
cd submissions/0x4d17d1068f79c7d0
node blockchain/tests/vrf-integration.test.js
node blockchain/tests/network-detection.test.js
```

### Full Test Suite (including Cadence)
```bash
# Run Cadence contract tests
flow test

# Run integration tests
node blockchain/tests/vrf-integration.test.js
node blockchain/tests/network-detection.test.js
```

## Test Results Interpretation

### ✅ **PASS** - Test successful
- Configuration is correct
- Logic works as expected
- Integration is functional

### ❌ **FAIL** - Test failed
- Check configuration
- Verify environment variables
- Review error messages

### ⚠️ **WARNING** - Partial success
- Some features may be degraded
- Fallbacks are working
- Manual verification recommended

## Adding New Tests

### For Cadence Contracts
1. Create `[ContractName]_test.cdc` file
2. Import the contract under test
3. Write test functions with `Test` prefix
4. Use Flow testing assertions

### For Integration Tests
1. Create `[feature-name].test.js` file
2. Follow the existing test structure
3. Include comprehensive test cases
4. Add clear pass/fail indicators

## Test Environment

### Required Environment Variables
```bash
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_MEMORY_VRF_CONTRACT=0xb8404e09b36b6623
NEXT_PUBLIC_MEMORY_ACHIEVEMENTS_CONTRACT=0xb8404e09b36b6623
```

### Network Configurations
- **Testnet**: Production deployment for hackathon
- **Emulator**: Local development and testing
- **Mainnet**: Future production deployment

## Continuous Integration

These tests are designed to be run in CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run Blockchain Tests
  run: |
    node blockchain/tests/vrf-integration.test.js
    node blockchain/tests/network-detection.test.js
    flow test
```

## Troubleshooting

### Common Issues
1. **Environment variables not set**: Check `.env.local`
2. **Network mismatch**: Verify Flow wallet network
3. **Contract not deployed**: Check deployment status
4. **FCL configuration**: Verify Flow configuration

### Debug Mode
Add `DEBUG=true` environment variable for verbose output:
```bash
DEBUG=true node blockchain/tests/vrf-integration.test.js
```
