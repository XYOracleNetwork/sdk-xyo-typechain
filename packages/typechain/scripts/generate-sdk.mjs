#!/usr/bin/env node

import glob from 'fast-glob'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create a require function
const require = createRequire(import.meta.url)

// Resolve the path to the solidity package
const solidityPath = path.dirname(require.resolve('@xyo-network/solidity/package.json'))

const files = glob.sync([
  `${solidityPath}/artifacts/contracts/**/*.json`,
  `!${solidityPath}/artifacts/contracts/**/*.dbg.json`,
])

execSync(
  `typechain --node16-modules --out-dir=./src --target=ethers-v6 ${files.join(' ')}`,
  { stdio: 'inherit' },
)
