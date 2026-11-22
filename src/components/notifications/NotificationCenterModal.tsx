import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  MessageSquare,
  Send,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Notification, NotificationType, NotificationResponse } from '../../types/index.ts';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string, token?: string | null) => void;
  onUpdateUnreadCount: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onUpdateUnreadCount
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  // Broadcast announcement form (for admins)
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('#library');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ApiClient.request<NotificationResponse>('/api/v1/notifications');
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        const unread = res.data.unreadCount || 0;
        setUnreadCount(unread);
        onUpdateUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [onUpdateUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      const res = await ApiClient.request(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        onUpdateUnreadCount(newCount);

        if (link) {
          onClose();
          const cleanTab = link.replace(/^#\/?/, '').split('?')[0];
          const tokenMatch = link.match(/token=([^&]+)/);
          onNavigateToTab(cleanTab, tokenMatch ? tokenMatch[1] : null);
        }
      }
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await ApiClient.request('/api/v1/notifications/read-all', { method: 'PATCH' });
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        onUpdateUnreadCount(0);
      }
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    setBroadcasting(true);
    try {
      // Using our existing /announce endpoint to match backend
      const res = await ApiClient.request('/api/v1/notifications/announce', {
        method: 'POST',
        body: JSON.stringify({
          type: 'ANNOUNCEMENT',
          title: broadcastTitle,
          message: broadcastMessage,
          entityId: broadcastLink,
          entityType: 'LINK'
        })
      });

      if (res.success) {
        setBroadcastSuccess(true);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTimeout(() => {
          setBroadcastSuccess(false);
          setShowBroadcastForm(false);
        }, 2000);
        fetchNotifications();
      }
    } catch (err) {
      console.warn('Failed to send announcement broadcast:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'DOCUMENT_APPROVED':
      case 'CONTRIBUTOR_APPROVED':
        return <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />;
      case 'DOCUMENT_REJECTED':
      case 'CONTRIBUTOR_REJECTED':
        return <Info className="w-4 h-4 text-[#B91C1C]" />;
      case 'QUIZ_PUBLISHED':
      case 'QUIZ_RESULT_AVAILABLE':
        return <GraduationCap className="w-4 h-4 text-[#8A3E12]" />;
      case 'ANNOUNCEMENT':
        return <BookOpen className="w-4 h-4 text-[#8A3E12]" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[#C2691D]" />;
    }
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'unread' ? !n.isRead : true
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Center"
      subtitle="Institutional announcements and academic updates"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9E2]">
          <div className="flex items-center gap-1.5 p-1 bg-[#EDE9E2] rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white text-[#1C1A17] shadow-xs'
                  : 'text-[#726B62] hover:text-[#1C1A17]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === 'unread'
                  ? 'bg-white text-[#8A3E12] shadow-xs'
                  : 'text-[#726B62] hover:text-[#1C1A17]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && user && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[#8A3E12] hover:text-[#A84D16] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}

            {user?.role === 'ADMINISTRATOR' && (
              <button
                type="button"
                onClick={() => setShowBroadcastForm(!showBroadcastForm)}
                className="text-xs px-2.5 py-1 rounded bg-[#F7E4D0] text-[#8A3E12] font-semibold hover:bg-[#F0D5BE] transition-colors"
              >
                {showBroadcastForm ? 'Cancel' : 'Broadcast Notice'}
              </button>
            )}
          </div>
        </div>

        {/* Admin Broadcast Form */}
        {showBroadcastForm && user?.role === 'ADMINISTRATOR' && (
          <form onSubmit={handleSendBroadcast} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#DDD8CF] space-y-3">
            <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider">
              Publish Institutional Announcement
            </h4>

            {broadcastSuccess && (
              <div className="p-2 rounded bg-[#E8F5E9] text-[#2D6A4F] text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Announcement broadcast successfully to all accounts.
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#4A463F] mb-1">Notice Title</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g., First Semester Exam Past Papers Now Available"
                className="w-full text-xs p-2 rounded-lg border border-[#DDD8CF] bg-white focus:outline-none focus:ring-1 focus:ring-[#8A3E12]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#4A463F] mb-1">Announcement Message</label>
              <textarea
                required
                rows={2}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter detailed notice content for all students and faculty..."
                className="w-full text-xs p-2 rounded-lg border border-[#DDD8CF] bg-white focus:outline-none focus:ring-1 focus:ring-[#8A3E12]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#726B62]">Target Route:</span>
                <select
                  value={broadcastLink}
                  onChange={(e) => setBroadcastLink(e.target.value)}
                  className="p-1 rounded border border-[#DDD8CF] text-xs bg-white"
                >
                  <option value="#library">#library (Resource Archive)</option>
                  <option value="#quizzes">#quizzes (Assessments)</option>
                  <option value="#qa">#qa (Academic Q&A)</option>
                  <option value="#verify">#verify (Verification Registry)</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="clayFill"
                size="sm"
                disabled={broadcasting}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {broadcasting ? 'Broadcasting...' : 'Publish'}
              </Button>
            </div>
          </form>
        )}

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {loading ? (
            <p className="text-xs text-[#726B62] py-8 text-center">Loading notifications...</p>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#726B62]">
              <Bell className="w-8 h-8 text-[#DDD8CF] mx-auto mb-2" />
              <p className="font-semibold text-[#4A463F]">All caught up!</p>
              <p className="text-[11px] text-[#726B62] mt-0.5">
                {filter === 'unread' ? 'You have zero unread notifications.' : 'No notifications found.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id, n.entityId ? `#${n.entityType?.toLowerCase()}?id=${n.entityId}` : undefined)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  n.isRead
                    ? 'bg-white border-[#EDE9E2] text-[#4A463F] opacity-80 hover:opacity-100 hover:border-[#DDD8CF]'
                    : 'bg-[#FAF8F5] border-[#F7E4D0] text-[#1C1A17] shadow-xs hover:border-[#8A3E12]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  n.isRead ? 'bg-[#EDE9E2]' : 'bg-[#FBF1E6]'
                }`}>
                  {getIconForType(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className={`text-xs truncate ${n.isRead ? 'font-medium' : 'font-bold text-[#1C1A17]'}`}>
                      {n.title}
                    </h5>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#8A3E12] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#726B62] leading-relaxed mt-0.5">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-[#9E978C]">
                    <span>{new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {n.entityId && (
                      <span className="flex items-center gap-0.5 text-[#8A3E12] font-semibold hover:underline">
                        <span>Open</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
