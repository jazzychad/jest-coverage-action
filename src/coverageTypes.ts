// To parse this data:
//
//   import { Convert, CoverageReport } from "./file";
//
//   const coverageReport = Convert.toCoverageReport(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface ICoverageReport {
  numFailedTestSuites: number
  numFailedTests: number
  numPassedTestSuites: number
  numPassedTests: number
  numPendingTestSuites: number
  numPendingTests: number
  numRuntimeErrorTestSuites: number
  numTodoTests: number
  numTotalTestSuites: number
  numTotalTests: number
  openHandles: any[]
  snapshot: ISnapshot
  startTime: number
  success: boolean
  testResults: ITestResult[]
  wasInterrupted: boolean
  coverageMap: { [key: string]: ICoverageMap }
}

export interface ICoverageMap {
  path: string
  all: boolean
  statementMap: { [key: string]: IRange }
  s: { [key: string]: number }
  branchMap: { [key: string]: IBranchMap }
  b: { [key: string]: number[] }
  fnMap: { [key: string]: IFnMap }
  f: { [key: string]: number }
}

export interface IBranchMap {
  type: Type
  line: number
  loc: IRange
  locations: IRange[]
}

export interface IRange {
  start: ILocation
  end: ILocation
}

export interface ILocation {
  column: number
  line: number
}

export enum Type {
  Branch = 'branch'
}

export interface IFnMap {
  name: string
  decl: IRange
  loc: IRange
  line: number
}

export interface ISnapshot {
  added: number
  didUpdate: boolean
  failure: boolean
  filesAdded: number
  filesRemoved: number
  filesRemovedList: any[]
  filesUnmatched: number
  filesUpdated: number
  matched: number
  total: number
  unchecked: number
  uncheckedKeysByFile: any[]
  unmatched: number
  updated: number
}

export interface ITestResult {
  assertionResults: IAssertionResult[]
  endTime: number
  message: string
  name: string
  startTime: number
  status: string
  summary: string
}

export interface IAssertionResult {
  ancestorTitles: string[]
  duration: number
  failureDetails: any[]
  failureMessages: any[]
  fullName: string
  invocations: number
  location: ILocation
  numPassingAsserts: number
  retryReasons: any[]
  status: string
  title: string
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toCoverageReport(json: string): ICoverageReport {
    return cast(JSON.parse(json), r('CoverageReport'))
  }

  public static coverageReportToJson(value: ICoverageReport): string {
    return JSON.stringify(uncast(value, r('CoverageReport')), null, 2)
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
  const prettyTyp = prettyTypeName(typ)
  const parentText = parent ? ` on ${parent}` : ''
  const keyText = key ? ` for key "${key}"` : ''
  throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`)
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`
    } else {
      return `one of [${typ
        .map(a => {
          return prettyTypeName(a)
        })
        .join(', ')}]`
    }
  } else if (typeof typ === 'object' && typ.literal !== undefined) {
    return typ.literal
  } else {
    return typeof typ
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }))
    typ.jsonToJS = map
  }
  return typ.jsonToJS
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }))
    typ.jsToJSON = map
  }
  return typ.jsToJSON
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) {
      return val
    }
    return invalidValue(typ, val, key, parent)
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length
    for (let i = 0; i < l; i++) {
      const typ = typs[i]
      try {
        return transform(val, typ, getProps)
      } catch (_) {
        /* empty */
      }
    }
    return invalidValue(typs, val, key, parent)
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) {
      return val
    }
    return invalidValue(
      cases.map(a => {
        return l(a)
      }),
      val,
      key,
      parent
    )
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) {
      return invalidValue(l('array'), val, key, parent)
    }
    return val.map(el => transform(el, typ, getProps))
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null
    }
    const d = new Date(val)
    if (isNaN(d.valueOf())) {
      return invalidValue(l('Date'), val, key, parent)
    }
    return d
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue(l(ref || 'object'), val, key, parent)
    }
    const result: any = {}
    Object.getOwnPropertyNames(props).forEach(key => {
      const prop = props[key]
      const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined
      result[prop.key] = transform(v, prop.typ, getProps, key, ref)
    })
    Object.getOwnPropertyNames(val).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref)
      }
    })
    return result
  }

  if (typ === 'any') {
    return val
  }
  if (typ === null) {
    if (val === null) {
      return val
    }
    return invalidValue(typ, val, key, parent)
  }
  if (typ === false) {
    return invalidValue(typ, val, key, parent)
  }
  let ref: any = undefined
  while (typeof typ === 'object' && typ.ref !== undefined) {
    ref = typ.ref
    typ = typeMap[typ.ref]
  }
  if (Array.isArray(typ)) {
    return transformEnum(typ, val)
  }
  if (typeof typ === 'object') {
    return typ.hasOwnProperty('unionMembers')
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty('arrayItems')
      ? transformArray(typ.arrayItems, val)
      : typ.hasOwnProperty('props')
      ? transformObject(getProps(typ), typ.additional, val)
      : invalidValue(typ, val, key, parent)
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== 'number') {
    return transformDate(val)
  }
  return transformPrimitive(typ, val)
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps)
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps)
}

function l(typ: any) {
  return { literal: typ }
}

