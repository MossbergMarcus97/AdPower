const requestBuckets = new Map<string, { count: number; resetAt: number }>()

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const current = requestBuckets.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    requestBuckets.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt,
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  requestBuckets.set(key, current)
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  }
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export async function consumeDailyJobQuota(
  db: D1Database,
  sessionId: string,
  maxJobsPerDay: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const day = todayKey()

  const existing = await db
    .prepare(
      `SELECT jobs_count FROM session_usage WHERE session_id = ?1 AND day = ?2`,
    )
    .bind(sessionId, day)
    .first<{ jobs_count: number }>()

  const currentCount = existing?.jobs_count ?? 0

  if (currentCount >= maxJobsPerDay) {
    return {
      allowed: false,
      remaining: 0,
    }
  }

  if (existing) {
    await db
      .prepare(
        `UPDATE session_usage SET jobs_count = jobs_count + 1 WHERE session_id = ?1 AND day = ?2`,
      )
      .bind(sessionId, day)
      .run()
  } else {
    await db
      .prepare(
        `INSERT INTO session_usage (session_id, day, jobs_count) VALUES (?1, ?2, 1)`,
      )
      .bind(sessionId, day)
      .run()
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxJobsPerDay - (currentCount + 1)),
  }
}
