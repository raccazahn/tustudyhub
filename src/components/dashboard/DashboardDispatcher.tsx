/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Dashboard Dispatcher
 * Resolves the correct role-specific dashboard component for the authenticated user.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AdminDashboard } from '../admin/AdminDashboard.tsx';
import { LecturerDashboard } from '../lecturer/LecturerDashboard.tsx';
import { ModeratorDashboard } from '../moderator/ModeratorDashboard.tsx';
import { StudentDashboard } from '../student/StudentDashboard.tsx';
import { Card } from '../ui/Card.tsx';
import { ShieldAlert } from 'lucide-react';

export const DashboardDispatcher: React.FC = () => {
  const { user, role } = useAuth();

  if (!user) return null;

  // Handle account status states that prevent dashboard access
  if (user.status === 'PENDING_APPROVAL') {
    return (
      <Card variant="default" padding="lg" className="max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#1C1A17]">Application Pending Review</h2>
        <p className="text-sm text-[#726B62] leading-relaxed">
          Your institutional account application is currently in the review queue. To maintain platform integrity, dashboard access is disabled until an administrator verifies your academic credentials.
        </p>
        <p className="text-xs text-[#8A3E12] font-bold">
          Institutional Email: {user.email}
        </p>
      </Card>
    );
  }

  if (user.status === 'REJECTED') {
    return (
      <Card variant="default" padding="lg" className="max-w-2xl mx-auto text-center space-y-4 border-[#FCA5A5]">
        <div className="w-16 h-16 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#1C1A17]">Application Not Approved</h2>
        <p className="text-sm text-[#726B62] leading-relaxed">
          Your application for elevated institutional privileges was not approved by the review board.
        </p>
        {user.rejectionReason && (
          <div className="p-3 bg-[#FAF9F5] border border-[#DDD8CF] rounded-lg text-xs text-[#B91C1C] italic">
            <strong>Reason:</strong> {user.rejectionReason}
          </div>
        )}
      </Card>
    );
  }

  if (user.status === 'SUSPENDED') {
    return (
      <Card variant="default" padding="lg" className="max-w-2xl mx-auto text-center space-y-4 border-[#B91C1C]">
        <div className="w-16 h-16 rounded-full bg-[#1C1A17] text-white flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#1C1A17]">Account Suspended</h2>
        <p className="text-sm text-[#726B62] leading-relaxed">
          This account has been suspended due to a violation of institutional integrity policies or prolonged inactivity.
        </p>
      </Card>
    );
  }

  // Dispatch based on authorized role
  switch (role) {
    case 'ADMINISTRATOR':
      return <AdminDashboard />;
    case 'LECTURER':
      return <LecturerDashboard />;
    case 'MODERATOR':
      return <ModeratorDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      return (
        <div className="text-center py-12">
          <p className="text-sm text-[#726B62]">Authorized dashboard not found for this role profile.</p>
        </div>
      );
  }
};
