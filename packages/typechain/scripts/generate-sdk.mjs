#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { glob } from 'glob'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create a require function
const require = createRequire(import.meta.url)

// Resolve the path to the solidity package
const solidityPath = path.dirname(require.resolve('@xyo-network/solidity/package.json'))

// First, delete any dbg.json files
const dbgFiles = await glob(`${solidityPath}/artifacts/contracts/**/*.dbg.json`)
for (const file of dbgFiles) {
  try {
    fs.unlinkSync(file)
  } catch (err) {
    console.error(`Error deleting ${file}: ${err.message}`)
  }
}

const includeFiles = `${solidityPath}/artifacts/contracts/**/*.json`

execSync(
  `typechain --node16-modules --out-dir=./src --target=ethers-v6 ${includeFiles}`,
  { stdio: 'inherit' },
)
