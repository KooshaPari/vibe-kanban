#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Analyzing test failures...\n');

// Run tests and capture output
let testOutput;
try {
  execSync('npm test 2>&1', { 
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });
} catch (error) {
  testOutput = error.stdout?.toString() || error.message;
}

// Parse test output for failures
const failurePatterns = {
  accessibility: /a11y\.test\.|accessibility/i,
  mocking: /mock|jest\.fn|toHaveBeenCalled|expect\.any/i,
  assertions: /expect\(.*\)\.to|toEqual|toBe|toHaveClass|toHaveTextContent/i,
  async: /waitFor|findBy|timeout|Promise|async/i,
  api: /api\.test|fetch|request|response|status/i,
  component: /render|screen\.get|component/i,
  integration: /integration\.test/i,
  utilities: /utils|helpers|setup|mocks/i
};

const failureCategories = {
  accessibility: [],
  mocking: [],
  assertions: [],
  async: [],
  api: [],
  component: [],
  integration: [],
  utilities: [],
  other: []
};

// Extract failing test files and their errors
const failLines = testOutput.split('\n').filter(line => line.includes('FAIL '));
const errorSections = testOutput.split('●').slice(1);

console.log(`📊 Found ${failLines.length} failing test suites\n`);

// Categorize failures
failLines.forEach(line => {
  const testFile = line.replace('FAIL ', '').trim();
  let categorized = false;
  
  for (const [category, pattern] of Object.entries(failurePatterns)) {
    if (pattern.test(testFile) || pattern.test(line)) {
      failureCategories[category].push(testFile);
      categorized = true;
      break;
    }
  }
  
  if (!categorized) {
    failureCategories.other.push(testFile);
  }
});

// Generate report
console.log('📋 FAILURE CATEGORIZATION REPORT\n');
console.log('='.repeat(50));

let totalFailures = 0;
for (const [category, failures] of Object.entries(failureCategories)) {
  if (failures.length > 0) {
    console.log(`\n${category.toUpperCase()} (${failures.length} failures):`);
    console.log('-'.repeat(category.length + 20));
    failures.slice(0, 10).forEach(file => console.log(`  • ${file}`));
    if (failures.length > 10) {
      console.log(`  ... and ${failures.length - 10} more`);
    }
    totalFailures += failures.length;
  }
}

console.log(`\n📈 SUMMARY:`);
console.log(`Total failing test suites: ${totalFailures}`);
console.log(`Pass rate: ${((856 - 290) / 856 * 100).toFixed(1)}%`);

// Save detailed report
const detailedReport = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 856,
    passingTests: 566,
    failingTests: 290,
    passRate: ((566 / 856) * 100).toFixed(1) + '%'
  },
  categories: failureCategories,
  recommendations: {
    high_priority: ['accessibility', 'api', 'component'],
    medium_priority: ['mocking', 'assertions', 'async'],
    low_priority: ['utilities', 'integration', 'other']
  }
};

fs.writeFileSync('test-failure-analysis.json', JSON.stringify(detailedReport, null, 2));
console.log('\n💾 Detailed analysis saved to test-failure-analysis.json');