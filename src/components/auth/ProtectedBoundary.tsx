/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Protected Access Boundary
 * Enforces institutional sign-in and RBAC authorization with standard branding.
 */

import React from 'react';
import { Lock, ShieldAlert, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/index.ts';

interface ProtectedBoundaryProps {
  requiredRoles?: UserRole[];
  destinationName?: string;
  onNavigateToLogin: (destination?: string) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenContributorModal?: () => void;
  children: React.ReactNode;
}

export const ProtectedBoundary: React.FC<ProtectedBoundaryProps> = ({
  requiredRoles,
  destinationName = 'this area',
  onNavigateToLogin,
  onNavigateToTab,
  onOpenContributorModal,
  children
}) => {
  const { user, role } = useAuth();

  // 1. Unauthenticated Visitor
  if (!user || role === 'VISITOR') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <Card variant="default" padding="lg" className="text-center space-y-6">
          {/* Badge: Access Restricted */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9E2] border border-[#DDD8CF] text-xs font-bold uppercase tracking-wider text-[#726B62]">
            <Lock className="w-3.5 h-3.5 text-[#8A3E12]" />
            <span>Access Restricted</span>
          </div>

          {/* Heading: Institutional Sign-In Required */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight">
              Institutional Sign-In Required
            </h2>
            {/* Message */}
            <p className="text-sm sm:text-base text-[#4A463F] max-w-lg mx-auto leading-relaxed">
              Sign in to access this area of TuStudyHub.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FBF1E6] border border-[#F7E4D0] max-w-md mx-auto text-left flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8A3E12] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#F7E4D0]" />
            </div>
            <div className="text-xs text-[#4A463F] space-y-1">
              <p className="font-semibold text-[#1C1A17]">Academic Verification Safeguard</p>
              <p className="text-[#726B62]">
                TuStudyHub maintains institutional integrity by reserving administrative controls, moderation queues, and peer reviews for authenticated members.
              </p>
            </div>
          </div>

          {/* Action Button: Sign In to Continue */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigateToLogin(destinationName)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto font-bold"
            >
              Sign In to Continue
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigateToTab('library')}
              leftIcon={<BookOpen className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Explore Public Library
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Authenticated but insufficient role
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <Card variant="default" padding="lg" className="text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEE2E2] border border-[#FECACA] text-xs font-bold uppercase tracking-wider text-[#B91C1C]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#B91C1C]" />
            <span>Permission Denied</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight">
              Elevated Privileges Required
            </h2>
            <p className="text-sm sm:text-base text-[#4A463F] max-w-lg mx-auto leading-relaxed">
              This administration and moderation area requires Lecturer, Moderator, or Administrator access privileges. Your account is currently authenticated as a <strong className="text-[#8A3E12] capitalize">{role.toLowerCase()}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#EDE9E2] border border-[#DDD8CF] max-w-md mx-auto text-left text-xs text-[#4A463F] space-y-2">
            <p className="font-semibold text-[#1C1A17]">Role-Based Access Control (RBAC)</p>
            <p className="text-[#726B62]">
              Under university governance policies, content review and administrative oversight are restricted to authorized faculty members and appointed moderators.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigateToTab('library')}
              leftIcon={<BookOpen className="w-4 h-4" />}
              className="w-full sm:w-auto font-semibold"
            >
              Return to Library
            </Button>
            {role === 'STUDENT' && onOpenContributorModal && (
              <Button
                variant="clayFill"
                size="md"
                onClick={onOpenContributorModal}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Apply as Lecturer Contributor
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // 3. Authorized
  return <>{children}</>;
};
