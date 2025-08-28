#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { glob, globSync } from 'glob'
import fs from 'node:fs'

export function findFilesByGlob(cwd, pattern) {
  return globSync(pattern, { cwd, absolute: true })
}

// First, delete any dbg.json files
const dbgFiles = await glob('artifacts/contracts/**/*.dbg.json')
for (const file of dbgFiles) {
  try {
    fs.unlinkSync(file)
  } catch (err) {
    console.error(`Error deleting ${file}: ${err.message}`)
  }
}

const files = findFilesByGlob(process.cwd(), 'artifacts/contracts/**/*.json')
const filesToProcess = files.filter(file => !file.endsWith('.dbg.json'))

execSync(
  `typechain --node16-modules --out-dir=./src --target=ethers-v6 ${filesToProcess.join(' ')}`,
  { stdio: 'inherit' },
)
