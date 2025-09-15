import ANSI from '../core/ui/ansi.js';
import { CLITester, TestResult } from './cli-tester.js';

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

  async runTest(
    testName: string,
    testFn: () => Promise<TestResult>
  ): Promise<void> {
    process.stdout.write(`  ${testName}... `);

    try {
      const result = await testFn();
      this.results.push(result);

      if (result.passed) {
        console.log(`${ANSI.green}✓${ANSI.reset} (${result.duration}ms)`);
      } else {
        console.log(`${ANSI.red}✗${ANSI.reset} (${result.duration}ms)`);
        console.log(`    ${ANSI.red}${result.message}${ANSI.reset}`);
        if (result.error) {
          console.log(`    ${ANSI.yellow}${result.error.message}${ANSI.reset}`);
        }
      }
    } catch (error) {
      console.log(`${ANSI.red}✗${ANSI.reset} ERROR`);
      console.log(
        `    ${ANSI.red}${error instanceof Error ? error.message : String(error)}${ANSI.reset}`
      );
      this.results.push({
        passed: false,
        message: 'Test execution failed',
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  async runSuite(suite: TestSuite): Promise<void> {
    console.log(`\n${ANSI.bold}${suite.name}${ANSI.reset}`);

    for (const test of suite.tests) {
      await this.runTest(test.name, test.test);
    }
  }

  async runBasicTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // CLI Basic Tests
    results.push(await this.tester.testHelp());
    results.push(await this.tester.testVersion());
    results.push(
      await this.tester.runCommand('invalid-command', [], ['Unknown command'])
    );

    // Command tests (with quick exit)
    results.push(
      await this.tester.runCommand(
        'search-branches',
        ['\x03'],
        ['Search:', 'arrow keys']
      )
    );
    results.push(
      await this.tester.runCommand(
        'search-commits',
        ['\x03'],
        ['Search:', 'arrow keys']
      )
    );
    results.push(
      await this.tester.runCommand('list-aliases', [], ['git aliases'])
    );

    return results;
  }

  printSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`\n${ANSI.bold}Test Summary${ANSI.reset}`);
    console.log(`  Total: ${total}`);
    console.log(`  ${ANSI.green}Passed: ${passed}${ANSI.reset}`);

    if (failed > 0) {
      console.log(`  ${ANSI.red}Failed: ${failed}${ANSI.reset}`);
    }

    const avgDuration =
      this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`  Average duration: ${avgDuration.toFixed(0)}ms`);

    if (failed === 0) {
      console.log(
        `\n${ANSI.green}${ANSI.bold}🎉 All tests passed!${ANSI.reset}`
      );
    } else {
      console.log(
        `\n${ANSI.red}${ANSI.bold}❌ ${failed} test(s) failed${ANSI.reset}`
      );
      process.exit(1);
    }
  }
}

async function main() {
  console.log(
    `${ANSI.bold}${ANSI.green}🧪 Git CLI Utilities - E2E Tests${ANSI.reset}\n`
  );

  const runner = new TestRunner();

  // Basic CLI Tests
  await runner.runSuite({
    name: '📋 Basic CLI Functionality',
    tests: [
      {
        name: 'Help command shows usage information',
        test: () => runner.tester.testHelp(),
      },
      {
        name: 'Version command shows version',
        test: () => runner.tester.testVersion(),
      },
      {
        name: 'List aliases command works',
        test: () => runner.tester.testListAliases(),
      },
    ],
  });

  // Command-specific tests
  await runner.runSuite({
    name: '🔧 Command Functionality',
    tests: [
      {
        name: 'Init command can be cancelled',
        test: () => runner.tester.testInitCancel(),
      },
      {
        name: 'Search branches shows help',
        test: () =>
          runner.tester.runCommand(
            'search-branches --help',
            [],
            ['Interactive branch selection']
          ),
      },
      {
        name: 'Search commits shows help',
        test: () =>
          runner.tester.runCommand(
            'search-commits --help',
            [],
            ['Interactive commit selection']
          ),
      },
    ],
  });

  // Error handling tests
  await runner.runSuite({
    name: '⚠️  Error Handling',
    tests: [
      {
        name: 'Invalid command shows error',
        test: () =>
          runner.tester.runCommand('invalid-command', [], ['Unknown command']),
      },
      {
        name: 'No arguments shows help',
        test: () =>
          runner.tester.runCommand('', [], ['Usage:', 'CLI utilities']),
      },
    ],
  });

  runner.printSummary();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      `${ANSI.red}Test runner failed: ${error.message}${ANSI.reset}`
    );
    process.exit(1);
  });
}

export { TestRunner, CLITester };
