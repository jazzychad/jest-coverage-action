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

import { Convert, ICoverageReport } from './coverageTypes'
import { readFileSync } from 'fs'

const json = readFileSync('report.json')
// const report = JSON.parse(json)
const report = Convert.toCoverageReport(String(json))

// const {
//   numFailedTestSuites,
//   numFailedTests,
//   numPassedTestSuites,
//   numPassedTests,
//   numPendingTestSuites,
//   numPendingTests,
//   numRuntimeErrorTestSuites,
//   numTodoTests,
//   numTotalTestSuites,
//   numTotalTests
// } = report

interface ICovereageResult {
  total: number
  covered: number
}

interface IAggregateCoverageResults {
  statements: ICovereageResult
  branch: ICovereageResult
  functions: ICovereageResult
  lines: ICovereageResult
  uncovered: string
}

const files: { [key: string]: IAggregateCoverageResults } = {}

// const objLength = (obj: { [key: string]: any }): number => {
//   let s = 0
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   for (let _ in obj) {
//     s++
//   }
//   return s
// }

// const objCovered = (obj: { [key: string]: number }): number => {
//   let s = 0
//   for (let k in obj) {
//     if (obj[k] !== 0) {
//       s++
//     }
//   }
//   return s
// }

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

for (let key in report.coverageMap) {
  console.log(key)
  const coverageMap = report.coverageMap[key]
  const { length: totalStatements, covered: coveredStatements } = objCovered(coverageMap.s)
  const { length: totalBranches, covered: coveredBranches } = objCoveredBranch(coverageMap.b)
  const { length: totalFunctions, covered: coveredFunctions } = objCovered(coverageMap.f)

  files[key] = {
    statements: { total: totalStatements, covered: coveredStatements },
    branch: { total: totalBranches, covered: coveredBranches },
    functions: { total: totalFunctions, covered: coveredFunctions },
    lines: { total: totalStatements, covered: coveredStatements },
    uncovered: ''
  }

  console.log(
    `${key} - statements ${coveredStatements} / ${totalStatements} == ${(
      (coveredStatements / totalStatements) *
      100
    ).toFixed(2)}%`
  )
  console.log(
    `${key} - branches ${coveredBranches} / ${totalBranches} == ${((coveredBranches / totalBranches) * 100).toFixed(
      2
    )}%`
  )
  console.log(
    `${key} - functions ${coveredFunctions} / ${totalFunctions} == ${(
      (coveredFunctions / totalFunctions) *
      100
    ).toFixed(2)}%`
  )
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
  console.log(o)
  allResult.statements.total += o.statements.total
  allResult.statements.covered += o.statements.covered

  allResult.branch.total += o.branch.total
  allResult.branch.covered += o.branch.covered

  allResult.functions.total += o.functions.total
  allResult.functions.covered += o.functions.covered

  allResult.lines.total += o.statements.total
  allResult.lines.covered += o.statements.covered
}
console.log(allResult)

console.log(
  `all - statements ${allResult.statements.covered} / ${allResult.statements.total} == ${(
    (allResult.statements.covered / allResult.statements.total) *
    100
  ).toFixed(2)}%`
)
console.log(
  `all - branch ${allResult.branch.covered} / ${allResult.branch.total} == ${(
    (allResult.branch.covered / allResult.branch.total) *
    100
  ).toFixed(2)}%`
)
console.log(
  `all - function ${allResult.functions.covered} / ${allResult.functions.total} == ${(
    (allResult.functions.covered / allResult.functions.total) *
    100
  ).toFixed(2)}%`
)

/*

| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |


*/

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

const perc = (r: ICovereageResult): string => {
  return `${((r.covered / r.total) * 100).toFixed(2)}`
}

let markdown = '| File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |'
markdown += `\n|------------|---------:|----------:|---------:|---------:|---------------------|`
markdown += `\n|All files| ${perc(allResult.statements)} | ${perc(allResult.branch)} |${perc(
  allResult.functions
)} |${perc(allResult.statements)} | |`

for (let k in files) {
  let r = files[k]
  let file = k.split('/')[k.split('/').length - 1]
  markdown += `\n| - ${file}| ${perc(r.statements)} | ${perc(r.branch)} |${perc(r.functions)} |${perc(
    r.statements
  )} | |`
}

console.log(markdown)
