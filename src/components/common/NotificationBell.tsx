import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await ApiClient.request<{ count: number }>('/api/v1/notifications/unread-count');
      if (res.success && res.data) setUnreadCount(res.data.count);
    } catch (error) { console.error('Failed to fetch unread count:', error); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await ApiClient.request<any[]>('/api/v1/notifications');
      if (res.success && res.data) setNotifications(res.data);
    } catch (error) { console.error('Failed to fetch notifications:', error); }
  };

  const markAsRead = async (id: string) => {
    try {
      await ApiClient.request(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) { console.error('Failed to mark notification as read:', error); }
  };

  return (
    <div className="relative">
      <button onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) fetchNotifications(); }} className="relative p-2 rounded-lg hover:bg-[#F7F5F1] transition-colors">
        <Bell className="w-5 h-5 text-[#726B62]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#8A3E12] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#DDD8CF] z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-[#EDE9E2]">
            <h3 className="text-sm font-bold text-[#1C1A17]">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#726B62]">No notifications yet</div>
          ) : (
            <div className="divide-y divide-[#EDE9E2]">
              {notifications.map(notif => (
                <div key={notif.id} onClick={() => !notif.is_read && markAsRead(notif.id)} className={`p-3 hover:bg-[#FAF8F5] cursor-pointer transition-colors ${!notif.is_read ? 'bg-[#F7F5F1]' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1C1A17] truncate">{notif.title}</p>
                      <p className="text-[11px] text-[#726B62] mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-[#A39B91] mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                    </div>
                    {!notif.is_read && <div className="w-2 h-2 bg-[#8A3E12] rounded-full shrink-0 mt-1"></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
