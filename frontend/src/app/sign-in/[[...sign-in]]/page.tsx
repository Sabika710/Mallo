import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-900/20 rounded-full blur-3xl" />
      </div>
      <SignIn />
    </div>
  )
}
