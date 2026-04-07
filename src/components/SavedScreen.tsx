import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import { SchoolData } from '../types';
import { SchoolDetailModal } from './SchoolComponents';

export default function SavedScreen() {
  const { t, i18n } = useTranslation();
  const [savedSchools, setSavedSchools] = useState<{ id: string, data: SchoolData }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'saved_schools'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      const uniqueSchools = Array.from(new Map(data.map(item => [item.school_id, item])).values());
      setSavedSchools(uniqueSchools.map(item => ({
        id: item.school_id,
        data: item.school_data as SchoolData
      })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [savingLocks, setSavingLocks] = useState<Set<string>>(new Set());

  const handleUnsave = async (e: React.MouseEvent, schoolId: string) => {
    e.stopPropagation();
    if (savingLocks.has(schoolId)) return;
    
    const user = auth.currentUser;
    if (!user) return;

    // Optimistic update
    setSavedSchools(prev => prev.filter(s => s.id !== schoolId));
    setSavingLocks(prev => new Set(prev).add(schoolId));

    try {
      const q = query(collection(db, 'saved_schools'), where('user_id', '==', user.uid), where('school_id', '==', schoolId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
    } catch (error) {
      console.error('Error unsaving school:', error);
    } finally {
      setSavingLocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(schoolId);
        return newSet;
      });
    }
  };

  const getLocalizedValue = (s: SchoolData, zhKey: keyof SchoolData, enKey: keyof SchoolData, fallbackZhKey?: keyof SchoolData, fallbackEnKey?: keyof SchoolData) => {
    if (i18n.language === 'zh') {
      return String(s[zhKey] || (fallbackZhKey ? s[fallbackZhKey] : '') || s[enKey] || (fallbackEnKey ? s[fallbackEnKey] : '') || '');
    } else {
      return String(s[enKey] || (fallbackEnKey ? s[fallbackEnKey] : '') || s[zhKey] || (fallbackZhKey ? s[fallbackZhKey] : '') || '');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="p-5 pt-6 sticky top-0 bg-bg/90 backdrop-blur-md z-10 pb-4">
        <h2 className="text-[22px] font-black text-text tracking-tight">Saved Schools</h2>
        <div className="text-xs font-bold text-muted mt-1 uppercase tracking-wider">
          {savedSchools.length} Schools Saved
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {savedSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center text-muted shadow-sm border border-border">
              <Bookmark className="w-10 h-10" />
            </div>
            <p className="text-muted font-medium">{t('No saved schools yet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {savedSchools.map((item) => {
                const school = item.data;
                const schoolName = getLocalizedValue(school, "中文名稱" as keyof SchoolData, "ENGLISH NAME" as keyof SchoolData, "CHINESE NAME" as keyof SchoolData, "NAME (ENGLISH)" as keyof SchoolData) || "Unknown School";
                const category = getLocalizedValue(school, "中文類別" as keyof SchoolData, "ENGLISH CATEGORY" as keyof SchoolData, "CHINESE CATEGORY" as keyof SchoolData, "CATEGORY (ENGLISH)" as keyof SchoolData) || "Unknown Category";
                const district = getLocalizedValue(school, "分區" as keyof SchoolData, "DISTRICT" as keyof SchoolData) || "Unknown District";

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedSchool(school)}
                    className="bg-card p-4 rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-sm">
                        {category}
                      </div>
                      <button
                        onClick={(e) => handleUnsave(e, item.id)}
                        className="p-1.5 rounded-full transition-colors bg-primary/10 text-primary"
                      >
                        <BookmarkCheck className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-[15px] font-bold text-text leading-tight mb-2 pr-6">
                      {schoolName}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-muted font-medium">
                      <MapPin className="w-3 h-3" />
                      {district}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedSchool && (
          <SchoolDetailModal
            school={selectedSchool}
            onClose={() => setSelectedSchool(null)}
            isSaved={true}
            onToggleSave={(e) => {
              const id = String(selectedSchool["SCHOOL NO."]);
              handleUnsave(e, id);
              setSelectedSchool(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
