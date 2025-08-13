#!/usr/bin/env node

import { glob } from 'glob'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create a require function
const require = createRequire(import.meta.url)

// Resolve the path to the solidity package
const solidityPath = path.dirname(require.resolve('@openzeppelin/contracts/package.json'))

// Use Node's native glob (introduced in Node.js v16.13.0)
const files = await glob(`${solidityPath}/build/contracts/**/*.json`, {
  ignore: `${solidityPath}/build/contracts/**/*.dbg.json`,
  windowsPathsNoEscape: true, // Handle Windows paths correctly
})

execSync(
  `typechain --node16-modules --out-dir=./src --target=ethers-v6 ${files.join(' ')}`,
  { stdio: 'inherit' },
)
