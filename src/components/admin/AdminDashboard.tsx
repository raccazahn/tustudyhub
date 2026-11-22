import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, FileText, Building2, CheckSquare,
  ShieldCheck, BookOpen, ClipboardList, MessageSquare, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Card } from '../ui/Card.tsx';
import { LoadingState } from '../ui/LoadingState.tsx';
import { ApiClient } from '../../lib/api.ts';

// Import existing admin components
import { AcademicStructureManager } from './AcademicStructureManager.tsx';
import { AdminDocumentsManagement } from './AdminDocumentsManagement.tsx';
import { FeedbackManager } from './FeedbackManager.tsx';
import { StudentVerificationManager } from './StudentVerificationManager.tsx';
import { UserManagement } from './UserManagement.tsx';
import { ApprovalsManager } from './ApprovalsManager.tsx';
import { QuizManagement } from './QuizManagement.tsx';
import { AuditReports } from './AuditReports.tsx';

type Tab = 'overview' | 'users' | 'documents' | 'academic' | 'approvals' | 'verification' | 'quizzes' | 'audit' | 'feedback';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [usersRes, docsRes, verifRes] = await Promise.all([
        ApiClient.request<any[]>('/api/v1/admin/users'),
        ApiClient.request<any[]>('/api/v1/documents'),
        ApiClient.request<any[]>('/api/v1/verification/admin/pending')
      ]);

      if (usersRes.success && docsRes.success) {
        const users = usersRes.data || [];
        const docs = docsRes.data || [];
        const verifs = verifRes.success ? verifRes.data || [] : [];

        setStats({
          totalUsers: users.length,
          activeStudents: users.filter((u: any) => u.role === 'STUDENT' && u.status === 'ACTIVE').length,
          pendingUserApprovals: users.filter((u: any) => u.status === 'PENDING_APPROVAL').length,
          totalDocuments: docs.length,
          pendingDocuments: docs.filter((d: any) => d.status === 'PENDING').length,
          pendingVerifications: verifs.length
        });
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
    setLoading(false);
  };

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'academic', label: 'Academic Structure', icon: Building2 },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare },
    { id: 'verification', label: 'Student Verification', icon: ShieldCheck },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
    { id: 'audit', label: 'Audit Reports', icon: ClipboardList },
    { id: 'feedback', label: 'Feedback & Support', icon: MessageSquare },
  ];

  const renderContent = () => {
    if (loading && activeTab === 'overview') return <LoadingState message="Loading platform metrics..." />;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDD8CF]">
              <div>
                <h1 className="text-2xl font-black text-[#1C1A17] tracking-tight">Platform Overview</h1>
                <p className="text-xs text-[#726B62] mt-0.5">Real-time operational metrics and pending actions.</p>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Card variant="clayTint" padding="md" className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Total Users</span>
                  <p className="text-3xl font-black text-[#1C1A17]">{stats.totalUsers}</p>
                  <p className="text-[11px] text-[#2D6A4F] font-semibold">{stats.activeStudents} Active Students</p>
                </Card>
                <Card variant="clayTint" padding="md" className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Pending User Approvals</span>
                  <p className="text-3xl font-black text-[#C2691D]">{stats.pendingUserApprovals}</p>
                  <p className="text-[11px] text-[#726B62]">Lecturers & Moderators</p>
                </Card>
                <Card variant="clayTint" padding="md" className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Total Documents</span>
                  <p className="text-3xl font-black text-[#1C1A17]">{stats.totalDocuments}</p>
                  <p className="text-[11px] text-[#B91C1C] font-semibold">{stats.pendingDocuments} Pending Review</p>
                </Card>
                <Card variant="clayTint" padding="md" className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#726B62]">Student Verifications</span>
                  <p className="text-3xl font-black text-[#8A3E12]">{stats.pendingVerifications}</p>
                  <p className="text-[11px] text-[#726B62]">Awaiting Administrator Decision</p>
                </Card>
              </div>
            )}

            <Card variant="default" padding="md">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#4A463F] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button onClick={() => setActiveTab('verification')} className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EDE9E2] hover:border-[#8A3E12] transition-colors text-left">
                  <ShieldCheck className="w-5 h-5 text-[#8A3E12] mb-2" />
                  <p className="text-xs font-bold text-[#1C1A17]">Review Verifications</p>
                  <p className="text-[10px] text-[#726B62]">Approve or reject student IDs</p>
                </button>
                <button onClick={() => setActiveTab('documents')} className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EDE9E2] hover:border-[#8A3E12] transition-colors text-left">
                  <FileText className="w-5 h-5 text-[#8A3E12] mb-2" />
                  <p className="text-xs font-bold text-[#1C1A17]">Manage Documents</p>
                  <p className="text-[10px] text-[#726B62]">Approve or revoke uploads</p>
                </button>
                <button onClick={() => setActiveTab('users')} className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EDE9E2] hover:border-[#8A3E12] transition-colors text-left">
                  <Users className="w-5 h-5 text-[#8A3E12] mb-2" />
                  <p className="text-xs font-bold text-[#1C1A17]">User Management</p>
                  <p className="text-[10px] text-[#726B62]">Suspend, edit, or provision</p>
                </button>
                <button onClick={() => setActiveTab('academic')} className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EDE9E2] hover:border-[#8A3E12] transition-colors text-left">
                  <Building2 className="w-5 h-5 text-[#8A3E12] mb-2" />
                  <p className="text-xs font-bold text-[#1C1A17]">Academic Structure</p>
                  <p className="text-[10px] text-[#726B62]">Manage colleges and courses</p>
                </button>
              </div>
            </Card>
          </div>
        );

      // CLEANED UP: Removed all duplicate placeholder cases
      case 'users':
        return <UserManagement />;
      case 'documents':
        return <AdminDocumentsManagement />;
      case 'academic':
        return <AcademicStructureManager />;
      case 'approvals':
        return <ApprovalsManager />;
      case 'verification':
        return <StudentVerificationManager />;
      case 'quizzes':
        return <QuizManagement />;
      case 'audit':
        return <AuditReports />;
      case 'feedback':
        return <FeedbackManager />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#FAF8F5]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#DDD8CF] hidden lg:flex flex-col">
        <div className="p-4 border-b border-[#DDD8CF]">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#8A3E12]">Administration</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#8A3E12] text-white'
                    : 'text-[#4A463F] hover:bg-[#F7F5F1]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.id === 'verification' && stats?.pendingVerifications > 0 && (
                  <span className="ml-auto bg-[#B91C1C] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {stats.pendingVerifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#DDD8CF]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {/* Mobile Tab Selector (Visible only on small screens) */}
        <div className="lg:hidden mb-4 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                    isActive ? 'bg-[#8A3E12] text-white' : 'bg-white border border-[#DDD8CF] text-[#4A463F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};
