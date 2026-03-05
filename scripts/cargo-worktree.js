#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Set unique target directory for this worktree to avoid file lock conflicts
const targetDir = path.join(__dirname, '..', 'target');
process.env.CARGO_TARGET_DIR = targetDir;

// Add cargo to PATH
process.env.PATH = `${process.env.HOME}/.cargo/bin:${process.env.PATH}`;

// Execute cargo with the provided arguments
const args = process.argv.slice(2);

// Handle cargo-watch specifically (it's a separate binary, not a cargo subcommand)
let command;
if (args[0] === 'watch') {
  command = `cargo-watch ${args.slice(1).join(' ')}`;
} else {
  command = `cargo ${args.join(' ')}`;
}

try {
  execSync(command, { stdio: 'inherit', cwd: process.cwd() });
} catch (error) {
  process.exit(error.status || 1);
}
