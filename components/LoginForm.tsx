'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { mustChangePassword } = await login(email, password);
      router.push(mustChangePassword ? '/reclamations/change-password' : '/reclamations');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? err.message
          : 'Erreur de connexion';
      setError(typeof msg === 'string' ? msg : 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8" style={{
      background: 'radial-gradient(circle at center, rgba(140,12,12,0.9) 0%, rgba(70,0,0,0.96) 38%, rgba(30,0,0,0.98) 100%)',
    }}>
      <div className="relative w-full max-w-[1200px] animate-scale-in">
        <div className="grid overflow-hidden rounded-[30px] bg-[#f3f1f1] shadow-[0_30px_60px_rgba(0,0,0,0.35)] lg:grid-cols-[1.08fr_0.92fr]" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="relative hidden sm:block sm:min-h-[400px] bg-white lg:min-h-[680px]">
            <img
              src="/images/logo2.png"
              alt="Logo BEM Dakar"
              className="h-full w-full object-contain p-0"
              style={{ display: 'block', background: '#f4f4f4' }}
            />
          </div>

          <div className="flex items-center justify-center bg-[#f3f1f1] px-6 py-8 sm:px-8 lg:px-10">
            <div className="w-full max-w-[410px]">
              <div className="mb-8 flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #D50B1B, #C00000)', boxShadow: '0 10px 18px rgba(204,0,0,0.2)' }}>
                  R
                </div>
                <div>
                  <h1 className="text-[19px] font-black tracking-tight text-[#1f2430]">Réclamations</h1>
                  <p className="text-sm font-medium text-[#73809c]">Moyens Généraux · BEM Dakar</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#161b22]">Adresse email</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" style={{ color: focused === 'email' ? '#CC0000' : '#94A3B8' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      className="w-full rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-200"
                      style={{
                        background: focused === 'email' ? 'rgba(204,0,0,0.04)' : '#edf3f8',
                        border: focused === 'email' ? '2px solid #CC0000' : '2px solid #dfe7f1',
                        color: '#0F172A',
                      }}
                      placeholder="scbalde@bem.sn"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#161b22]">Mot de passe</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: focused === 'password' ? '#CC0000' : '#94A3B8' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <input
                      type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className="w-full rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-200"
                      style={{
                        background: focused === 'password' ? 'rgba(204,0,0,0.04)' : '#edf3f8',
                        border: focused === 'password' ? '2px solid #CC0000' : '2px solid #dfe7f1',
                        color: '#0F172A',
                      }}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="animate-slide-up flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ background: '#FFF1F1', border: '1px solid #FFCDD2', color: '#CC0000' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #D50B1B, #C00000)', boxShadow: '0 8px 22px rgba(204,0,0,0.25)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin-slow" width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Connexion en cours…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Se connecter
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button type="button" className="text-sm font-medium text-[#1f2430] underline decoration-[#b7c3d6] underline-offset-4">
                  Registre digital des réclamations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
