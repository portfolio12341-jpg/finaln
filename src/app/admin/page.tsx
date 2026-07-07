'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-space-black">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-royal-blue/5 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]" />

      <div className="w-full max-w-md relative">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-xs font-mono text-gray-500 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Portfolio</span>
        </Link>

        <div className="glass-card rounded-2xl border border-white/8 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-mono text-white tracking-wide">Secure Admin Portal</h1>
            <p className="text-xxs text-gray-500 uppercase tracking-widest font-mono mt-1">Authorized Access Only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xxs font-mono text-gray-500 uppercase tracking-widest font-bold block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="nsnency000@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/30 transition-colors"
                />
                <Mail className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xxs font-mono text-gray-500 uppercase tracking-widest font-bold block">Secure Key</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/30 transition-colors"
                />
                <Lock className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-royal-blue hover:bg-royal-blue/90 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
