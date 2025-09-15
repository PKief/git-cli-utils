import { TestRunner } from './test-runner.js';
import { GitIntegrationTests } from './git-integration-tests.js';
import { PerformanceTests } from './performance-tests.js';

/**
 * Complete E2E test suite runner for git-cli-utils
 */
class E2ETestSuite {
  private basicTests: TestRunner;
  private gitTests: GitIntegrationTests;
  private perfTests: PerformanceTests;

  constructor() {
    this.basicTests = new TestRunner();
    this.gitTests = new GitIntegrationTests();
    this.perfTests = new PerformanceTests();
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Running E2E Test Suite for git-cli-utils\n');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // Basic CLI Tests
    console.log('📋 Basic CLI Tests');
    console.log('─'.repeat(50));

    const basicResults = await this.basicTests.runBasicTests();
    for (const result of basicResults) {
      totalTests++;
      if (result.passed) {
        passedTests++;
        console.log(`✅ ${result.message}`);
      } else {
        failedTests++;
        console.log(`❌ ${result.message}`);
        if (result.error) {
          console.log(`   Error: ${result.error.message}`);
        }
      }
    }

    // Git Integration Tests
    console.log('\n🔗 Git Integration Tests');
    console.log('─'.repeat(50));

    const gitTestMethods = [
      {
        name: 'Git Branch Integration',
        method: () => this.gitTests.testGitBranchIntegration(),
      },
      {
        name: 'Git Commit Integration',
        method: () => this.gitTests.testGitCommitIntegration(),
      },
      {
        name: 'Alias Creation',
        method: () => this.gitTests.testAliasCreation(),
      },
      {
        name: 'List Aliases with Real Data',
        method: () => this.gitTests.testListAliasesWithRealData(),
      },
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
          if (result.error) {
            console.log(`   Error: ${result.error.message}`);
          }
        }
      } catch (error) {
        failedTests++;
        console.log(`❌ ${test.name} - Unexpected error: ${error}`);
      }
    }

    // Performance Tests
    console.log('\n⚡ Performance Tests');
    console.log('─'.repeat(50));

    // Startup time tests
    const startupResults = await this.perfTests.testCommandStartupTime();
    for (const result of startupResults) {
      totalTests++;
      if (result.passed) {
        passedTests++;
        console.log(`✅ ${result.message}`);
      } else {
        failedTests++;
        console.log(`❌ ${result.message}`);
      }
    }

    // Response time tests
    const responseTests = [
      {
        name: 'Help Response Time',
        method: () => this.perfTests.testHelpResponseTime(),
      },
      {
        name: 'Version Response Time',
        method: () => this.perfTests.testVersionResponseTime(),
      },
      {
        name: 'Large Repository Handling',
        method: () => this.perfTests.testLargeRepositoryHandling(),
      },
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
          if (result.error) {
            console.log(`   Error: ${result.error.message}`);
          }
        }
      } catch (error) {
        failedTests++;
        console.log(`❌ ${test.name} - Unexpected error: ${error}`);
      }
    }

    // Summary
    console.log('\n📊 Test Summary');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    );

    if (failedTests === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log(`\n💥 ${failedTests} test(s) failed!`);
      process.exit(1);
    }
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new E2ETestSuite();
  testSuite.runAllTests().catch((error) => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

export { E2ETestSuite };
