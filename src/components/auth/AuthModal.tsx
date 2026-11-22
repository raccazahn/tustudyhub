/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Authentication Modal (Sign In / Registration)
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { AppLogo } from '../common/AppLogo.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldAlert, CheckCircle2, ArrowRight,
  GraduationCap, User as UserIcon, ShieldCheck, Mail, Lock
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState<'STUDENT' | 'LECTURER' | 'MODERATOR'>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      if (tab === 'signin') {
        const res = await login(email, password);
        if (res.success) onClose();
        else setError(res.error || 'Failed to sign in.');
      } else {
        const res = await register(email, password, fullName, undefined, requestedRole);
        if (res.success) {
          if (res.isPending || res.message) {
            setSuccessMessage(res.message || 'Account application submitted for administrator review.');
            setTimeout(() => onClose(), 2500);
          } else {
            onClose();
          }
        } else {
          setError(res.error || 'Failed to register account.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tab === 'signin' ? 'Institutional Sign In' : 'Create Academic Account'}
      subtitle="TuStudyHub • Learn • Share • Verify"
      maxWidth="md"
    >
      <div className="space-y-5">
        <AppLogo size="sm" className="mb-1" />

        <div className="flex rounded-xl bg-[#F7F5F1] p-1.5 border border-[#DDD8CF]">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 min-h-[44px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'signin' ? 'bg-white text-[#8A3E12] shadow-xs border border-[#DDD8CF]' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 min-h-[44px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'register' ? 'bg-white text-[#8A3E12] shadow-xs border border-[#DDD8CF]' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="e.g. Kofi Mensah"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
            />
          )}

          <Input
            label="Institutional Email"
            type="email"
            required
            placeholder="your.email@tustudyhub.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="username"
            helperText={tab === 'register' ? 'Official campus email or academic address.' : undefined}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            helperText={tab === 'register' ? 'Min 8 chars, 1 upper, 1 lower, 1 number.' : 'Enter your registered password.'}
          />

          {tab === 'register' && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F]">
                Account Role & Access Scope
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['STUDENT', 'LECTURER', 'MODERATOR'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRequestedRole(r)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      requestedRole === r
                        ? 'bg-[#8A3E12] text-white border-[#8A3E12] shadow-xs'
                        : 'bg-white text-[#4A463F] border-[#DDD8CF] hover:border-[#8A3E12]'
                    }`}
                  >
                    {r === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5" />}
                    {r === 'LECTURER' && <UserIcon className="w-3.5 h-3.5" />}
                    {r === 'MODERATOR' && <ShieldCheck className="w-3.5 h-3.5" />}
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {requestedRole !== 'STUDENT' && (
                <div className="p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[11px] text-[#92400E]">
                  <strong>Admin Approval Required:</strong> {requestedRole === 'LECTURER' ? 'Lecturer' : 'Moderator'} accounts require institutional verification. Login will be enabled once approved.
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="clayFill"
            size="md"
            className="w-full font-bold mt-2"
            isLoading={isLoading}
            rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
          >
            {tab === 'signin'
              ? 'Sign In to Portal'
              : requestedRole === 'STUDENT'
              ? 'Create Student Account'
              : 'Submit Application (Pending Review)'}
          </Button>

          {/* Divider */}
          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DDD8CF]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-[#726B62] font-medium">or</span>
            </div>
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton />

          <div className="text-center pt-3 border-t border-[#EDE9E2]">
            <button
              type="button"
              onClick={() => {
                window.location.hash = tab === 'signin' ? '#login' : '#register';
                onClose();
              }}
              className="text-xs text-[#8A3E12] hover:underline font-medium cursor-pointer flex items-center justify-center gap-1 mx-auto"
            >
              Open dedicated full-page authentication <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
