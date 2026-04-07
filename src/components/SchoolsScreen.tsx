import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Phone, Globe, ExternalLink, Bookmark, BookmarkCheck, X, ChevronRight, Navigation, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, getDocs, addDoc } from 'firebase/firestore';
import { SchoolData } from '../types';
import { SchoolDetailModal } from './SchoolComponents';

const EDB_API_URL = '/api/edb/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json';

export default function SchoolsScreen({ onShowToast, setHideBottomNav }: { onShowToast?: (msg: string) => void, setHideBottomNav?: (hide: boolean) => void }) {
  const { t, i18n } = useTranslation();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFinance, setSelectedFinance] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  useEffect(() => {
    if (setHideBottomNav) {
      setHideBottomNav(isFilterOpen);
    }
  }, [isFilterOpen, setHideBottomNav]);

  useEffect(() => {
    return () => {
      if (setHideBottomNav) {
        setHideBottomNav(false);
      }
    };
  }, [setHideBottomNav]);

  const getLocalizedValue = (s: SchoolData, zhKey: keyof SchoolData, enKey: keyof SchoolData, fallbackZhKey?: keyof SchoolData, fallbackEnKey?: keyof SchoolData) => {
    if (i18n.language === 'zh') {
      return String(s[zhKey] || (fallbackZhKey ? s[fallbackZhKey] : '') || s[enKey] || (fallbackEnKey ? s[fallbackEnKey] : '') || '');
    } else {
      return String(s[enKey] || (fallbackEnKey ? s[fallbackEnKey] : '') || s[zhKey] || (fallbackZhKey ? s[fallbackZhKey] : '') || '');
    }
  };

  useEffect(() => {
    setSelectedDistrict('');
    setSelectedCategory('');
    setSelectedFinance('');
    setSelectedGender('');
  }, [i18n.language]);

  useEffect(() => {
    fetch(EDB_API_URL)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setSchools(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching schools:', err);
        setError('Failed to load schools data. Please try again later.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'saved_schools'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setSavedIds(new Set(data.map(item => item.school_id)));
    });

    return () => unsubscribe();
  }, []);

  const [savingLocks, setSavingLocks] = useState<Set<string>>(new Set());

  const toggleSave = async (e: React.MouseEvent, school: SchoolData) => {
    e.stopPropagation();
    const schoolId = String(school["SCHOOL NO."]); // Unique ID
    
    if (savingLocks.has(schoolId)) return; // Prevent concurrent saves
    
    const user = auth.currentUser;
    if (!user) return;
    
    const isCurrentlySaved = savedIds.has(schoolId);

    // Optimistic update
    setSavedIds(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) {
        newSet.delete(schoolId);
      } else {
        newSet.add(schoolId);
      }
      return newSet;
    });
    
    setSavingLocks(prev => new Set(prev).add(schoolId));
    
    try {
      const q = query(collection(db, 'saved_schools'), where('user_id', '==', user.uid), where('school_id', '==', schoolId));
      const querySnapshot = await getDocs(q);
      
      if (isCurrentlySaved) {
        // Unsave
        querySnapshot.forEach(async (docSnap) => {
          await deleteDoc(docSnap.ref);
        });
      } else {
        // Save
        // First delete any potential duplicates just to be safe
        querySnapshot.forEach(async (docSnap) => {
          await deleteDoc(docSnap.ref);
        });
        
        await addDoc(collection(db, 'saved_schools'), {
          user_id: user.uid,
          school_id: schoolId,
          school_data: school
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setSavingLocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(schoolId);
        return newSet;
      });
    }
  };

  const [visibleCount, setVisibleCount] = useState(50);

  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const chineseName = s["中文名稱"] || s["CHINESE NAME"] || "";
      const englishName = s["ENGLISH NAME"] || "";
      const matchesSearch = chineseName.includes(search) || englishName.toLowerCase().includes(search.toLowerCase());
      
      const district = getLocalizedValue(s, "分區" as keyof SchoolData, "DISTRICT" as keyof SchoolData);
      const matchesDistrict = !selectedDistrict || district === selectedDistrict;
      
      const category = getLocalizedValue(s, "中文類別" as keyof SchoolData, "ENGLISH CATEGORY" as keyof SchoolData, "CHINESE CATEGORY" as keyof SchoolData, "CATEGORY (ENGLISH)" as keyof SchoolData);
      const matchesCategory = !selectedCategory || category === selectedCategory;
      
      const finance = getLocalizedValue(s, "資助種類" as keyof SchoolData, "FINANCE TYPE" as keyof SchoolData);
      const matchesFinance = !selectedFinance || finance === selectedFinance;
      
      const gender = getLocalizedValue(s, "就讀學生性別" as keyof SchoolData, "STUDENT GENDER" as keyof SchoolData, undefined, "GENDER" as keyof SchoolData);
      const matchesGender = !selectedGender || gender === selectedGender;
      
      return matchesSearch && matchesDistrict && matchesCategory && matchesFinance && matchesGender;
    });
  }, [schools, search, selectedDistrict, selectedCategory, selectedFinance, selectedGender, i18n.language]);

  const displayedSchools = useMemo(() => {
    return filteredSchools.slice(0, visibleCount);
  }, [filteredSchools, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const districts = useMemo(() => {
    return Array.from(new Set(schools.map(s => getLocalizedValue(s, "分區" as keyof SchoolData, "DISTRICT" as keyof SchoolData)).filter(Boolean))).sort();
  }, [schools, i18n.language]);

  const categories = useMemo(() => {
    return Array.from(new Set(schools.map(s => getLocalizedValue(s, "中文類別" as keyof SchoolData, "ENGLISH CATEGORY" as keyof SchoolData, "CHINESE CATEGORY" as keyof SchoolData, "CATEGORY (ENGLISH)" as keyof SchoolData)).filter(Boolean))).sort();
  }, [schools, i18n.language]);

  const financeTypes = useMemo(() => {
    return Array.from(new Set(schools.map(s => getLocalizedValue(s, "資助種類" as keyof SchoolData, "FINANCE TYPE" as keyof SchoolData)).filter(Boolean))).sort();
  }, [schools, i18n.language]);

  const genders = useMemo(() => {
    return Array.from(new Set(schools.map(s => getLocalizedValue(s, "就讀學生性別" as keyof SchoolData, "STUDENT GENDER" as keyof SchoolData, undefined, "GENDER" as keyof SchoolData)).filter(Boolean))).sort();
  }, [schools, i18n.language]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
        <p className="text-muted text-sm font-bold uppercase tracking-widest">Loading Schools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-bg p-6 text-center">
        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-2">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text">Oops!</h2>
        <p className="text-muted text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="p-5 pt-6 sticky top-0 bg-bg/90 backdrop-blur-md z-10 pb-2">
        <h2 className="text-[22px] font-black text-text tracking-tight mb-4">School Search</h2>
        
        {/* Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-text outline-none focus:border-primary transition-colors shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-transform flex-shrink-0 relative"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {(selectedDistrict || selectedCategory || selectedFinance || selectedGender) && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger border-2 border-primary rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
          {filteredSchools.length} Schools Found
        </div>
        <div className="space-y-3">
          {displayedSchools.map((school, idx) => {
            const isSaved = savedIds.has(String(school["SCHOOL NO."]));
            const schoolName = getLocalizedValue(school, "中文名稱" as keyof SchoolData, "ENGLISH NAME" as keyof SchoolData, "CHINESE NAME" as keyof SchoolData, "NAME (ENGLISH)" as keyof SchoolData) || "Unknown School";
            const category = getLocalizedValue(school, "中文類別" as keyof SchoolData, "ENGLISH CATEGORY" as keyof SchoolData, "CHINESE CATEGORY" as keyof SchoolData, "CATEGORY (ENGLISH)" as keyof SchoolData) || "Unknown Category";
            const district = getLocalizedValue(school, "分區" as keyof SchoolData, "DISTRICT" as keyof SchoolData) || "Unknown District";
            
            return (
              <div
                key={`${school["SCHOOL NO."]}-${idx}`}
                onClick={() => setSelectedSchool(school)}
                className="bg-card p-4 rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-sm">
                    {category}
                  </div>
                  <button
                    onClick={(e) => toggleSave(e, school)}
                    className={`p-1.5 rounded-full transition-colors ${isSaved ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
                <h3 className="text-[15px] font-bold text-text leading-tight mb-2 pr-6">
                  {schoolName}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-muted font-medium">
                  <MapPin className="w-3 h-3" />
                  {district}
                </div>
              </div>
            );
          })}
        </div>
        
        {visibleCount < filteredSchools.length && (
          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleLoadMore}
              className="px-6 py-3 bg-card border border-border text-primary font-bold rounded-full shadow-sm active:scale-95 transition-transform"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSchool && (
          <SchoolDetailModal
            school={selectedSchool}
            onClose={() => setSelectedSchool(null)}
            isSaved={savedIds.has(String(selectedSchool["SCHOOL NO."]))}
            onToggleSave={(e: React.MouseEvent) => toggleSave(e, selectedSchool)}
          />
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsFilterOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text">{t('Advanced Filters')}</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-bg rounded-full text-muted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {/* District Filter */}
                <div>
                  <h4 className="text-sm font-bold text-text mb-3">{t('District')}</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDistrict('')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${!selectedDistrict ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                    >
                      {t('All')}
                    </button>
                    {districts.map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDistrict(d)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${selectedDistrict === d ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h4 className="text-sm font-bold text-text mb-3">{t('School Category')}</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${!selectedCategory ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                    >
                      {t('All')}
                    </button>
                    {categories.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${selectedCategory === c ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                      >
                        {t(c)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Finance Type Filter */}
                <div>
                  <h4 className="text-sm font-bold text-text mb-3">{t('Finance Type')}</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedFinance('')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${!selectedFinance ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                    >
                      {t('All')}
                    </button>
                    {financeTypes.map(f => (
                      <button
                        key={f}
                        onClick={() => setSelectedFinance(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${selectedFinance === f ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                      >
                        {t(f)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Filter */}
                <div>
                  <h4 className="text-sm font-bold text-text mb-3">{t('Student Gender')}</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedGender('')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${!selectedGender ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                    >
                      {t('All')}
                    </button>
                    {genders.map(g => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${selectedGender === g ? 'bg-primary text-white border-primary' : 'bg-bg text-muted border-border'}`}
                      >
                        {t(g)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedDistrict('');
                    setSelectedCategory('');
                    setSelectedFinance('');
                    setSelectedGender('');
                  }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-muted bg-bg border border-border"
                >
                  {t('Reset')}
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-primary shadow-md"
                >
                  {t('Apply Filters')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
