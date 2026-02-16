const SESSION_COOKIE = 'adpower_session'

function toBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await importKey(secret)
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value),
  )

  return toBase64Url(new Uint8Array(signature))
}

export async function createSignedSessionToken(
  sessionId: string,
  secret: string,
): Promise<string> {
  const payload = JSON.stringify({
    sid: sessionId,
    iat: Date.now(),
  })
  const payloadEncoded = toBase64Url(new TextEncoder().encode(payload))
  const signature = await sign(payloadEncoded, secret)
  return `${payloadEncoded}.${signature}`
}

export async function verifySignedSessionToken(
  token: string,
  secret: string,
): Promise<string | null> {
  const [payloadEncoded, signature] = token.split('.')
  if (!payloadEncoded || !signature) {
    return null
  }

  const expected = await sign(payloadEncoded, secret)
  if (expected !== signature) {
    return null
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadEncoded)),
    ) as { sid?: string }

    return payload.sid ?? null
  } catch {
    return null
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}
