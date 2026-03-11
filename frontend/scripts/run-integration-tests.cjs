#!/usr/bin/env node

const { spawn } = require('child_process');

const TEST_SUITES = {
  pages: 'src/__tests__/integration/pages',
  router: 'src/__tests__/integration/router', 
  context: 'src/__tests__/integration/context',
  api: 'src/__tests__/integration/api',
  forms: 'src/__tests__/integration/forms',
  all: 'src/__tests__/integration'
};

function runTests(suite, options = {}) {
  const args = ['test'];
  
  if (suite && TEST_SUITES[suite]) {
    args.push('--testPathPattern', TEST_SUITES[suite]);
  }
  
  if (options.coverage) {
    args.push('--coverage');
  }
  
  if (options.watch) {
    args.push('--watch');
  }
  
  if (options.verbose) {
    args.push('--verbose');
  }
  
  if (options.pattern) {
    args.push('--testNamePattern', options.pattern);
  }

  if (options.ci) {
    args.push('--ci', '--coverage', '--watchAll=false');
  }

  console.log(`🧪 Running integration tests${suite ? ` for ${suite}` : ''}...`);
  console.log(`📝 Command: npm ${args.join(' ')}\n`);

  const child = spawn('npm', args, {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Tests completed successfully!');
    } else {
      console.log('\n❌ Tests failed!');
      process.exit(code);
    }
  });

  child.on('error', (error) => {
    console.error('❌ Failed to run tests:', error);
    process.exit(1);
  });
}

function showHelp() {
  console.log(`
🧪 Integration Test Runner

Usage: npm run test:integration [suite] [options]
   or: node scripts/run-integration-tests.js [suite] [options]

Test Suites:
  pages     - Page component integration tests
  router    - Router and navigation tests  
  context   - Context provider tests
  api       - API integration tests
  forms     - Form submission workflow tests
  all       - All integration tests (default)

Options:
  --coverage     Generate coverage report
  --watch        Watch mode for development
  --verbose      Verbose test output
  --pattern=X    Run tests matching pattern X
  --ci           CI mode (coverage + no watch)
  --help         Show this help

Examples:
  npm run test:integration pages
  npm run test:integration api --coverage
  npm run test:integration forms --watch
  npm run test:integration --pattern="Project Creation"
  npm run test:integration --ci

Available test files:
`);

  Object.entries(TEST_SUITES).forEach(([suite, suitePath]) => {
    if (suite !== 'all') {
      console.log(`  ${suite.padEnd(10)} ${suitePath}`);
    }
  });

  console.log(`
📊 Coverage thresholds: 70% (branches, functions, lines, statements)
📝 For more details, see: src/__tests__/integration/README.md
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const suite = args.find(arg => !arg.startsWith('--')) || 'all';
const options = {
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  verbose: args.includes('--verbose'),
  ci: args.includes('--ci'),
  pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1]
};

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (suite !== 'all' && !TEST_SUITES[suite]) {
  console.error(`❌ Unknown test suite: ${suite}`);
  console.error(`Available suites: ${Object.keys(TEST_SUITES).join(', ')}`);
  process.exit(1);
}

runTests(suite, options);
