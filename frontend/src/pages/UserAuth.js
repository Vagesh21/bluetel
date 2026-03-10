import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function UserAuth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname === '/register') setMode('register');
    else setMode('login');
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await api.post('/users/register', form);
        localStorage.setItem('user_token', res.data.token);
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('blues_user', JSON.stringify(res.data.user));
        toast.success('Welcome to The Blues Hotel!');
        navigate('/profile');
      } else {
        const res = await api.post('/users/login', form);
        localStorage.setItem('user_token', res.data.token);
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('blues_user', JSON.stringify(res.data.user));
        toast.success('Welcome back!');
        navigate('/profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center px-6" data-testid="user-auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join the Community'}
          </h1>
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? 'Sign in to save liked episodes and leave comments.' : 'Create an account to engage with the blues community.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                data-testid="user-auth-name"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
              data-testid="user-auth-email"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
              data-testid="user-auth-password"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-black hover:brightness-110 font-bold uppercase tracking-widest rounded-none h-12"
            data-testid="user-auth-submit"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' ? (
            <>
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-amber hover:underline" data-testid="switch-to-register">Create one</Link>
              </p>
              <Link to="/reset-password" className="text-xs text-gray-600 hover:text-gray-400 transition-colors" data-testid="forgot-password-link">
                Forgot your password?
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-amber hover:underline" data-testid="switch-to-login">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
