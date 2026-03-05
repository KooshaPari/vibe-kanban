#!/usr/bin/env node

/**
 * Test validation script for form and dialog components
 * Checks that all required test files exist and have proper structure
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_TEST_FILES = [
  'src/components/tasks/__tests__/TaskFormDialog.test.tsx',
  'src/components/__tests__/GitHubLoginDialog.test.tsx',
  'src/components/__tests__/DisclaimerDialog.test.tsx',
  'src/components/__tests__/OnboardingDialog.test.tsx',
  'src/components/__tests__/PrivacyOptInDialog.test.tsx',
];

const REQUIRED_TEST_SECTIONS = {
  'TaskFormDialog.test.tsx': [
    'Create Mode',
    'Edit Mode',
    'Keyboard Shortcuts',
    'Form Reset and Cancel',
    'Loading States',
    'Form Validation',
  ],
  'GitHubLoginDialog.test.tsx': [
    'Unauthenticated State',
    'Device Authorization Flow',
    'Authenticated State',
    'Loading State',
  ],
  'DisclaimerDialog.test.tsx': [
    'Rendering',
    'Interaction',
    'Dialog Behavior',
    'Accessibility',
  ],
  'OnboardingDialog.test.tsx': [
    'Rendering',
    'Executor Selection',
    'Editor Selection',
    'Form Validation',
    'Form Submission',
  ],
  'PrivacyOptInDialog.test.tsx': [
    'Rendering',
    'GitHub Authentication State',
    'User Interaction',
    'Data Collection Details',
  ],
};

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing test file: ${filePath}`);
    return false;
  }
  console.log(`✅ Found test file: ${filePath}`);
  return true;
}

function checkTestSections(filePath, requiredSections) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const fileName = path.basename(filePath);
  
  let allSectionsFound = true;
  requiredSections.forEach(section => {
    if (content.includes(`describe('${section}'`)) {
      console.log(`  ✅ Found section: ${section}`);
    } else {
      console.error(`  ❌ Missing section: ${section}`);
      allSectionsFound = false;
    }
  });
  
  return allSectionsFound;
}

function validateTestStructure() {
  console.log('🧪 Validating test file structure...\n');
  
  let allValid = true;
  
  // Check all required files exist
  REQUIRED_TEST_FILES.forEach(filePath => {
    if (!checkFileExists(filePath)) {
      allValid = false;
    }
  });
  
  console.log('\n📋 Checking test sections...\n');
  
  // Check test sections
  Object.entries(REQUIRED_TEST_SECTIONS).forEach(([fileName, sections]) => {
    const filePath = REQUIRED_TEST_FILES.find(path => path.includes(fileName));
    if (filePath) {
      console.log(`Checking ${fileName}:`);
      if (!checkTestSections(filePath, sections)) {
        allValid = false;
      }
      console.log('');
    }
  });
  
  return allValid;
}

function checkJestConfig() {
  console.log('⚙️  Checking Jest configuration...\n');
  
  const jestConfigPath = path.join(__dirname, 'jest.config.js');
  const jestConfigCjsPath = path.join(__dirname, 'jest.config.cjs');
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  let configValid = true;
  
  if (!fs.existsSync(jestConfigPath) && !fs.existsSync(jestConfigCjsPath)) {
    console.error('❌ Missing jest.config.js or jest.config.cjs');
    configValid = false;
  } else {
    const configFile = fs.existsSync(jestConfigPath) ? 'jest.config.js' : 'jest.config.cjs';
    console.log(`✅ Found ${configFile}`);
  }
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Missing package.json');
    configValid = false;
  } else {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    const requiredDependencies = [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'jest',
      'jest-environment-jsdom',
    ];
    
    requiredDependencies.forEach(dep => {
      if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        console.log(`✅ Found dependency: ${dep}`);
      } else {
        console.error(`❌ Missing dependency: ${dep}`);
        configValid = false;
      }
    });
    
    if (packageJson.scripts && packageJson.scripts.test) {
      console.log('✅ Found test script in package.json');
    } else {
      console.error('❌ Missing test script in package.json');
      configValid = false;
    }
  }
  
  return configValid;
}

function main() {
  console.log('🚀 Form and Dialog Component Test Validation\n');
  console.log('='.repeat(50) + '\n');
  
  const structureValid = validateTestStructure();
  const configValid = checkJestConfig();
  
  console.log('\n' + '='.repeat(50));
  
  if (structureValid && configValid) {
    console.log('🎉 All tests are properly configured!\n');
    console.log('Run the following commands to execute tests:');
    console.log('  npm test                 # Run all tests');
    console.log('  npm run test:watch       # Run tests in watch mode');
    console.log('  npm run test:coverage    # Run tests with coverage');
    process.exit(0);
  } else {
    console.log('❌ Some tests are missing or misconfigured.\n');
    console.log('Please check the errors above and fix the issues.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTestStructure,
  checkJestConfig,
  REQUIRED_TEST_FILES,
  REQUIRED_TEST_SECTIONS,
};