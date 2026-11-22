/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Navbar Component
 * Features branding, active role badge, fast role testing switcher, PWA installer, and connectivity status.
 */

import { AppWindow, Bell, BookOpen, CheckCircle2, Download, Globe, Layers, Lock, LogOut, Shield, ShieldAlert, Sparkles, UserPlus, GraduationCap, ShieldCheck, WifiOff, ChevronDown, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { usePWA } from '../../context/PWAContext.tsx';
import type { UserRole } from '../../types/index.ts';
import { ApiClient } from '../../lib/api.ts';
import { AppLogo } from '../common/AppLogo.tsx';
import { NotificationCenterModal } from '../notifications/NotificationCenterModal.tsx';
import { Button } from '../ui/Button.tsx';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuthModal: () => void;
  onOpenContributorModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenContributorModal
}) => {
  const { user, role, logout, switchRole, isOnline } = useAuth();
  const { isInstalled, promptInstall } = usePWA();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [lockedNoticeOpen, setLockedNoticeOpen] = useState(false);
  const [permissionDeniedModal, setPermissionDeniedModal] = useState<UserRole | null>(null);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && role !== 'VISITOR') {
      ApiClient.request<any>('/api/v1/notifications').then(res => {
        if (res.success && res.data) setUnreadCount(res.data.unreadCount || 0);
      });
    } else {
      setUnreadCount(0);
    }
  }, [user, role, notificationModalOpen]);

  // REMOVED 'courses' FROM NAV ITEMS
  const navItems = [
    { id: 'library', label: 'Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  if (role !== 'VISITOR') {
    navItems.push({
      id: 'dashboard',
      label: role === 'STUDENT' ? 'My Learning' : 'Dashboard',
      icon: role === 'ADMINISTRATOR' ? <Shield className="w-4 h-4" /> : <Layers className="w-4 h-4" />
    });
  }

  const roleLabels: Record<UserRole, { label: string; badgeBg: string; textCol: string }> = {
    VISITOR: { label: 'Visitor', badgeBg: 'bg-[#EDE9E2]', textCol: 'text-[#4A463F]' },
    STUDENT: { label: 'Student', badgeBg: 'bg-[#E8F5E9]', textCol: 'text-[#2D6A4F]' },
    LECTURER: { label: 'Lecturer', badgeBg: 'bg-[#F7E4D0]', textCol: 'text-[#8A3E12]' },
    MODERATOR: { label: 'Moderator', badgeBg: 'bg-[#FEF3C7]', textCol: 'text-[#B45309]' },
    ADMINISTRATOR: { label: 'Admin', badgeBg: 'bg-[#1C1A17]', textCol: 'text-[#EDE9E2]' }
  };

  return (
    <header className="bg-white border-b border-[#DDD8CF] sticky top-0 z-30 shadow-[0_1px_4px_rgba(28,26,23,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* Brand Identity with Official System Logo */}
          <AppLogo onClick={() => setActiveTab('library')} />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 select-none ${
                    isActive
                      ? 'bg-[#F7E4D0] text-[#8A3E12] font-semibold'
                      : 'text-[#4A463F] hover:bg-[#EDE9E2] hover:text-[#1C1A17]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions: Network, Role Switcher, PWA Install, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* PWA Install Button (Suppressed if already installed) */}
            {!isInstalled && (
              <Button
                variant="clayFill"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => promptInstall()}
                className="hidden sm:inline-flex text-xs"
                title="Install TuStudyHub on your device"
              >
                Install App
              </Button>
            )}

            {/* Network Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-[#E8F5E9] text-[#2D6A4F] border-[#A3D9B5]'
                  : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
              }`}
              title={isOnline ? 'Institutional Network Connected' : 'Offline Mode Active'}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse"></span>
                  <span className="hidden lg:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Role Display: Locked & Highlighted for Authenticated Users, Permission Guarded for Visitors */}
            {user ? (
              /* Authenticated Role Badge: Highlighted and Locked (Can't Switch) */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLockedNoticeOpen(!lockedNoticeOpen)}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                    roleLabels[role].badgeBg
                  } ${roleLabels[role].textCol} border-[#C4BEB4] hover:ring-1 hover:ring-[#8A3E12] shadow-xs`}
                  title="Your role is locked to your authenticated credentials (Click for details)"
                >
                  <Lock className="w-3.5 h-3.5 text-[#8A3E12]" />
                  <span className="hidden sm:inline text-[#726B62] font-medium">Role:</span>
                  <span>{roleLabels[role].label}</span>
                </button>

                {lockedNoticeOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#DDD8CF] shadow-[0_8px_24px_rgba(28,26,23,0.12)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-[#8A3E12] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#1C1A17]">Role Switching Prohibited</h4>
                        <p className="text-[11px] text-[#726B62] leading-relaxed">
                          You are authenticated as <strong>{roleLabels[role].label}</strong> ({user.email}). Institutional policy strictly prohibits switching roles on an active session.
                        </p>
                        <p className="text-[10px] text-[#8A3E12] font-semibold pt-1">
                          To switch roles, please Sign Out and log in with the authorized account.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLockedNoticeOpen(false);
                              logout();
                            }}
                            className="text-xs font-bold text-[#B91C1C] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Sign Out now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Visitor: Interactive Menu with Permission Denied on Escalation */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                    roleLabels[role].badgeBg
                  } ${roleLabels[role].textCol} border-[#C4BEB4] hover:border-[#8A3E12]`}
                  title="View institutional roles"
                >
                  <span className="hidden sm:inline text-[#726B62] font-normal">Role:</span>
                  <span>{roleLabels[role].label}</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                </button>

                {roleMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#DDD8CF] shadow-[0_8px_24px_rgba(28,26,23,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                  >
                    <div className="px-3 py-2 border-b border-[#EDE9E2]">
                      <p className="text-xs font-bold text-[#1C1A17]">Institutional Roles</p>
                      <p className="text-[11px] text-[#726B62]">Role switching requires authenticated institutional credentials.</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          switchRole('VISITOR');
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full min-h-[38px] px-3 py-2 text-left text-xs font-medium rounded-lg flex items-center justify-between transition-colors ${
                          role === 'VISITOR' ? 'bg-[#FBF1E6] text-[#8A3E12] font-bold' : 'text-[#4A463F] hover:bg-[#EDE9E2]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${role === 'VISITOR' ? 'bg-[#8A3E12]' : 'bg-[#C4BEB4]'}`} />
                          <span>Public Visitor (Guest)</span>
                        </div>
                        {role === 'VISITOR' && <Check className="w-3.5 h-3.5 text-[#8A3E12]" />}
                      </button>

                      {(['STUDENT', 'LECTURER', 'MODERATOR', 'ADMINISTRATOR'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRoleMenuOpen(false);
                            setPermissionDeniedModal(r);
                          }}
                          className="w-full min-h-[38px] px-3 py-2 text-left text-xs font-medium text-[#4A463F] hover:bg-[#FEE2E2]/60 hover:text-[#B91C1C] rounded-lg flex items-center justify-between transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-[#B45309] group-hover:text-[#B91C1C]" />
                            <span>{r.charAt(0) + r.slice(1).toLowerCase()}</span>
                          </div>
                          <span className="text-[10px] text-[#B45309] font-bold bg-[#FEF3C7] group-hover:bg-[#FEE2E2] group-hover:text-[#B91C1C] px-1.5 py-0.5 rounded">
                            Requires Auth
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell & Modal (Authenticated Non-Visitors Only) */}
            {user && role !== 'VISITOR' && (
              <>
                <button
                  type="button"
                  onClick={() => setNotificationModalOpen(true)}
                  className="relative min-h-[40px] w-10 flex items-center justify-center rounded-lg hover:bg-[#EDE9E2] transition-colors cursor-pointer"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-[#4A463F]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#B91C1C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationCenterModal
                  isOpen={notificationModalOpen}
                  onClose={() => setNotificationModalOpen(false)}
                  onNavigateToTab={setActiveTab}
                  onUpdateUnreadCount={setUnreadCount}
                />
              </>
            )}

            {/* User Profile & Direct Logout Button */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* User Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="min-h-[40px] flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#EDE9E2] transition-colors cursor-pointer"
                    title={`Signed in as ${user.fullName}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#8A3E12] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user.fullName.charAt(0)}
                    </div>
                    <span className="hidden xl:inline text-xs font-medium text-[#1C1A17] max-w-[120px] truncate">
                      {user.fullName}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-[#DDD8CF] shadow-[0_8px_24px_rgba(28,26,23,0.12)] p-2 z-50 text-left"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-[#EDE9E2]">
                        <p className="text-xs font-bold text-[#1C1A17] truncate">{user.fullName}</p>
                        <p className="text-[11px] text-[#726B62] truncate">{user.email}</p>
                        <p className="text-[10px] font-semibold text-[#8A3E12] mt-0.5">{user.departmentName || 'Academic Community'}</p>
                      </div>

                      {user.role === 'STUDENT' && (
                        <button
                          type="button"
                          onClick={onOpenContributorModal}
                          className="w-full min-h-[38px] px-3 py-2 text-left text-xs font-medium text-[#8A3E12] hover:bg-[#FBF1E6] rounded-lg flex items-center gap-2 mt-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply as Lecturer Contributor</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={logout}
                        className="w-full min-h-[38px] px-3 py-2 text-left text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2] rounded-lg flex items-center gap-2 mt-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Dedicated Logout Button (Always Visible when signed in) */}
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#FECACA] bg-[#FEE2E2]/70 hover:bg-[#FEE2E2] text-[#B91C1C] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none"
                  title="Sign out of your institutional account"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('register')}
                  className="text-xs sm:text-sm font-semibold"
                >
                  Register
                </Button>
                <Button
                  variant={activeTab === 'login' ? 'clayFill' : 'primary'}
                  size="sm"
                  onClick={() => setActiveTab('login')}
                  className="text-xs sm:text-sm font-semibold"
                >
                  Sign In
                </Button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Permission Denied Modal for Role Switching */}
      {permissionDeniedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#DDD8CF] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center text-[#B91C1C] shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-[#1C1A17]">Permission Denied</h3>
                <p className="text-xs text-[#726B62] leading-relaxed">
                  Unauthorized role switching is strictly denied. To access <strong>{permissionDeniedModal}</strong> privileges, you must register or sign in with verified institutional credentials.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FBF1E6] rounded-xl border border-[#F7E4D0] text-xs text-[#8A3E12]">
              <strong>Security Policy:</strong> {
                permissionDeniedModal === 'ADMINISTRATOR'
                  ? 'Administrator accounts cannot be self-assigned and must be provisioned by authorized personnel.'
                  : permissionDeniedModal === 'LECTURER'
                  ? 'Lecturer accounts require academic credentials review and administrator verification before activation.'
                  : permissionDeniedModal === 'MODERATOR'
                  ? 'Moderator accounts require institutional oversight and administrative approval.'
                  : 'Student accounts require university email registration.'
              }
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {permissionDeniedModal !== 'ADMINISTRATOR' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const target = permissionDeniedModal;
                    setPermissionDeniedModal(null);
                    setActiveTab('register');
                    window.location.hash = `#register?role=${target}`;
                  }}
                  className="flex-1 font-bold"
                >
                  Register as {permissionDeniedModal.charAt(0) + permissionDeniedModal.slice(1).toLowerCase()}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPermissionDeniedModal(null);
                  setActiveTab('login');
                  window.location.hash = '#login';
                }}
                className="flex-1 font-bold"
              >
                Sign In
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPermissionDeniedModal(null)}
                className="text-[#726B62]"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
