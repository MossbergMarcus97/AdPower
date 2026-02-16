const DEFAULT_TIMEOUT_MS = 30_000

function toErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload
  }

  if (typeof payload === 'object' && payload && 'error' in payload) {
    const value = payload.error
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return fallback
}

async function readPayload(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null)
  }

  return response.text().catch(() => null)
}

function toCookieHeader(setCookieHeader) {
  if (!setCookieHeader) {
    return null
  }

  const cookiePair = setCookieHeader.split(';')[0]
  return cookiePair.trim().length > 0 ? cookiePair.trim() : null
}

function withTimeout(signal, timeoutMs) {
  if (signal) {
    return { signal, cleanup: () => {} }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  }
}

export async function createAuthedClient(options) {
  const apiBaseUrl = (options.apiBaseUrl ?? '').replace(/\/$/, '')
  if (!apiBaseUrl) {
    throw new Error('API base URL is required.')
  }

  if (!options.passphrase) {
    throw new Error('Passphrase is required.')
  }

  let cookieHeader = null

  async function request(path, init = {}) {
    const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const { signal, cleanup } = withTimeout(init.signal, timeoutMs)

    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: init.method ?? 'GET',
        headers: {
          ...(init.jsonBody ? { 'Content-Type': 'application/json' } : {}),
          ...(options.origin ? { Origin: options.origin } : {}),
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          ...(init.headers ?? {}),
        },
        body: init.jsonBody ? JSON.stringify(init.jsonBody) : init.body,
        signal,
      })

      const payload = await readPayload(response)
      if (!response.ok) {
        const errorMessage = toErrorMessage(
          payload,
          `Request failed with status ${response.status}`,
        )
        const error = new Error(errorMessage)
        error.status = response.status
        error.payload = payload
        throw error
      }

      return payload
    } finally {
      cleanup()
    }
  }

  const sessionResponse = await fetch(`${apiBaseUrl}/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.origin ? { Origin: options.origin } : {}),
    },
    body: JSON.stringify({ passphrase: options.passphrase }),
  })

  if (!sessionResponse.ok) {
    const payload = await readPayload(sessionResponse)
    throw new Error(
      toErrorMessage(payload, 'Authentication failed while creating session.'),
    )
  }

  cookieHeader = toCookieHeader(sessionResponse.headers.get('set-cookie'))
  if (!cookieHeader) {
    throw new Error('Session cookie was not returned by the API.')
  }

  return {
    request,
    get: (path) => request(path),
    post: (path, jsonBody) => request(path, { method: 'POST', jsonBody }),
    patch: (path, jsonBody) => request(path, { method: 'PATCH', jsonBody }),
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
