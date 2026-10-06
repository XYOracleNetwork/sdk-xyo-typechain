#!/usr/bin/env node

import fs from 'node:fs'

import { glob, globSync } from 'glob'
import { detectInputsRoot, runTypeChain } from 'typechain'

import { normalizeGeneratedImports } from './normalize-generated-imports.mjs'

function findFilesByGlob(cwd, pattern) {
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

if (filesToProcess.length === 0) throw new Error('No files passed.')

const result = await runTypeChain({
  cwd: process.cwd(),
  target: 'ethers-v6',
  outDir: './src',
  allFiles: filesToProcess,
  filesToProcess,
  inputDir: detectInputsRoot(filesToProcess),
  flags: {
    alwaysGenerateOverloads: false,
    discriminateTypes: false,
    tsNocheck: false,
    node16Modules: true,
    environment: undefined,
  },
})
console.log(`Successfully generated ${result.filesGenerated} typings!`)

normalizeGeneratedImports('./src')
