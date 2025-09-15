import { CLITester, TestResult } from './cli-tester.js';
import { GitIntegrationTests } from './git-integration-tests.js';
import { PerformanceTests } from './performance-tests.js';

/**
 * CI-friendly test runner that skips interactive tests
 * Perfect for automated testing environments
 */
class CITestSuite {
  private tester: CLITester;
  private gitTests: GitIntegrationTests;
  private perfTests: PerformanceTests;

  constructor() {
    this.tester = new CLITester();
    this.gitTests = new GitIntegrationTests();
    this.perfTests = new PerformanceTests();
  }

  async runCITests(): Promise<void> {
    console.log('🤖 Running CI-friendly test suite\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // Non-interactive CLI Tests
    console.log('📋 Basic CLI Tests (Non-interactive)');
    console.log('─'.repeat(50));
    
    const basicTests = [
      { name: 'Help Command', test: () => this.tester.testHelp() },
      { name: 'Version Command', test: () => this.tester.testVersion() },
      { name: 'Invalid Command', test: () => this.tester.runCommand('invalid-command', [], ['Unknown command']) },
      { name: 'List Aliases', test: () => this.tester.runCommand('list-aliases', [], ['git aliases']) }
    ];

    for (const { name, test } of basicTests) {
      totalTests++;
      try {
        const result = await test();
        if (result.passed) {
          passedTests++;
          console.log(`✅ ${name}`);
        } else {
          failedTests++;
          console.log(`❌ ${name}: ${result.message}`);
        }
      } catch (error) {
        failedTests++;
        console.log(`❌ ${name}: Unexpected error: ${error}`);
      }
    }

    // Git Integration Tests (non-interactive)
    console.log('\n🔗 Git Integration Tests');
    console.log('─'.repeat(50));
    
    const gitTestMethods = [
      { name: 'Alias Creation', method: () => this.gitTests.testAliasCreation() },
      { name: 'List Aliases with Real Data', method: () => this.gitTests.testListAliasesWithRealData() }
    ];

    for (const test of gitTestMethods) {
      totalTests++;
      try {
        const result = await test.method();
        if (result.passed) {
          passedTests++;
          console.log(`✅ ${result.message}`);
        } else {
          failedTests++;
          console.log(`❌ ${result.message}`);
        }
      } catch (error) {
        failedTests++;
        console.log(`❌ ${test.name}: Unexpected error: ${error}`);
      }
    }

    // Performance Tests (non-interactive)
    console.log('\n⚡ Performance Tests');
    console.log('─'.repeat(50));
    
    const responseTests = [
      { name: 'Help Response Time', method: () => this.perfTests.testHelpResponseTime() },
      { name: 'Version Response Time', method: () => this.perfTests.testVersionResponseTime() }
    ];

    for (const test of responseTests) {
      totalTests++;
      try {
        const result = await test.method();
        if (result.passed) {
          passedTests++;
          console.log(`✅ ${result.message}`);
        } else {
          failedTests++;
          console.log(`❌ ${result.message}`);
        }
      } catch (error) {
        failedTests++;
        console.log(`❌ ${test.name}: Unexpected error: ${error}`);
      }
    }

    // Summary
    console.log('\n📊 CI Test Summary');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests === 0) {
      console.log('\n🎉 All CI tests passed!');
      process.exit(0);
    } else {
      console.log(`\n💥 ${failedTests} test(s) failed!`);
      process.exit(1);
    }
  }
}

// Run the CI tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new CITestSuite();
  testSuite.runCITests().catch(error => {
    console.error('CI test suite crashed:', error);
    process.exit(1);
  });
}

export { CITestSuite };