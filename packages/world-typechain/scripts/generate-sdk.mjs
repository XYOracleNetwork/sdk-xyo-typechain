#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { globSync } from 'glob'
import path from 'node:path'

function isContractArtifact(file) {
  const base = path.basename(file)
  if (base.endsWith('.dbg.json')) return false
  if (file.includes(`${path.sep}build-info${path.sep}`)) return false
  return file.includes('.sol' + path.sep) && base.endsWith('.json')
}

const files = globSync('../world-solidity/artifacts/**/*.json', {
  absolute: true,
}).filter(isContractArtifact)

if (files.length === 0) {
  console.error('No Hardhat artifacts found under ../world-solidity/artifacts')
  process.exit(1)
}

console.log(`[generate:sdk] ${files.length} artifacts → ./src`)
execSync(
  `typechain --node16-modules --out-dir=./src --target=ethers-v6 ${files.map((f) => JSON.stringify(f)).join(' ')}`,
  { stdio: 'inherit' },
)
