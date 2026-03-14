'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react'

export function PasswordResetButton({ action }: { action: () => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleClick = async () => {
    setState('loading')
    await action()
    setState('done')
    setTimeout(() => setState('idle'), 4000)
  }

  return (
    <Button
      variant="outline"
      className={`w-full text-sm transition-all ${
        state === 'done' ? 'border-green-500 text-green-600 bg-green-50' : ''
      }`}
      onClick={handleClick}
      disabled={state === 'loading' || state === 'done'}
    >
      {state === 'loading' ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : state === 'done' ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Email Sent!
        </>
      ) : (
        <>
          <KeyRound className="mr-2 h-4 w-4" />
          Send Password Reset Email
        </>
      )}
    </Button>
  )
}