function a(typ: any) {
  return { arrayItems: typ }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function u(...typs: any[]) {
  return { unionMembers: typs }
}

function o(props: any[], additional: any) {
  return { props, additional }
}

function m(additional: any) {
  return { props: [], additional }
}

function r(name: string) {
  return { ref: name }
}

const typeMap: any = {
  CoverageReport: o(
    [
      { json: 'numFailedTestSuites', js: 'numFailedTestSuites', typ: 0 },
      { json: 'numFailedTests', js: 'numFailedTests', typ: 0 },
      { json: 'numPassedTestSuites', js: 'numPassedTestSuites', typ: 0 },
      { json: 'numPassedTests', js: 'numPassedTests', typ: 0 },
      { json: 'numPendingTestSuites', js: 'numPendingTestSuites', typ: 0 },
      { json: 'numPendingTests', js: 'numPendingTests', typ: 0 },
      { json: 'numRuntimeErrorTestSuites', js: 'numRuntimeErrorTestSuites', typ: 0 },
      { json: 'numTodoTests', js: 'numTodoTests', typ: 0 },
      { json: 'numTotalTestSuites', js: 'numTotalTestSuites', typ: 0 },
      { json: 'numTotalTests', js: 'numTotalTests', typ: 0 },
      { json: 'openHandles', js: 'openHandles', typ: a('any') },
      { json: 'snapshot', js: 'snapshot', typ: r('Snapshot') },
      { json: 'startTime', js: 'startTime', typ: 0 },
      { json: 'success', js: 'success', typ: true },
      { json: 'testResults', js: 'testResults', typ: a(r('TestResult')) },
      { json: 'wasInterrupted', js: 'wasInterrupted', typ: true },
      { json: 'coverageMap', js: 'coverageMap', typ: m(r('CoverageMap')) }
    ],
    false
  ),
  CoverageMap: o(
    [
      { json: 'path', js: 'path', typ: '' },
      { json: 'all', js: 'all', typ: true },
      { json: 'statementMap', js: 'statementMap', typ: m(r('StatementMap')) },
      { json: 's', js: 's', typ: m(0) },
      { json: 'branchMap', js: 'branchMap', typ: m(r('BranchMap')) },
      { json: 'b', js: 'b', typ: m(a(0)) },
      { json: 'fnMap', js: 'fnMap', typ: m(r('FnMap')) },
      { json: 'f', js: 'f', typ: m(0) }
    ],
    false
  ),
  BranchMap: o(
    [
      { json: 'type', js: 'type', typ: r('Type') },
      { json: 'line', js: 'line', typ: 0 },
      { json: 'loc', js: 'loc', typ: r('StatementMap') },
      { json: 'locations', js: 'locations', typ: a(r('StatementMap')) }
    ],
    false
  ),
  StatementMap: o(
    [
      { json: 'start', js: 'start', typ: r('End') },
      { json: 'end', js: 'end', typ: r('End') }
    ],
    false
  ),
  End: o(
    [
      { json: 'column', js: 'column', typ: 0 },
      { json: 'line', js: 'line', typ: 0 }
    ],
    false
  ),
  FnMap: o(
    [
      { json: 'name', js: 'name', typ: '' },
      { json: 'decl', js: 'decl', typ: r('StatementMap') },
      { json: 'loc', js: 'loc', typ: r('StatementMap') },
      { json: 'line', js: 'line', typ: 0 }
    ],
    false
  ),
  Snapshot: o(
    [
      { json: 'added', js: 'added', typ: 0 },
      { json: 'didUpdate', js: 'didUpdate', typ: true },
      { json: 'failure', js: 'failure', typ: true },
      { json: 'filesAdded', js: 'filesAdded', typ: 0 },
      { json: 'filesRemoved', js: 'filesRemoved', typ: 0 },
      { json: 'filesRemovedList', js: 'filesRemovedList', typ: a('any') },
      { json: 'filesUnmatched', js: 'filesUnmatched', typ: 0 },
      { json: 'filesUpdated', js: 'filesUpdated', typ: 0 },
      { json: 'matched', js: 'matched', typ: 0 },
      { json: 'total', js: 'total', typ: 0 },
      { json: 'unchecked', js: 'unchecked', typ: 0 },
      { json: 'uncheckedKeysByFile', js: 'uncheckedKeysByFile', typ: a('any') },
      { json: 'unmatched', js: 'unmatched', typ: 0 },
      { json: 'updated', js: 'updated', typ: 0 }
    ],
    false
  ),
  TestResult: o(
    [
      { json: 'assertionResults', js: 'assertionResults', typ: a(r('AssertionResult')) },
      { json: 'endTime', js: 'endTime', typ: 0 },
      { json: 'message', js: 'message', typ: '' },
      { json: 'name', js: 'name', typ: '' },
      { json: 'startTime', js: 'startTime', typ: 0 },
      { json: 'status', js: 'status', typ: '' },
      { json: 'summary', js: 'summary', typ: '' }
    ],
    false
  ),
  AssertionResult: o(
    [
      { json: 'ancestorTitles', js: 'ancestorTitles', typ: a('') },
      { json: 'duration', js: 'duration', typ: 0 },
      { json: 'failureDetails', js: 'failureDetails', typ: a('any') },
      { json: 'failureMessages', js: 'failureMessages', typ: a('any') },
      { json: 'fullName', js: 'fullName', typ: '' },
      { json: 'invocations', js: 'invocations', typ: 0 },
      { json: 'location', js: 'location', typ: r('End') },
      { json: 'numPassingAsserts', js: 'numPassingAsserts', typ: 0 },
      { json: 'retryReasons', js: 'retryReasons', typ: a('any') },
      { json: 'status', js: 'status', typ: '' },
      { json: 'title', js: 'title', typ: '' }
    ],
    false
  ),
  Type: ['branch']
}
