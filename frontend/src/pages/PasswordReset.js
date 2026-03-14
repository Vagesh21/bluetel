import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function PasswordReset() {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/password-reset-request', { email });
      toast.success('If that email exists, a reset token has been sent.');
      setStep('reset');
    } catch { toast.error('Request failed'); }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password-reset', { token, new_password: newPassword });
      toast.success('Password reset successfully! You can now log in.');
      setStep('done');
    } catch (err) { toast.error(err.response?.data?.detail || 'Reset failed'); }
    setLoading(false);
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center px-6" data-testid="password-reset-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-white mb-2">Reset Password</h1>
          <p className="text-gray-500 text-sm">
            {step === 'request' && 'Enter your email to receive a reset token.'}
            {step === 'reset' && 'Enter the token from your email and your new password.'}
            {step === 'done' && 'Your password has been reset.'}
          </p>
        </div>

        {step === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required
              className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12" data-testid="reset-email" />
            <Button type="submit" disabled={loading} className="w-full bg-amber text-black hover:brightness-110 font-bold uppercase tracking-widest rounded-none h-12" data-testid="reset-request-btn">
              {loading ? 'Sending...' : 'Send Reset Token'}
            </Button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Reset Token</label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste the token from your email" required
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12 font-mono" data-testid="reset-token" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
              <div className="relative">
                <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12 pr-10" data-testid="reset-new-password" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  data-testid="reset-new-password-visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12 pr-10" data-testid="reset-confirm-password" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  data-testid="reset-confirm-password-visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-amber text-black hover:brightness-110 font-bold uppercase tracking-widest rounded-none h-12" data-testid="reset-confirm-btn">
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center">
            <p className="text-green-400 mb-4">Password reset successfully!</p>
            <a href="/login" className="text-amber hover:underline text-sm">Go to Login</a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
