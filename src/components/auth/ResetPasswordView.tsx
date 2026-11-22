import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { AppLogo } from '../common/AppLogo.tsx';
import { ApiClient } from '../../lib/api.ts';
import { validatePassword } from '../../lib/passwordValidator.ts';

export const ResetPasswordView: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Extract token from URL hash: #/reset-password?token=xyz
    const hash = window.location.hash;
    const match = hash.match(/token=([^&]+)/);
    if (match && match[1]) {
      setToken(match[1]);
    } else {
      setError('Invalid or missing reset token in URL.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiClient.request('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });

      if (res.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.hash = '#login';
          window.location.reload();
        }, 2000);
      } else {
        setError(res.error?.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDD8CF] p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-black text-[#1C1A17]">Create New Password</h1>
          <p className="text-sm text-[#726B62] mt-2">
            Enter your new secure password below.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm flex items-start gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-[#2D6A4F] text-sm flex items-start gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number" autoComplete="new-password"
                required
                className="w-full min-h-[44px] pl-3 pr-10 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12] focus:outline-none"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#726B62] hover:text-[#1C1A17]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isLoading} disabled={!token}>
            Reset Password
          </Button>

          <button type="button" onClick={() => window.location.hash = '#login'} className="w-full text-sm text-[#726B62] hover:text-[#1C1A17] hover:underline">
            Back to Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
