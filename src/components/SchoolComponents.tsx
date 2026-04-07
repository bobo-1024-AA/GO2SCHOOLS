import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Bookmark, BookmarkCheck, ChevronRight, Phone, Globe, Navigation, ExternalLink, Share2, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { SchoolData } from '../types';

export function SchoolCard({ school, isSaved, onToggleSave, onClick }: any) {
  const { i18n } = useTranslation();
  const name = (i18n.language === 'zh' ? (school["中文名稱"] || school["CHINESE NAME"]) : (school["ENGLISH NAME"] || school["NAME (ENGLISH)"])) || school["ENGLISH NAME"] || school["中文名稱"] || "Unknown School";
  const category = (i18n.language === 'zh' ? (school["中文類別"] || school["CHINESE CATEGORY"]) : (school["ENGLISH CATEGORY"] || school["CATEGORY (ENGLISH)"])) || school["ENGLISH CATEGORY"] || school["中文類別"] || "Unknown Category";
  const district = school["分區"] || school["DISTRICT"] || "Unknown District";
  
  return (
    <div
      onClick={onClick}
      className="bg-card p-4 rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-sm">
          {category}
        </div>
        <button
          onClick={onToggleSave}
          className={`p-1.5 rounded-full transition-colors ${isSaved ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
      <h3 className="text-[15px] font-bold text-text leading-tight mb-2 pr-6">
        {name}
      </h3>
      <div className="flex items-center gap-1 text-[11px] text-muted font-medium">
        <MapPin className="w-3 h-3" />
        {district}
      </div>
    </div>
  );
}

export function SchoolDetailModal({ school, onClose, isSaved, onToggleSave }: { school: SchoolData, onClose: () => void, isSaved: boolean, onToggleSave: (e: React.MouseEvent) => void }) {
  const { t, i18n } = useTranslation();
  const name = (i18n.language === 'zh' ? (school["中文名稱"] || school["CHINESE NAME"]) : (school["ENGLISH NAME"] || school["NAME (ENGLISH)"])) || school["ENGLISH NAME"] || school["中文名稱"] || "Unknown School";
  const address = (i18n.language === 'zh' ? (school["中文地址"] || school["CHINESE ADDRESS"]) : (school["ENGLISH ADDRESS"] || school["ADDRESS (ENGLISH)"])) || school["ENGLISH ADDRESS"] || school["中文地址"] || "Unknown Address";
  const district = school["分區"] || school["DISTRICT"];
  const telephone = school["聯絡電話"] || school["TELEPHONE"];

  const handleCall = () => {
    window.open(`tel:${telephone}`, '_self');
  };

  const handleShare = async () => {
    const shareData = {
      title: name,
      text: `Check out this school: ${name}\nAddress: ${address}\nPhone: ${telephone}`,
      url: school["WEBSITE"] || window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        // Ideally show a toast here, but for now just alert-free fallback
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const openMaps = () => {
    const query = encodeURIComponent(name + " " + address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-bg rounded-t-[32px] p-6 relative z-10 max-h-[90vh] overflow-y-auto flex flex-col"
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
        
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-black text-text leading-tight mb-2">{name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-sm uppercase">{school["資助種類"] || school["FINANCE TYPE"]}</span>
              <span className="bg-[#4A90E2]/10 text-[#4A90E2] text-[10px] font-bold px-2 py-1 rounded-sm uppercase">{school["學校類型"] || school["SCHOOL LEVEL"]}</span>
              <span className="bg-[#9B51E0]/10 text-[#9B51E0] text-[10px] font-bold px-2 py-1 rounded-sm uppercase">{school["就讀學生性別"] || school["STUDENT GENDER"] || school["GENDER"]}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">{t('District')}</p>
                <p className="text-sm text-text font-bold">{district}</p>
                <p className="text-[13px] text-muted mt-1 leading-relaxed">{address}</p>
              </div>
            </div>
            <div className="h-px bg-border w-full" />
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">{t('Call')}</p>
                <p className="text-sm text-text font-bold">{telephone}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <ActionButton icon={<Phone />} label={t('Call')} onClick={handleCall} />
            <ActionButton icon={<Navigation />} label={t('Directions')} onClick={openMaps} />
            <ActionButton icon={<Globe />} label={t('Website')} onClick={() => window.open(school["WEBSITE"], '_blank')} />
            <ActionButton icon={<Share2 />} label={t('Share')} onClick={handleShare} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-text px-1">{t('Additional Info')}</h3>
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <InfoRow label={t('School No.')} value={school["SCHOOL NO."]} />
              <InfoRow label={t('Session')} value={(i18n.language === 'zh' ? school["學校授課時間"] : school["SESSION"]) || school["SESSION"] || school["學校授課時間"]} />
              <InfoRow label={t('Religion')} value={(i18n.language === 'zh' ? school["宗教"] : school["RELIGION"]) || school["RELIGION"] || school["宗教"]} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 bg-card text-text py-4 rounded-2xl font-bold border border-border shadow-sm hover:bg-gray-50 transition-colors"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={onToggleSave}
            className={`flex-1 py-4 rounded-2xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 ${isSaved ? 'bg-card text-primary border border-primary/20' : 'bg-primary text-white'}`}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            {isSaved ? t('Saved School') : t('Save School')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-3 bg-card border border-border rounded-2xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
    >
      <div className="text-primary">{icon}</div>
      <span className="text-[10px] font-bold uppercase text-muted">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-0">
      <span className="text-sm font-bold text-muted">{label}</span>
      <span className="text-sm font-bold text-text">{value || '-'}</span>
    </div>
  );
}
