import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, MessageSquare, Calendar as CalendarIcon, RefreshCw, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppNotification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhHK, enUS } from 'date-fns/locale';

export default function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const savedNotifications = localStorage.getItem('app_notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      
      // Mark all as read when opening
      const updated = parsed.map((n: AppNotification) => ({ ...n, is_read: true }));
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'admission': return { icon: Mail, bg: 'bg-[#FFF1E0]', color: 'text-primary' };
      case 'forum': return { icon: MessageSquare, bg: 'bg-[#E6F0FA]', color: 'text-[#4A90E2]' };
      case 'deadline': return { icon: CalendarIcon, bg: 'bg-[#FFE5E5]', color: 'text-[#FF3B30]' };
      default: return { icon: RefreshCw, bg: 'bg-[#F1F5F9]', color: 'text-[#64748B]' };
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayNotifications = notifications.filter(n => new Date(n.created_at) >= today);
  const earlierNotifications = notifications.filter(n => new Date(n.created_at) < today);

  const locale = i18n.language === 'zh' ? zhHK : enUS;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="flex items-center p-4 bg-card border-b border-border sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center justify-center w-10 h-10 text-primary rounded-xl -ml-2 hover:bg-primary/10 transition-colors">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <h2 className="text-xl font-bold ml-2 text-text">{t('Notifications')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <BellOff className="w-16 h-16 mb-4 text-muted" />
            <p className="text-lg font-bold text-text">{t('No notifications yet')}</p>
          </div>
        ) : (
          <>
            {/* Today Section */}
            {todayNotifications.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                  <h3 className="text-lg font-bold text-text">{t('Today')}</h3>
                </div>
                
                <div className="space-y-4">
                  {todayNotifications.map(n => {
                    const { icon: Icon, bg, color } = getIcon(n.type);
                    return (
                      <div key={n.id} className="bg-card p-4 rounded-2xl border border-border flex gap-4 shadow-sm">
                        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-text">{n.title}</h4>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale })}
                            </span>
                          </div>
                          <p className="text-[13px] text-text leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Earlier Section */}
            {earlierNotifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-[#CBD5E1] rounded-full"></div>
                  <h3 className="text-lg font-bold text-text">{t('Earlier')}</h3>
                </div>
                
                <div className="space-y-4">
                  {earlierNotifications.map(n => {
                    const { icon: Icon, bg, color } = getIcon(n.type);
                    return (
                      <div key={n.id} className="bg-card p-4 rounded-2xl border border-border flex gap-4 shadow-sm opacity-80">
                        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-text">{n.title}</h4>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale })}
                            </span>
                          </div>
                          <p className="text-[13px] text-text leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
