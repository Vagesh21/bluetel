import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('admin_token', res.data.token);
      toast.success('Welcome back!');
      navigate('/admin');
    } catch {
      toast.error('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blues-bg flex items-center justify-center px-6" data-testid="admin-login-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <img
            src="https://theblueshotel.com.au/wp-content/uploads/2026/02/Untitled.png"
            alt="The Blues Hotel"
            className="h-14 w-auto mx-auto mb-6"
          />
          <h1 className="font-heading text-2xl text-white mb-1">Admin Login</h1>
          <p className="text-gray-600 text-sm">The Blues Hotel Collective CMS</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
              data-testid="admin-login-email" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12 pr-10"
                data-testid="admin-login-password" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-testid="admin-login-password-visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading}
            className="w-full bg-amber text-black hover:brightness-110 font-bold uppercase tracking-widest rounded-none h-12"
            data-testid="admin-login-submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
