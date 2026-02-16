import type { Env, GenerationJobConfig, ImageResult } from '../../types'

function withTimeout<T>(promise: Promise<T>, timeoutMs = 20_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('provider_timeout'))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeout)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
}

function buildPrompt(config: GenerationJobConfig, variantIndex: number): string {
  return [
    'Swiss precision ad creative, minimal, monochrome with lime accent.',
    `Variant index ${variantIndex + 1}.`,
    `Campaign mode: ${config.mode}.`,
    `Platform targets: ${config.platforms.join(', ')}.`,
  ].join(' ')
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function callOpenAI(env: Env, prompt: string): Promise<ImageResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('provider_auth_missing')
  }

  const response = await withTimeout(
    fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      }),
    }),
  )

  if (!response.ok) {
    throw new Error(`provider_auth_${response.status}`)
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string }>
  }

  const base64 = payload.data?.[0]?.b64_json
  if (!base64) {
    throw new Error('provider_response_invalid')
  }

  return {
    bytes: base64ToBytes(base64),
    contentType: 'image/png',
    provider: 'openai',
  }
}

async function callGoogle(env: Env, prompt: string): Promise<ImageResult> {
  if (!env.GOOGLE_API_KEY) {
    throw new Error('provider_auth_missing')
  }

  const response = await withTimeout(
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'image/png',
          },
        }),
      },
    ),
  )

  if (!response.ok) {
    throw new Error(`provider_auth_${response.status}`)
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>
      }
    }>
  }

  const inlineData = payload.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  )?.inlineData

  if (!inlineData?.data) {
    throw new Error('provider_response_invalid')
  }

  return {
    bytes: base64ToBytes(inlineData.data),
    contentType: inlineData.mimeType ?? 'image/png',
    provider: 'google',
  }
}

function fallbackSvg(prompt: string): ImageResult {
  const safePrompt = prompt.replace(/[<>&]/g, '')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
      <rect width="1024" height="1024" fill="#ffffff" />
      <rect x="60" y="60" width="904" height="904" fill="#f7f7f7" stroke="#121212" stroke-width="2" />
      <rect x="100" y="100" width="220" height="36" fill="#d4ff00" stroke="#121212" stroke-width="2" />
      <text x="110" y="125" font-family="Inter, sans-serif" font-size="18" fill="#121212">AI GENERATED</text>
      <text x="100" y="220" font-family="Inter, sans-serif" font-size="42" fill="#121212">
        Swiss Precision Variant
      </text>
      <text x="100" y="280" font-family="Inter, sans-serif" font-size="20" fill="#515151">
        ${safePrompt.slice(0, 56)}
      </text>
    </svg>
  `

  return {
    bytes: new TextEncoder().encode(svg),
    contentType: 'image/svg+xml',
    provider: 'fallback',
  }
}

export async function generateImageVariant(
  env: Env,
  config: GenerationJobConfig,
  variantIndex: number,
): Promise<ImageResult> {
  if (config.testMode === 'force_image_fallback') {
    return fallbackSvg(buildPrompt(config, variantIndex))
  }

  const forcePrimaryFailure = config.testMode === 'force_image_primary_failure'
  const prompt = buildPrompt(config, variantIndex)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      if (forcePrimaryFailure) {
        throw new Error('provider_test_image_primary_failure')
      }

      return await callOpenAI(env, prompt)
    } catch {
      // retry primary once before secondary
    }
  }

  try {
    return await callGoogle(env, prompt)
  } catch {
    return fallbackSvg(prompt)
  }
}
