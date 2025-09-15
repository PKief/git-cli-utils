import { CLITester, TestResult } from './cli-tester.js';
import ANSI from '../core/ui/ansi.js';

interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    test: () => Promise<TestResult>;
  }>;
}

class TestRunner {
  public tester: CLITester;
  private results: TestResult[] = [];

  constructor() {
    this.tester = new CLITester();
  }

  async runTest(testName: string, testFn: () => Promise<TestResult>): Promise<void> {
    process.stdout.write(`  ${testName}... `);
    
    try {
      const result = await testFn();
      this.results.push(result);
      
      if (result.passed) {
        console.log(`${ANSI.GREEN}✓${ANSI.RESET} (${result.duration}ms)`);
      } else {
        console.log(`${ANSI.RED}✗${ANSI.RESET} (${result.duration}ms)`);
        console.log(`    ${ANSI.RED}${result.message}${ANSI.RESET}`);
        if (result.error) {
          console.log(`    ${ANSI.YELLOW}${result.error.message}${ANSI.RESET}`);
        }
      }
    } catch (error) {
      console.log(`${ANSI.RED}✗${ANSI.RESET} ERROR`);
      console.log(`    ${ANSI.RED}${error instanceof Error ? error.message : String(error)}${ANSI.RESET}`);
      this.results.push({
        passed: false,
        message: 'Test execution failed',
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  async runSuite(suite: TestSuite): Promise<void> {
    console.log(`\n${ANSI.BOLD}${suite.name}${ANSI.RESET}`);
    
    for (const test of suite.tests) {
      await this.runTest(test.name, test.test);
    }
  }

  async runBasicTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // CLI Basic Tests
    results.push(await this.tester.testHelp());
    results.push(await this.tester.testVersion());
    results.push(await this.tester.runCommand('invalid-command', [], ['Unknown command']));
    
    // Command tests (with quick exit)
    results.push(await this.tester.runCommand('search-branches', ['\x03'], ['Search:', 'arrow keys']));
    results.push(await this.tester.runCommand('search-commits', ['\x03'], ['Search:', 'arrow keys']));
    results.push(await this.tester.runCommand('list-aliases', [], ['git aliases']));
    
    return results;
  }

  printSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    
    console.log(`\n${ANSI.BOLD}Test Summary${ANSI.RESET}`);
    console.log(`  Total: ${total}`);
    console.log(`  ${ANSI.GREEN}Passed: ${passed}${ANSI.RESET}`);
    
    if (failed > 0) {
      console.log(`  ${ANSI.RED}Failed: ${failed}${ANSI.RESET}`);
    }
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`  Average duration: ${avgDuration.toFixed(0)}ms`);
    
    if (failed === 0) {
      console.log(`\n${ANSI.GREEN}${ANSI.BOLD}🎉 All tests passed!${ANSI.RESET}`);
    } else {
      console.log(`\n${ANSI.RED}${ANSI.BOLD}❌ ${failed} test(s) failed${ANSI.RESET}`);
      process.exit(1);
    }
  }
}

async function main() {
  console.log(`${ANSI.BOLD}${ANSI.GREEN}🧪 Git CLI Utilities - E2E Tests${ANSI.RESET}\n`);
  
  const runner = new TestRunner();
  
  // Basic CLI Tests
  await runner.runSuite({
    name: '📋 Basic CLI Functionality',
    tests: [
      {
        name: 'Help command shows usage information',
        test: () => runner.tester.testHelp()
      },
      {
        name: 'Version command shows version',
        test: () => runner.tester.testVersion()
      },
      {
        name: 'List aliases command works',
        test: () => runner.tester.testListAliases()
      }
    ]
  });
  
  // Command-specific tests
  await runner.runSuite({
    name: '🔧 Command Functionality',
    tests: [
      {
        name: 'Init command can be cancelled',
        test: () => runner.tester.testInitCancel()
      },
      {
        name: 'Search branches shows help',
        test: () => runner.tester.runCommand('search-branches --help', [], ['Interactive branch selection'])
      },
      {
        name: 'Search commits shows help', 
        test: () => runner.tester.runCommand('search-commits --help', [], ['Interactive commit selection'])
      }
    ]
  });
  
  // Error handling tests
  await runner.runSuite({
    name: '⚠️  Error Handling',
    tests: [
      {
        name: 'Invalid command shows error',
        test: () => runner.tester.runCommand('invalid-command', [], ['Unknown command'])
      },
      {
        name: 'No arguments shows help',
        test: () => runner.tester.runCommand('', [], ['Usage:', 'CLI utilities'])
      }
    ]
  });
  
  runner.printSummary();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`${ANSI.RED}Test runner failed: ${error.message}${ANSI.RESET}`);
    process.exit(1);
  });
}

export { TestRunner, CLITester };