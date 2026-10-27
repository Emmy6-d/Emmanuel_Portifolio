import assert from 'node:assert/strict'
import test from 'node:test'
import { apiUrl, request } from './client.js'

test('apiUrl keeps the API path relative when no origin is configured', () => {
  assert.equal(apiUrl('/api/health'), '/api/health')
})

test('request returns portfolio data after validating its shape', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/portfolio')
    assert.equal(options.headers['Content-Type'], undefined)
    return new Response(JSON.stringify({ projects: [], experience: [] }), { status: 200 })
  }
  try {
    assert.deepEqual(await request('/portfolio'), { projects: [], experience: [] })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('request reports API error details', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Not authorized' }), { status: 401 })
  try {
    await assert.rejects(request('/admin/contacts'), { message: 'Not authorized' })
  } finally {
    globalThis.fetch = originalFetch
  }
})
