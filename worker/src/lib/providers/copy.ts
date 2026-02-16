import type { CopyResult, Env, GenerationJobConfig } from '../../types'

const defaultCtas = ['Build It', 'Launch It', 'Get Started', 'See Demo']

function withTimeout<T>(promise: Promise<T>, timeoutMs = 15_000): Promise<T> {
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
    'You generate high-performing ad copy in JSON.',
    'Return only valid JSON matching this shape:',
    '{ "headline": string, "body": string, "cta": string }',
    `Variant index: ${variantIndex + 1}`,
    `Campaign mode: ${config.mode}`,
    `Messages: ${config.messages.join(' | ')}`,
    `Platforms: ${config.platforms.join(', ')}`,
  ].join('\n')
}

function parseCopyJson(raw: string): { headline: string; body: string; cta: string } {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim()

  const parsed = JSON.parse(cleaned) as {
    headline?: string
    body?: string
    cta?: string
  }

  if (!parsed.headline || !parsed.cta) {
    throw new Error('provider_response_invalid')
  }

  return {
    headline: parsed.headline,
    body: parsed.body ?? 'AI-generated body copy.',
    cta: parsed.cta,
  }
}

async function callAnthropic(env: Env, prompt: string): Promise<CopyResult> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('provider_auth_missing')
  }

  const response = await withTimeout(
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest',
        max_tokens: 300,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    }),
  )

  if (!response.ok) {
    throw new Error(`provider_auth_${response.status}`)
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
  }

  const text = payload.content?.find((item) => item.type === 'text')?.text
  if (!text) {
    throw new Error('provider_response_invalid')
  }

  const parsed = parseCopyJson(text)
  return {
    ...parsed,
    provider: 'anthropic',
  }
}

async function callOpenAI(env: Env, prompt: string): Promise<CopyResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('provider_auth_missing')
  }

  const response = await withTimeout(
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'Return only JSON with headline, body, cta. No markdown or prose.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    }),
  )

  if (!response.ok) {
    throw new Error(`provider_auth_${response.status}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const text = payload.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('provider_response_invalid')
  }

  const parsed = parseCopyJson(text)
  return {
    ...parsed,
    provider: 'openai',
  }
}

function buildFallback(config: GenerationJobConfig, variantIndex: number): CopyResult {
  const seedMessage = config.messages[variantIndex % config.messages.length]
  const cta = defaultCtas[variantIndex % defaultCtas.length]

  return {
    headline: seedMessage
      ? `AI Variant ${variantIndex + 1}: ${seedMessage}`
      : `AI Variant ${variantIndex + 1}: Launch conversion-ready creative fast.`,
    body: 'Automatically generated copy fallback used due provider unavailability.',
    cta,
    provider: 'fallback',
  }
}

export async function generateCopyVariant(
  env: Env,
  config: GenerationJobConfig,
  variantIndex: number,
): Promise<CopyResult> {
  if (config.testMode === 'force_copy_fallback') {
    return buildFallback(config, variantIndex)
  }

  const forcePrimaryFailure = config.testMode === 'force_copy_primary_failure'
  const prompt = buildPrompt(config, variantIndex)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      if (forcePrimaryFailure) {
        throw new Error('provider_test_copy_primary_failure')
      }

      return await callAnthropic(env, prompt)
    } catch {
      // retry primary once before fallback
    }
  }

  try {
    return await callOpenAI(env, prompt)
  } catch {
    return buildFallback(config, variantIndex)
  }
}
