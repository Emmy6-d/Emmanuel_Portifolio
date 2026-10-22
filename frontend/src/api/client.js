const apiOrigin = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '')

export function apiUrl(path) {
  return `${apiOrigin}${path}`
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options)
}

export async function request(path, options = {}, token) {
  const response = await apiFetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Admin-Token': token } : {}),
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof body.detail === 'string'
      ? body.detail
      : Array.isArray(body.detail)
        ? body.detail.map((issue) => issue && typeof issue.msg === 'string' ? issue.msg : JSON.stringify(issue)).join('; ')
        : ''
    throw new Error(detail || `Request failed with status ${response.status}`)
  }
  if (!body || (path === '/portfolio' && (!Array.isArray(body.projects) || !Array.isArray(body.experience)))) {
    throw new Error('The portfolio API did not return valid data')
  }
  return body
}
