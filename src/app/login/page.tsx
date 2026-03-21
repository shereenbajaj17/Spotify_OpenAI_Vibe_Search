'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid credentials');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-spotify-dark p-8 rounded-xl shadow-2xl border border-neutral-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(29,185,84,0.3)]">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-black" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.6c-.2.32-.61.43-.92.23-2.5-1.52-5.64-1.87-9.33-1.02-.35.08-.7-.14-.78-.49-.08-.35.14-.7.49-.78 4.04-.92 7.5-.53 10.3 1.17.33.2.43.62.24.93v-.04zm1.3-3.23c-.25.4-.76.53-1.16.28-2.88-1.78-7.3-2.33-10.34-1.28-.43.15-.9-.08-1.05-.51-.15-.43.08-.9.51-1.05 3.48-1.2 8.37-.58 11.66 1.45.42.26.54.8.3 1.21v-.1zm.14-3.36C14.6 7.9 9 7.7 5.25 8.75c-.5.15-1.02-.15-1.17-.65-.15-.5.15-1.02.65-1.17C8.9 5.75 15.15 6 18.7 8.1c.45.27.6.86.33 1.32-.27.46-.86.6-1.32.33l.33-.33z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-white">Log in to Vibe Search</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-md text-sm text-center">{error}</div>}
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border border-neutral-600 rounded-sm p-3 text-white focus:outline-none focus:border-white transition-colors"
              placeholder="Email address"
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border border-neutral-600 rounded-sm p-3 text-white focus:outline-none focus:border-white transition-colors"
              placeholder="Password"
              required
            />
            <span className="text-xs text-spotify-light pt-1">(Demo: Entering any new email will auto-create an account)</span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-spotify-green hover:bg-[#1ed760] text-black font-bold uppercase tracking-widest text-sm py-4 rounded-full mt-4 transition-transform hover:scale-105"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
