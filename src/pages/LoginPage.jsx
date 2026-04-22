import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useApiSimulator } from '@/contexts/ApiSimulatorContext'
import { toast } from '@/hooks/use-toast'

const LoginPage = () => {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [emailConfirmation, setEmailConfirmation] = useState(false)

  const { login, register } = useAuth()
  const { logCall, updateCall } = useApiSimulator()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/'

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const isLogin = mode === 'login'
    const endpoint = isLogin ? '/auth/v1/token?grant_type=password' : '/auth/v1/signup'
    const callId = logCall({
      method: 'POST',
      endpoint,
      status: 'pending',
      description: isLogin ? `Sign in as ${email}` : `Register ${email}`,
    })

    try {
      if (isLogin) {
        await login(email, password)
        updateCall(callId, { status: 'success', statusCode: 200 })
        toast({ title: 'Welcome back!', description: `Signed in as ${email}` })
        navigate(next === 'checkout' ? '/' : next, { replace: true })
      } else {
        const result = await register(email, password)
        updateCall(callId, { status: 'success', statusCode: 200 })
        if (result?.emailConfirmationRequired) {
          setEmailConfirmation(true)
        } else {
          toast({ title: 'Account created!', description: `Welcome, ${email}` })
          navigate(next === 'checkout' ? '/' : next, { replace: true })
        }
      }
    } catch (err) {
      updateCall(callId, { status: 'error', statusCode: err.status ?? 401 })
      const msg = err.message ?? 'Something went wrong. Please try again.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  // Email confirmation required screen
  if (emailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account then sign in.
          </p>
          <button
            onClick={() => { setEmailConfirmation(false); setMode('login') }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Go to sign in
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background">
        <Link to="/" className="font-display text-3xl font-bold">Vendora</Link>
        <div>
          <p className="font-display text-5xl font-bold leading-tight mb-4">Curated for the mindful shopper</p>
          <p className="text-background/60 text-lg">Quality essentials, thoughtfully selected.</p>
        </div>
        <p className="text-background/40 text-sm">© 2026 Vendora</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 lg:hidden">
            <ArrowLeft className="w-4 h-4" /> Back to shop
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login' ? 'Sign in to continue shopping' : 'Join Vendora for a curated experience'}
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className={`w-full px-4 py-3.5 rounded-2xl border text-foreground placeholder:text-muted-foreground text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.email ? 'border-destructive' : 'border-border'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full px-4 py-3.5 pr-12 rounded-2xl border text-foreground placeholder:text-muted-foreground text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.password ? 'border-destructive' : 'border-border'}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }} className="text-primary font-medium hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
