/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Mobile Bottom Navigation Bar
 * Ergonomic 48px touch targets for mobile phone users.
 */

import { BookOpen, GraduationCap, Layers, LogOut, Shield, ShieldCheck, UserCircle } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AppLogoIcon } from '../common/AppLogo.tsx';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { user, role, logout } = useAuth();

  // REMOVED 'courses' FROM MOBILE NAV ITEMS
  const items = [
    { id: 'library', label: 'Library', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  if (role !== 'VISITOR') {
    items.push({
      id: 'dashboard',
      label: role === 'STUDENT' ? 'My Learning' : 'Dashboard',
      icon: role === 'ADMINISTRATOR' ? <Shield className="w-5 h-5" /> : <Layers className="w-5 h-5" />
    });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDD8CF] z-30 pb-safe shadow-[0_-2px_10px_rgba(28,26,23,0.06)]">
      <div className="flex items-center justify-around gap-1 p-1 max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('library')}
          className="flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center transition-opacity"
        >
          <AppLogoIcon size={24} className="rounded shadow-xs" />
          <span className="text-[9px] mt-0.5 font-black text-[#8A3E12] uppercase tracking-tighter">TSH</span>
        </button>

        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors select-none ${
                isActive
                  ? 'text-[#8A3E12] font-bold bg-[#FBF1E6]'
                  : 'text-[#726B62] hover:text-[#1C1A17] hover:bg-[#EDE9E2]'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile Sign Out / Sign In Action */}
        {user ? (
          <button
            onClick={logout}
            className="flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors select-none text-[#B91C1C] hover:bg-[#FEE2E2]/60"
            title="Sign out of account"
          >
            <span className="shrink-0"><LogOut className="w-5 h-5" /></span>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center rounded-xl transition-colors select-none ${
              activeTab === 'login' || activeTab === 'register'
                ? 'text-[#8A3E12] font-bold bg-[#FBF1E6]'
                : 'text-[#726B62] hover:text-[#1C1A17] hover:bg-[#EDE9E2]'
            }`}
          >
            <span className="shrink-0"><UserCircle className="w-5 h-5" /></span>
            <span className="text-[10px] mt-0.5 tracking-tight">Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
};
