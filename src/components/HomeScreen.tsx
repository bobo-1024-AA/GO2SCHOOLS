import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Bell, ChevronRight, FileText, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { COUNTDOWN_DATES } from '../constants';
import { CalendarEvent, UserProfile } from '../types';

export default function HomeScreen({ profile, onShowToast, onNavigate }: { profile: UserProfile | null, onShowToast?: (msg: string) => void, onNavigate?: (screen: string, param?: string) => void }) {
  const { t } = useTranslation();
  const [isForumModalOpen, setIsForumModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // Update unread notifications count from localStorage
    const updateNotifications = () => {
      const savedNotifications = localStorage.getItem('app_notifications');
      if (savedNotifications) {
        const notifications = JSON.parse(savedNotifications);
        setUnreadCount(notifications.filter((n: any) => !n.is_read).length);
      }
    };

    updateNotifications();
    window.addEventListener('storage', updateNotifications);

    // Fetch user events from Firestore
    if (!profile?.id) return;
    const q = query(
      collection(db, 'calendar_events'),
      where('user_id', '==', profile.id),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CalendarEvent[];
      
      setUserEvents(events);
    });

    return () => {
      window.removeEventListener('storage', updateNotifications);
      unsubscribe();
    };
  }, [profile?.id]);

  const handleFeatureClick = () => {
    if (onShowToast) onShowToast(t('Feature coming soon!'));
  };

  // Combine system and user events for sorting
  const allEvents = [
    { id: 'sspa', title: t("SSPA Allocation"), date: COUNTDOWN_DATES.SSPA, color: "bg-primary", type: 'system', param: 'sspa' },
    { id: 'dse', title: t("DSE Exams"), date: COUNTDOWN_DATES.DSE, color: "bg-[#4A90E2]", type: 'system', param: 'dse' },
    { id: 'jupas', title: t("JUPAS Deadline"), date: COUNTDOWN_DATES.JUPAS, color: "bg-[#9B51E0]", type: 'system', param: 'jupas' },
    ...userEvents.map(ev => ({
      id: ev.id,
      title: ev.title,
      date: new Date(ev.date),
      color: "bg-[#FF4757]",
      type: 'user',
      param: ''
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!profile) return;
    try {
      await deleteDoc(doc(db, 'calendar_events', eventId));
      if (onShowToast) onShowToast(t('Event deleted'));
    } catch (error) {
      console.error('Error deleting event:', error);
      if (onShowToast) onShowToast(t('Delete failed'));
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="flex justify-between items-center p-5 pt-6 sticky top-0 bg-bg/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigate ? onNavigate('profile') : handleFeatureClick()}
            className="w-10 h-10 rounded-full overflow-hidden bg-card border-2 border-primary/20 shadow-sm cursor-pointer active:scale-95 transition-transform"
          >
            {profile?.avatar_path ? (
              <img 
                key={profile.avatar_path} 
                src={profile.avatar_path} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                <Users className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="text-[22px] font-black text-primary tracking-tight">GO2Schools</div>
        </div>
        <div className="relative cursor-pointer" onClick={() => onNavigate ? onNavigate('notifications') : handleFeatureClick()}>
          <Bell className="w-6 h-6 text-text dark:text-[#FFFACD]" />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF3030] rounded-full border-2 border-bg"></div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Upcoming Dates Section */}
        <div className="px-5 mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-extrabold text-text">{t('Upcoming Dates')}</h2>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 snap-x snap-mandatory hide-scrollbar">
            {allEvents.map(ev => (
              <CountdownCard 
                key={ev.id}
                title={ev.title} 
                date={ev.date} 
                color={ev.color} 
                onDelete={ev.type === 'user' ? (e) => handleDeleteEvent(e, ev.id) : undefined}
                onClick={() => {
                  if (ev.type === 'system') {
                    onNavigate ? onNavigate('article', ev.param) : handleFeatureClick();
                  } else {
                    onNavigate ? onNavigate('calendar') : handleFeatureClick();
                  }
                }} 
              />
            ))}
          </div>
        </div>

        {/* Official News Feed Section */}
        <div className="px-5 mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-extrabold text-text">{t('Official News Feed')}</h2>
            <span className="text-xs font-bold text-primary cursor-pointer" onClick={handleFeatureClick}>{t('See All')}</span>
          </div>
          
          <div className="space-y-3">
            <NewsCard 
              tag={t("EDB Update")} 
              title={t("General Information on Secondary School Places Allocation (SSPA) System")} 
              date={t("Today, 09:00 AM")} 
              isNew={true} 
              onClick={() => onNavigate ? onNavigate('article', 'sspa') : handleFeatureClick()}
            />
            <NewsCard 
              tag={t("School Info")} 
              title={t("HKDSE 2026 Release Date & Prep Guide")} 
              date={t("Yesterday")} 
              onClick={() => onNavigate ? onNavigate('article', 'dse') : handleFeatureClick()}
            />
            <NewsCard 
              tag={t("Policy")} 
              title={t("JUPAS 2026 Release Date & Important Notes")} 
              date={t("Oct 15, 2025")} 
              onClick={() => onNavigate ? onNavigate('article', 'jupas') : handleFeatureClick()}
            />
          </div>
        </div>

        {/* Parent Tools Section */}
        <div className="px-5 mb-4">
          <h2 className="text-xl font-extrabold text-text mb-4">{t('Parent Tools')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <ToolCard 
              icon={<CalendarIcon className="w-6 h-6 text-[#10B981]" />} 
              iconBg="bg-[#D1FAE5]"
              title={t("Interview Dates")} 
              desc={t("Track schedule")} 
              onClick={() => onNavigate ? onNavigate('calendar') : handleFeatureClick()} 
            />
            <ToolCard 
              icon={<Users className="w-6 h-6 text-[#3B82F6]" />} 
              iconBg="bg-[#DBEAFE]"
              title={t("Parents Forum")} 
              desc={t("Discuss & share")} 
              onClick={() => setIsForumModalOpen(true)} 
            />
          </div>
        </div>
      </div>

      {/* Forum Under Development Modal */}
      <AnimatePresence>
        {isForumModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsForumModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-sm rounded-[24px] p-6 shadow-xl border border-border flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">{t('Under Development')}</h3>
              <p className="text-[#5B697B] dark:text-[#FFEC8B] mb-6">
                {t('This feature is currently under development. Please stay tuned!')}
              </p>
              <button
                onClick={() => setIsForumModalOpen(false)}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                {t('Got it')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CountdownCard: React.FC<{ 
  title: string, 
  date: Date, 
  color: string, 
  onClick?: () => void,
  onDelete?: (e: React.MouseEvent) => void
}> = ({ title, date, color, onClick, onDelete }) => {
  const { t } = useTranslation();
  const days = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div onClick={onClick} className={`min-w-[280px] ${color} rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden snap-center cursor-pointer group`}>
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <div className="absolute -right-4 -top-4 opacity-10">
        <Clock className="w-32 h-32" />
      </div>
      <div className="relative z-10">
        <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">{title}</div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-black tracking-tighter">{days > 0 ? days : 0}</span>
          <span className="text-sm font-bold opacity-90">{t('Days Left')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          2026
        </div>
      </div>
    </div>
  );
};

function NewsCard({ tag, title, date, isNew = false, onClick }: { tag: string, title: string, date: string, isNew?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-card p-4 rounded-2xl border border-border flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
      <div className="w-12 h-12 rounded-xl bg-[#FFF1E0] flex items-center justify-center flex-shrink-0">
        <FileText className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{tag}</span>
          {isNew && <span className="bg-danger text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">New</span>}
        </div>
        <h4 className="text-sm font-bold text-text mb-1 truncate">{title}</h4>
        <div className="text-[11px] text-muted font-medium">{date}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted flex-shrink-0" />
    </div>
  );
}

function ToolCard({ icon, iconBg = "bg-bg", title, desc, onClick }: { icon: React.ReactNode, iconBg?: string, title: string, desc: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-card p-5 rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex flex-col items-start">
      <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-sm font-bold text-text mb-1">{title}</div>
      <div className="text-[11px] text-muted font-medium">{desc}</div>
    </div>
  );
}
