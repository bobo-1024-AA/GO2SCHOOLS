import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  AlertCircle, 
  Users, 
  Plus, 
  X, 
  Clock, 
  Search, 
  Trash2, 
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CalendarEvent, AppNotification } from '../types';

// Mock school data for search
const MOCK_SCHOOLS = [
  "St. Paul's Co-educational College",
  "Diocesan Boys' School",
  "Diocesan Girls' School",
  "La Salle College",
  "Maryknoll Convent School",
  "Saint James Academy",
  "Lakeside Preparatory",
  "Green Valley High",
  "King's College",
  "Queen's College",
  "Wah Yan College",
  "Belilios Public School"
];

const EVENT_TYPES = [
  { id: 'interview', label: 'Interview', icon: GraduationCap, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'deadline', label: 'Deadline', icon: AlertCircle, color: 'text-danger', bgColor: 'bg-danger/10' },
  { id: 'mixer', label: 'Mixer', icon: Users, color: 'text-[#4A90E2]', bgColor: 'bg-[#4A90E2]/10' },
  { id: 'other', label: 'Other', icon: CalendarDays, color: 'text-muted', bgColor: 'bg-muted/10' }
];

export default function CalendarScreen({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSchool, setFormSchool] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formNotes, setFormNotes] = useState('');
  const [formType, setFormType] = useState<CalendarEvent['type']>('interview');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolResults, setShowSchoolResults] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // One-time migration from localStorage to Firestore
    const migrateEvents = async () => {
      const savedEvents = localStorage.getItem('calendar_events');
      if (savedEvents) {
        try {
          const eventsToMigrate = JSON.parse(savedEvents) as CalendarEvent[];
          for (const ev of eventsToMigrate) {
            // Check if already migrated or just add (Firestore will have different IDs)
            // To avoid duplicates, we could check but let's just add and clear
            const { id, ...eventData } = ev;
            await addDoc(collection(db, 'calendar_events'), {
              ...eventData,
              user_id: auth.currentUser!.uid
            });
          }
          localStorage.removeItem('calendar_events');
          showToast(t('Events migrated successfully!'));
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
    };
    migrateEvents();

    const q = query(
      collection(db, 'calendar_events'),
      where('user_id', '==', auth.currentUser.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CalendarEvent[];
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addNotification = (title: string, message: string, type: AppNotification['type']) => {
    const savedNotifications = localStorage.getItem('app_notifications');
    const notifications: AppNotification[] = savedNotifications ? JSON.parse(savedNotifications) : [];
    
    const newNotification: AppNotification = {
      id: Date.now().toString(),
      user_id: 'current_user',
      title,
      message,
      type,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    localStorage.setItem('app_notifications', JSON.stringify([newNotification, ...notifications]));
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
  };

  // Calendar logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 is Sunday

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const startDay = startDayOfMonth(year, month);
    
    // Adjust startDay for Monday start (0=Mon, 6=Sun)
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
    
    const prevMonthDays = daysInMonth(year, month - 1);
    const result = [];
    
    // Previous month dates
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      result.push({ day: prevMonthDays - i, type: 'prev', date: `${year}-${month}-${prevMonthDays - i}` });
    }
    
    // Current month dates
    for (let i = 1; i <= days; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      result.push({ day: i, type: 'current', date: dateStr });
    }
    
    // Next month dates
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ day: i, type: 'next', date: `${year}-${month + 2}-${i}` });
    }
    
    return result;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setFormTitle('');
    setFormSchool('');
    setFormTime('09:00');
    setFormNotes('');
    setFormType('interview');
    setIsAddModalOpen(true);
  };

  const handleAddEvent = async () => {
    if (!formTitle || !selectedDate || !auth.currentUser) return;
    
    try {
      const newEvent = {
        user_id: auth.currentUser.uid,
        title: formTitle,
        school_name: formSchool,
        date: selectedDate,
        time: formTime,
        notes: formNotes,
        type: formType
      };
      
      await addDoc(collection(db, 'calendar_events'), newEvent);
      
      setIsAddModalOpen(false);
      showToast(t('Event saved successfully!'));
      
      addNotification(
        t('New event scheduled'),
        `${t('You have a new event:')} ${formTitle} @ ${formSchool}`,
        formType === 'deadline' ? 'deadline' : 'admission'
      );
    } catch (error) {
      console.error('Error adding event:', error);
      showToast(t('Save failed'));
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent || !auth.currentUser) return;
    
    try {
      const eventRef = doc(db, 'calendar_events', editingEvent.id);
      await updateDoc(eventRef, {
        title: formTitle,
        school_name: formSchool,
        time: formTime,
        notes: formNotes,
        type: formType
      });
      
      setIsEditModalOpen(false);
      showToast(t('Event saved successfully!'));
    } catch (error) {
      console.error('Error updating event:', error);
      showToast(t('Update failed'));
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent || !auth.currentUser) return;
    
    try {
      await deleteDoc(doc(db, 'calendar_events', editingEvent.id));
      setIsDeleteConfirmOpen(false);
      setIsEditModalOpen(false);
      showToast(t('Event deleted successfully!'));
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast(t('Delete failed'));
    }
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormSchool(event.school_name);
    setFormTime(event.time);
    setFormNotes(event.notes || '');
    setFormType(event.type);
    setIsEditModalOpen(true);
  };

  const filteredSchools = MOCK_SCHOOLS.filter(s => 
    s.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const upcomingEvents = useMemo(() => {
    return events.filter(ev => ev.date >= todayStr).slice(0, 5);
  }, [events, todayStr]);

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="flex items-center p-4 bg-card border-b border-border sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center justify-center w-10 h-10 text-primary rounded-xl -ml-2 hover:bg-primary/10 transition-colors">
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-text">{t('Interview Calendar')}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Calendar View */}
        <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h3 className="text-lg font-bold text-text">
                {currentDate.toLocaleString(i18n.language, { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-bg rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-text" /></button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-bg rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-text" /></button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-4 text-center">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} className="text-[10px] font-bold text-muted tracking-wider">{t(day)}</div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center">
            {calendarDays.map((item, idx) => {
              const isToday = item.date === todayStr;
              const hasEvents = events.some(ev => ev.date === item.date);
              
              return (
                <div 
                  key={idx} 
                  onClick={() => item.type === 'current' && handleDateClick(item.date)}
                  className={`relative flex justify-center items-center cursor-pointer group`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${item.type !== 'current' ? 'text-muted/30' : 'text-text'}
                    ${isToday ? 'bg-primary text-white shadow-md scale-110' : ''}
                    ${hasEvents && !isToday ? 'bg-primary/20 text-primary border border-primary/30' : !isToday && item.type === 'current' ? 'hover:bg-primary/10' : ''}
                  `}>
                    {item.day}
                  </div>
                  {hasEvents && !isToday && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,107,0,0.5)]"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{t('NEXT PRIORITIES')}</div>
              <h3 className="text-xl font-extrabold text-text">{t('Upcoming Schedule')}</h3>
            </div>
            <span className="text-xs font-bold text-primary cursor-pointer hover:underline">{t('View all')}</span>
          </div>

          <div className="space-y-4">
            {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
              const typeInfo = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[3];
              const Icon = typeInfo.icon;
              
              return (
                <motion.div 
                  key={event.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openEditModal(event)}
                  className="bg-card p-4 rounded-2xl border-l-4 border-l-primary border-y border-r border-border shadow-sm flex justify-between items-center cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-text mb-1">{event.school_name || event.title}</h4>
                    <div className={`flex items-center gap-1.5 text-[13px] ${typeInfo.color}`}>
                      <Icon className="w-4 h-4" />
                      {event.title}
                    </div>
                    {event.notes && (
                      <p className="text-[11px] text-muted mt-1 line-clamp-1 italic">"{event.notes}"</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-bg px-3 py-1.5 rounded-lg text-sm font-bold text-text flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted" />
                      {event.time}
                    </div>
                    <div className="text-[10px] font-bold text-muted uppercase">
                      {event.date === todayStr ? t('Today') : event.date.split('-').slice(1).join('/')}
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="bg-card p-8 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center">
                <CalendarDays className="w-12 h-12 text-muted/30 mb-3" />
                <p className="text-sm text-muted font-medium">{t('No upcoming events.')}<br/>{t('Tap a date to schedule.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-card rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-text">
                  {isEditModalOpen ? t('Edit Event') : t('Add Event')}
                </h3>
                <button 
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg transition-colors"
                >
                  <X className="w-6 h-6 text-muted" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Event Type Selector */}
                <div className="grid grid-cols-4 gap-2">
                  {EVENT_TYPES.map(type => {
                    const Icon = type.icon;
                    const isActive = formType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setFormType(type.id as any)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                          isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary text-white' : 'bg-bg text-muted'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-muted'}`}>
                          {t(type.label)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Event Title */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2 tracking-wider">{t('Event Title')}</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={t("e.g. 1st Round Interview")}
                    className="w-full p-4 rounded-2xl border border-border bg-bg text-text outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* School Search */}
                <div className="relative">
                  <label className="block text-xs font-bold text-muted uppercase mb-2 tracking-wider">{t('School Name')}</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input 
                      type="text" 
                      value={formSchool}
                      onChange={(e) => {
                        setFormSchool(e.target.value);
                        setSchoolSearch(e.target.value);
                        setShowSchoolResults(true);
                      }}
                      onFocus={() => setShowSchoolResults(true)}
                      placeholder={t('Search School')}
                      className="w-full p-4 pl-12 rounded-2xl border border-border bg-bg text-text outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  {showSchoolResults && schoolSearch && (
                    <div className="absolute z-10 left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredSchools.map(school => (
                        <button
                          key={school}
                          onClick={() => {
                            setFormSchool(school);
                            setShowSchoolResults(false);
                          }}
                          className="w-full p-4 text-left hover:bg-bg text-sm font-medium text-text border-b border-border last:border-0"
                        >
                          {school}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2 tracking-wider">{t('Time')}</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <select 
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full p-4 pl-12 rounded-2xl border border-border bg-bg text-text outline-none focus:border-primary appearance-none transition-colors"
                      >
                        {Array.from({ length: 24 * 4 }).map((_, i) => {
                          const hour = Math.floor(i / 4).toString().padStart(2, '0');
                          const min = ((i % 4) * 15).toString().padStart(2, '0');
                          const time = `${hour}:${min}`;
                          return <option key={time} value={time}>{time}</option>;
                        })}
                      </select>
                    </div>
                    <div className="bg-primary/10 px-4 py-4 rounded-2xl text-primary font-bold">
                      {formTime}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2 tracking-wider">{t('Notes')}</label>
                  <textarea 
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder={t("Add any details...")}
                    rows={3}
                    className="w-full p-4 rounded-2xl border border-border bg-bg text-text outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-bg/50 border-t border-border flex gap-3">
                {isEditModalOpen && (
                  <button 
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="w-14 h-14 flex items-center justify-center rounded-2xl text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
                <button 
                  onClick={isEditModalOpen ? handleEditEvent : handleAddEvent}
                  disabled={!formTitle}
                  className="flex-1 h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {t('Save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-card rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 text-danger dark:text-white flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">{t('Delete Event')}</h3>
              <p className="text-muted text-sm mb-8 leading-relaxed">
                {t('Are you sure you want to delete this event?')}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteEvent}
                  className="w-full py-4 bg-[#ff8c2c] text-[#ffffff] font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  {t('Confirm')}
                </button>
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="w-full py-4 bg-bg text-text font-bold rounded-2xl hover:bg-border transition-all"
                >
                  {t('Cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
