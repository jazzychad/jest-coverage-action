import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { existsSync } from 'fs'
import { getCheckRunContext } from './util/github-util'
import { generateCoverageMarkdown } from './coverageMarkdown'

class CovereageReporter {
  private readonly path = core.getInput('path', { required: true })
  private readonly threshold = core.getInput('threshold', { required: true })
  private readonly token = core.getInput('token', { required: true })
  private readonly octokit: InstanceType<typeof GitHub>
  private readonly context = getCheckRunContext()

  constructor() {
    this.octokit = github.getOctokit(this.token)
  }

  public async run(): Promise<void> {
    let threshold = parseInt(this.threshold, 10)
    if (isNaN(threshold)) {
      core.setFailed(`Input parameter 'threshold' has invalid value`)
      return
    }
    if (!existsSync(this.path)) {
      core.setFailed(`Could not find report file at: ${this.path}`)
      return
    }

    try {
      const markdown = generateCoverageMarkdown(this.path, threshold)

      await this.octokit.rest.checks.create({
        conclusion: 'success',
        head_sha: this.context.sha,
        name: 'Jest Coverage',
        status: 'completed',
        output: {
          title: 'Jest Coverage',
          summary: markdown
        },
        ...github.context.repo
      })
    } catch (error) {
      core.setFailed(`Could not generate report`)
      throw error
    }
  }
}

async function main(): Promise<void> {
  try {
    const testReporter = new CovereageReporter()
    await testReporter.run()
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    } else {
      core.setFailed(JSON.stringify(error))
    }
  }
}

main()
