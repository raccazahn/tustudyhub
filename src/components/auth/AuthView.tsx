/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Dedicated Authentication View (Sign In & Student Registration)
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, Lock, Mail, User as UserIcon,
  GraduationCap, Eye, EyeOff, ArrowRight, Sparkles, Layers, ArrowLeft, Wifi
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { AppLogo, AppLogoIcon } from '../common/AppLogo.tsx';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { Department } from '../../types/index.ts';
import { validatePassword } from '../../lib/passwordValidator.ts';

interface AuthViewProps {
  initialMode?: 'signin' | 'register';
  returnDestination?: string | null;
  onSuccess: (destination?: string | null) => void;
  onNavigateToTab: (tab: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'signin',
  returnDestination,
  onSuccess,
  onNavigateToTab
}) => {
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [requestedRole, setRequestedRole] = useState<'STUDENT' | 'LECTURER' | 'MODERATOR'>('STUDENT');
  const [contributorBio, setContributorBio] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ requestedRole: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setPendingConfirmation(null);
    setShowForgotPassword(false);
    setResetEmail('');

    if (typeof window !== 'undefined' && window.location.hash.includes('?')) {
      const query = window.location.hash.split('?')[1];
      const params = new URLSearchParams(query);
      const roleParam = params.get('role');
      if (roleParam === 'STUDENT' || roleParam === 'LECTURER' || roleParam === 'MODERATOR') {
        setRequestedRole(roleParam);
      }
    }
  }, [initialMode]);

  useEffect(() => {
    if (user) {
      onSuccess(returnDestination);
    }
  }, [user]);

  useEffect(() => {
    async function fetchDepartments() {
      const res = await ApiClient.request<Department[]>('/api/v1/departments');
      if (res.success && res.data && res.data.length > 0) {
        setDepartments(res.data);
      }
    }
    fetchDepartments();
  }, []);

  const switchTab = (newMode: 'signin' | 'register') => {
    setMode(newMode);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setPendingConfirmation(null);
    window.location.hash = newMode === 'signin' ? '#login' : '#register';
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';

    if (!password) {
      errors.password = 'Password is required.';
    } else {
      const pwdVal = validatePassword(password);
      if (!pwdVal.valid) errors.password = pwdVal.errors.join(' ');
    }

    if (mode === 'register') {
      if (!fullName.trim()) errors.fullName = 'Full name is required.';
      else if (fullName.trim().length < 2) errors.fullName = 'Please enter your full academic name.';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setPendingConfirmation(null);

    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const res: any = await login(email.trim(), password);
        if (res && res.success && res.data && res.data.token) {
          localStorage.setItem('tustudyhub_auth_token', res.data.token);
          localStorage.setItem('tustudyhub_user', JSON.stringify(res.data.user));
          const role = res.data.user?.role;
          if (role === 'ADMINISTRATOR' || role === 'ADMIN') {
            window.location.href = '/admin';
          } else if (role === 'LECTURER' || role === 'MODERATOR') {
            window.location.href = '/lecturer';
          } else {
            window.location.href = '/student';
          }
        } else {
          setError(res?.error || 'Invalid email or password.');
        }
      } else {
        const res: any = await register(email.trim(), password, fullName.trim(), selectedDeptId || undefined, requestedRole, contributorBio || undefined);
        if (res.success) {
          if (res.data?.isPending) {
            setPendingConfirmation({ requestedRole: res.data.user?.role || requestedRole, message: res.data.message || 'Your application is pending administrator approval.' });
          } else {
            setSuccessMessage('Registration successful. Redirecting...');
            setTimeout(() => onSuccess(returnDestination), 400);
          }
        } else {
          setError(res.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('❌ Request error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

        {/* Left Column: Branding & Info */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 p-6 lg:p-8 bg-[#1C1A17] text-[#EDE9E2] rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#8A3E12] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <AppLogoIcon className="w-10 h-10 text-[#F7E4D0]" />
              <h1 className="text-2xl font-black tracking-tight text-white">TuStudyHub</h1>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-[#F7E4D0]">Institutional Academic Portal</h2>
              <p className="text-sm text-[#A39B91] leading-relaxed">
                Secure, verified, and tamper-evident academic resource management.
                Access lecture notes, quizzes, and institutional documents with cryptographic assurance.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white">Cryptographic Verification</h3>
                  <p className="text-[11px] text-[#A39B91]">Every approved document is issued a tamper-evident public token registered on the institutional ledger.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-[#8A3E12] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white">Role-Based Access</h3>
                  <p className="text-[11px] text-[#A39B91]">Strict academic hierarchy ensures students, lecturers, and moderators see only what they are authorized to view.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Forms */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl border border-[#DDD8CF] p-6 sm:p-8 flex flex-col">

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-[#F7F5F1] p-1.5 border border-[#DDD8CF] mb-6">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => switchTab('signin')}
              className={`flex-1 min-h-[44px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-white text-[#8A3E12] shadow-xs border border-[#DDD8CF]' : 'text-[#726B62] hover:text-[#1C1A17]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchTab('register')}
              className={`flex-1 min-h-[44px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-[#8A3E12] shadow-xs border border-[#DDD8CF]' : 'text-[#726B62] hover:text-[#1C1A17]'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {pendingConfirmation ? (
              <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-[#B45309]" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1A17]">Application Pending Review</h3>
                <p className="text-sm text-[#726B62] max-w-md mx-auto">{pendingConfirmation.message}</p>
                <p className="text-xs text-[#4A463F] bg-[#F7F5F1] p-3 rounded-lg border border-[#DDD8CF] inline-block">
                  Requested Role: <span className="font-bold text-[#8A3E12]">{pendingConfirmation.requestedRole}</span>
                </p>
                <div className="pt-4">
                  <Button variant="outline" onClick={() => switchTab('signin')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Return to Sign In
                  </Button>
                </div>
              </div>
            ) : showForgotPassword ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-bold text-[#1C1A17]">Reset Your Password</h3>
                  <p className="text-sm text-[#726B62]">Enter your registered email address. If an account exists, a password reset link will be sent.</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your.email@tustudyhub.edu"
                    required
                    className="w-full min-h-[44px] pl-3 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!resetEmail.trim()) { setError('Please enter your email address'); return; }
                    setIsLoading(true); setError(null);
                    try {
                      const res = await ApiClient.request('/api/v1/auth/forgot-password', {
                        method: 'POST', body: JSON.stringify({ email: resetEmail.trim() })
                      });
                      if (res.success) {
                        setSuccessMessage('If an account exists with this email, a password reset link has been sent.');
                        setResetEmail('');
                        setTimeout(() => { setShowForgotPassword(false); setSuccessMessage(null); }, 3000);
                      } else {
                        setError(res.error?.message || 'Failed to process request');
                      }
                    } catch (err) {
                      setError('An unexpected error occurred');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full min-h-[44px] px-4 py-2 bg-[#8A3E12] text-white font-bold rounded-lg hover:bg-[#A84D16] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setError(null); setSuccessMessage(null); }}
                  className="w-full text-sm text-[#8A3E12] hover:underline font-medium flex items-center justify-center gap-1"
                >
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-[#2D6A4F] text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Doe" error={fieldErrors.fullName} leftIcon={<UserIcon className="w-4 h-4" />} required />
                  </div>
                )}

                <div>
                  <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@tustudyhub.edu" error={fieldErrors.email} helperText={mode === 'register' ? 'Official campus email or academic address.' : undefined} leftIcon={<Mail className="w-4 h-4" />} required autoComplete="username" />
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-password" className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">Password</label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full min-h-[44px] pl-3 pr-10 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border transition-colors ${fieldErrors.password ? 'border-[#B91C1C] focus:ring-[#B91C1C]' : 'border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-[#8A3E12]'} focus:outline-none focus:ring-1`}
                      aria-required="true"
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#726B62] hover:text-[#1C1A17] cursor-pointer" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p className="text-xs text-[#B91C1C] font-medium">{fieldErrors.password}</p>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-[#726B62]">{mode === 'register' ? 'Min 8 chars, 1 upper, 1 lower, 1 number.' : 'Enter your registered password.'}</p>
                      {mode === 'signin' && (
                        <button type="button" onClick={() => { setShowForgotPassword(true); setError(null); setSuccessMessage(null); }} className="text-xs text-[#8A3E12] hover:underline font-medium">
                          Forgot your password?
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {mode === 'register' && (
                  <div className="space-y-1">
                    <label htmlFor="auth-dept-select" className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">Department</label>
                    <select id="auth-dept-select" value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} className="w-full min-h-[44px] px-3 py-2 bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12] focus:outline-none">
                      <option value="">Select your department...</option>
                      {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">Account Role & Access Scope</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['STUDENT', 'LECTURER', 'MODERATOR'] as const).map((r) => (
                        <button key={r} type="button" onClick={() => setRequestedRole(r)} className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 ${requestedRole === r ? 'bg-[#8A3E12] text-white border-[#8A3E12] shadow-xs' : 'bg-white text-[#4A463F] border-[#DDD8CF] hover:border-[#8A3E12]'}`}>
                          {r === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5" />}
                          {r === 'LECTURER' && <UserIcon className="w-3.5 h-3.5" />}
                          {r === 'MODERATOR' && <ShieldCheck className="w-3.5 h-3.5" />}
                          {r}
                        </button>
                      ))}
                    </div>
                    {requestedRole !== 'STUDENT' && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mt-2">Candidate Statement</label>
                        <textarea value={contributorBio} onChange={(e) => setContributorBio(e.target.value)} placeholder="Briefly describe your academic background and why you are requesting this role..." className="w-full min-h-[80px] p-3 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12] focus:outline-none resize-none" />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" variant="clayFill" size="md" className="w-full" isLoading={isLoading} rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}>
                    {mode === 'signin' ? 'Sign In to Portal' : requestedRole === 'STUDENT' ? 'Create Student Account' : 'Submit Moderator Application (Pending Review)'}
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#DDD8CF]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-[#726B62] font-medium">or</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <GoogleSignInButton />

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
