/*

------------|---------|----------|---------|---------|---------------------
File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s   
------------|---------|----------|---------|---------|---------------------
All files   |   78.94 |    89.28 |   71.87 |   78.94 |                     
 boolean.ts |   91.66 |      100 |   68.75 |   91.66 | 40-41,46-47         
 types.ts   |   71.76 |       80 |      75 |   71.76 | 1,37-44,69-77,80-85 
------------|---------|----------|---------|---------|---------------------
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        0.162 s, estimated 1 s

*/

/*

| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |


*/

import { Convert } from './coverageTypes'
import { readFileSync } from 'fs'

interface ICoverageResult {
  total: number
  covered: number
}

interface IAggregateCoverageResults {
  statements: ICoverageResult
  branch: ICoverageResult
  functions: ICoverageResult
  lines: ICoverageResult
  uncovered: string
}

const generateUncoveredLines = (lineMap: { [key: string]: number | number[] }): string => {
  let sortedKeys = Object.keys(lineMap).sort((a, b) => (parseInt(a) > parseInt(b) ? 1 : -1))
  let results: string[] = []
  let currentRun = -1
  let runStart = -1
  for (const k of sortedKeys) {
    const value = lineMap[k]
    let num: number
    if (Array.isArray(value)) {
      num = value[0]
    } else {
      num = value
    }
    if (num === 0) {
      if (runStart === -1) {
        runStart = parseInt(k)
      }
      currentRun = parseInt(k)
    } else {
      if (runStart !== -1) {
        if (runStart === currentRun) {
          results.push(`${runStart + 1}`)
        } else {
          results.push(`${runStart + 1}-${currentRun + 1}`)
        }
      }
      runStart = -1
      currentRun = -1
    }
  }
  // finish the last one
  if (runStart !== -1) {
    if (runStart === currentRun) {
      results.push(`${runStart + 1}`)
    } else {
      results.push(`${runStart + 1}-${currentRun + 1}`)
    }
  }

  return results.join(', ')
}

const objCovered = (obj: { [key: string]: number }): { length: number; covered: number } => {
  let s = 0
  let c = 0
  for (let k in obj) {
    s++
    if (obj[k] !== 0) {
      c++
    }
  }
  return { length: s, covered: c }
}

const objCoveredBranch = (obj: { [key: string]: number[] }): { length: number; covered: number } => {
  let s = 0
  let c = 0
  for (let k in obj) {
    s++
    if (obj[k][0] !== 0) {
      c++
    }
  }
  return { length: s, covered: c }
}

// percent report
const pReport = (r: ICoverageResult, threshold: number): string => {
  return `${percent(r)} ${emoji(r, threshold)}`
}

const percent = (r: ICoverageResult): string => {
  return `${((r.covered / r.total) * 100).toFixed(2)}`
}

const emoji = (r: ICoverageResult, threshold: number): string => {
  const percent = (r.covered / r.total) * 100
  if (percent < threshold) {
    return '🔴'
  }
  // set yellow to be w/in 10% of threshold value
  const remainder = 100 - threshold
  const band = remainder * 0.1
  if (percent < threshold + band) {
    return '🟡'
  }
  return '🟢'
}

export const generateCoverageMarkdown = (reportPath: string, threshold: number): string => {
  const json = readFileSync(reportPath)
  // const report = JSON.parse(json)
  const report = Convert.toCoverageReport(String(json))

  const files: { [key: string]: IAggregateCoverageResults } = {}

  for (let key in report.coverageMap) {
    const coverageMap = report.coverageMap[key]
    const { length: totalStatements, covered: coveredStatements } = objCovered(coverageMap.s)
    const { length: totalBranches, covered: coveredBranches } = objCoveredBranch(coverageMap.b)
    const { length: totalFunctions, covered: coveredFunctions } = objCovered(coverageMap.f)

    files[key] = {
      statements: { total: totalStatements, covered: coveredStatements },
      branch: { total: totalBranches, covered: coveredBranches },
      functions: { total: totalFunctions, covered: coveredFunctions },
      lines: { total: totalStatements, covered: coveredStatements },
      uncovered: generateUncoveredLines(coverageMap.s)
    }

    // console.log(
    //   `${key} - statements ${coveredStatements} / ${totalStatements} == ${(
    //     (coveredStatements / totalStatements) *
    //     100
    //   ).toFixed(2)}%`
    // )
    // console.log(
    //   `${key} - branches ${coveredBranches} / ${totalBranches} == ${((coveredBranches / totalBranches) * 100).toFixed(
    //     2
    //   )}%`
    // )
    // console.log(
    //   `${key} - functions ${coveredFunctions} / ${totalFunctions} == ${(
    //     (coveredFunctions / totalFunctions) *
    //     100
    //   ).toFixed(2)}%`
    // )
  }

  const allResult: IAggregateCoverageResults = {
    statements: { total: 0, covered: 0 },
    branch: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 },
    uncovered: ''
  }

  for (let k in files) {
    const o = files[k]
    allResult.statements.total += o.statements.total
    allResult.statements.covered += o.statements.covered

    allResult.branch.total += o.branch.total
    allResult.branch.covered += o.branch.covered

    allResult.functions.total += o.functions.total
    allResult.functions.covered += o.functions.covered

    allResult.lines.total += o.statements.total
    allResult.lines.covered += o.statements.covered
  }
  // console.log(allResult)

  // console.log(
  //   `all - statements ${allResult.statements.covered} / ${allResult.statements.total} == ${(
  //     (allResult.statements.covered / allResult.statements.total) *
  //     100
  //   ).toFixed(2)}%`
  // )
  // console.log(
  //   `all - branch ${allResult.branch.covered} / ${allResult.branch.total} == ${(
  //     (allResult.branch.covered / allResult.branch.total) *
  //     100
  //   ).toFixed(2)}%`
  // )
  // console.log(
  //   `all - function ${allResult.functions.covered} / ${allResult.functions.total} == ${(
  //     (allResult.functions.covered / allResult.functions.total) *
  //     100
  //   ).toFixed(2)}%`
  // )

  let markdown = '| File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |'
  markdown += `\n|------------|---------:|----------:|---------:|---------:|---------------------|`
  markdown += `\n|All files| ${pReport(allResult.statements, threshold)} | ${pReport(
    allResult.branch,
    threshold
  )} |${pReport(allResult.functions, threshold)} |${pReport(allResult.statements, threshold)} | |`

  for (let k in files) {
    let r = files[k]
    let file = k.split('/')[k.split('/').length - 1]
    markdown += `\n| - ${file}| ${pReport(r.statements, threshold)} | ${pReport(r.branch, threshold)} |${pReport(
      r.functions,
      threshold
    )} |${pReport(r.statements, threshold)} | ${r.uncovered} |`
  }
  return markdown
}
