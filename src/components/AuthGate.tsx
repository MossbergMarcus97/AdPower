import { useState, type FormEvent } from 'react'
import { Button } from './ui/Button'

interface AuthGateProps {
  status: 'checking' | 'authenticating' | 'authenticated' | 'unauthenticated'
  error: string | null
  onSubmitPassphrase: (passphrase: string) => Promise<void>
}

export function AuthGate({ status, error, onSubmitPassphrase }: AuthGateProps) {
  const [passphrase, setPassphrase] = useState('')
  const isBusy = status === 'checking' || status === 'authenticating'

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!passphrase.trim() || isBusy) {
      return
    }

    await onSubmitPassphrase(passphrase.trim())
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="kicker">AdVariant Internal Access</p>
        <h1 id="auth-title">Swiss Precision Workspace</h1>
        <p>
          Enter the internal passphrase to unlock generation and review endpoints.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="passphrase">Passphrase</label>
          <input
            id="passphrase"
            name="passphrase"
            type="password"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            autoComplete="current-password"
            required
            disabled={isBusy}
          />
          <Button variant="primary" type="submit" disabled={isBusy}>
            {status === 'authenticating' ? 'Authenticating...' : 'Unlock Workspace'}
          </Button>
        </form>

        {status === 'checking' && <p className="auth-status">Checking active session...</p>}
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}
