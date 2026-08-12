#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { globSync } from 'glob'
import path from 'node:path'

function isContractArtifact(file) {
  const base = path.basename(file)
  if (base.endsWith('.dbg.json')) return false
  if (file.includes(`${path.sep}build-info${path.sep}`)) return false
  // Hardhat contract artifacts live in "<Name>.sol/<Name>.json"
  return file.includes('.sol' + path.sep) && base.endsWith('.json')
}

function generate(version, outDir) {
  const files = globSync(`../uniswap-solidity/artifacts/${version}/**/*.json`, {
    absolute: true,
  }).filter(isContractArtifact)

  if (files.length === 0) {
    console.error(`No Hardhat artifacts found under ../uniswap-solidity/artifacts/${version}`)
    process.exit(1)
  }

  console.log(`[generate:sdk-${version}] ${files.length} artifacts → ${outDir}`)
  execSync(
    `typechain --node16-modules --out-dir=${outDir} --target=ethers-v6 ${files.map((f) => JSON.stringify(f)).join(' ')}`,
    { stdio: 'inherit' },
  )
}

generate('v3', './src/v3')
generate('v4', './src/v4')
generate('v4-periphery', './src/v4-periphery')
