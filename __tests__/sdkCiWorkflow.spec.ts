import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const workflowPath = new URL('../.github/workflows/sdk-ci.yml', import.meta.url)

describe('Avatar SDK CI workflow', () => {
  it('validates pull-request integration trees once and retains a full manual path', () => {
    const workflow = readFileSync(workflowPath, 'utf8')

    expect(workflow).toMatch(/^on:\n  pull_request:[\s\S]*^  push:\n    branches: \[main\][\s\S]*^  workflow_dispatch:/mu)
    expect(workflow).toContain('name: build-test-pack')
    expect(workflow).toContain("if [[ \"$EVENT_NAME\" != workflow_dispatch ]]")
    expect(workflow).toContain('scope=full')
    expect(workflow).toContain("steps.scope.outputs.scope != 'documentation'")
  })
})
