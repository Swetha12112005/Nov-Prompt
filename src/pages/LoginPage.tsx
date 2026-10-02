import { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(
            signInError.includes('Invalid login')
              ? 'Invalid email or password. If you are a new user, switch to Create Account.'
              : signInError
          );
        }
      } else {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) setError(signUpError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 items-center justify-center mb-4">
            <span className="font-bold text-xl text-white">NC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NOVA CART</h1>
          <p className="text-sm text-slate-500 mt-1">
            AI Business Rescue &amp; Operations Intelligence
          </p>
          <p className="text-xs text-slate-400 mt-2 italic">
            Turn operational signals into actionable business decisions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-4 h-4 text-pink-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-colors"
                placeholder="you@example.com"
                required
                autoComplete="email"
                aria-required="true"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-colors"
                  placeholder="At least 6 characters"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-300 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-300"
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-slate-600"
                >
                  Remember me
                </label>
              </div>
            )}

            {error && (
              <div
                className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 rounded"
            >
              {mode === 'login'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Hackathon Demo — Demo Authentication
        </div>
      </div>
    </div>
  );
}
