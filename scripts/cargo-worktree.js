#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');

// Set unique target directory for this worktree to avoid file lock conflicts
const targetDir = path.join(__dirname, '..', 'target');
process.env.CARGO_TARGET_DIR = targetDir;

// Add cargo to PATH
process.env.PATH = `${process.env.HOME}/.cargo/bin:${process.env.PATH}`;

// Execute cargo with the provided arguments
const args = process.argv.slice(2);

try {
  // Handle cargo-watch specifically (it's a separate binary, not a cargo subcommand).
  if (args[0] === 'watch') {
    execFileSync('cargo-watch', args.slice(1), {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } else {
    execFileSync('cargo', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  }
} catch (error) {
  process.exit(error.status || 1);
}
