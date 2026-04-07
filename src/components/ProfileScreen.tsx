import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, User, Save, LogOut, CheckCircle2, ChevronRight, Moon, Globe, Download, Shield, Languages, X, Lock, Key, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword, updateProfile } from 'firebase/auth';
import Cropper from 'react-easy-crop';
import { UserProfile } from '../types';

export default function ProfileScreen({ profile, setProfile, onLogout, toggleTheme, isDarkMode, onShowToast }: { 
  profile: UserProfile | null, 
  setProfile: (p: UserProfile) => void, 
  onLogout: () => void, 
  toggleTheme: () => void, 
  isDarkMode: boolean,
  onShowToast?: (msg: string) => void
}) {
  const { t, i18n } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Username Modal
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.display_name || '');

  // Language Modal
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [tempLang, setTempLang] = useState(i18n.language);

  // Privacy Modal
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Crop Modal
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleUpdateUsername = async () => {
    if (!profile || !newUsername.trim()) return;
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: newUsername.trim() });
      }
      const docRef = doc(db, 'profiles', profile.id);
      await updateDoc(docRef, { display_name: newUsername.trim() });

      setIsUsernameModalOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error updating username:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string);
    });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleUploadCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels || !profile) return;
    
    setUploading(true);
    setImageToCrop(null); 
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');

      const fileName = `${profile.id}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `avatars/${fileName}`);

      await uploadBytes(storageRef, croppedBlob);
      const publicUrl = await getDownloadURL(storageRef);

      const docRef = doc(db, 'profiles', profile.id);
      // Use setDoc with merge to be more robust than updateDoc
      await setDoc(docRef, { avatar_path: publicUrl }, { merge: true });
      
      if (onShowToast) onShowToast(t('Profile picture updated!'));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      if (onShowToast) onShowToast(t('Upload failed: ') + (error.message || t('Unknown error')));
    } finally {
      // Ensure uploading is ALWAYS set to false
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage(t('Password must be at least 6 characters'));
      return;
    }
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        setPasswordMessage(t('Password updated successfully'));
        setNewPassword('');
        setTimeout(() => {
          setIsPrivacyModalOpen(false);
          setPasswordMessage('');
        }, 2000);
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setPasswordMessage(t('Please sign out and sign in again to change password'));
      } else {
        setPasswordMessage(error.message);
      }
    }
  };

  const applyLanguage = () => {
    i18n.changeLanguage(tempLang);
    setIsLangModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="p-5 pt-6 sticky top-0 bg-bg/90 backdrop-blur-md z-10 pb-4">
        <h2 className="text-[22px] font-black text-text tracking-tight">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-card border-4 border-white shadow-md relative">
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
                  <User className="w-12 h-12" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform border-2 border-white">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} disabled={uploading} />
            </label>
          </div>
          
          <div className="w-full flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-text">
                {profile?.display_name || 'User'}
              </h2>
              <button
                onClick={() => {
                  setNewUsername(profile?.display_name || '');
                  setIsUsernameModalOpen(true);
                }}
                className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            {saved && <div className="text-[12px] text-primary font-bold mt-1">Saved!</div>}
          </div>
        </div>

        {/* Settings */}
        <div className="mb-8">
          <h3 className="text-sm font-extrabold text-text mb-3 px-1">Settings</h3>
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <SettingItem 
              icon={<Moon className="w-5 h-5 text-primary" />} 
              label="Dark Mode" 
              onClick={toggleTheme}
              rightElement={
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-primary' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              }
            />
            <SettingItem 
              icon={<Languages className="w-5 h-5 text-[#4A90E2]" />} 
              label={t('Language')} 
              onClick={() => {
                setTempLang(i18n.language);
                setIsLangModalOpen(true);
              }}
              rightElement={<span className="text-xs font-bold text-muted">{i18n.language === 'zh' ? '繁體中文' : 'English'}</span>}
            />
            <SettingItem 
              icon={<Download className="w-5 h-5 text-[#9B51E0]" />} 
              label="Offline Data" 
              onClick={() => {}}
              rightElement={<span className="text-xs font-bold text-muted">12.4 MB</span>}
            />
            <SettingItem 
              icon={<Key className="w-5 h-5 text-primary" />} 
              label={t('Change Password')} 
              onClick={() => setIsPrivacyModalOpen(true)}
            />
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          className="w-full bg-card dark:bg-card text-[#FF3B30] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-border dark:border-border shadow-sm hover:bg-[#FF3B30]/10 transition-colors"
        >
          <LogOut className="w-5 h-5 text-[#FF3B30]" />
          {t('Sign Out')}
        </button>
      </div>

      {/* Username Modal */}
      <AnimatePresence>
        {isUsernameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUsernameModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl p-6 relative z-10 w-full max-w-sm shadow-xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text">{t('Edit Username')}</h3>
                <button onClick={() => setIsUsernameModalOpen(false)} className="p-2 bg-bg rounded-full text-muted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-muted mb-2">{t('New Username')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={t('New Username')}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-bg text-text outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsUsernameModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-muted bg-bg border border-border"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleUpdateUsername}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-primary shadow-md"
                >
                  {t('Update')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {isLangModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLangModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl p-6 relative z-10 w-full max-w-sm shadow-xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text">{t('Language')}</h3>
                <button onClick={() => setIsLangModalOpen(false)} className="p-2 bg-bg rounded-full text-muted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 mb-8">
                <button
                  onClick={() => setTempLang('zh')}
                  className={`w-full p-4 rounded-2xl font-bold border-2 transition-colors flex justify-between items-center ${tempLang === 'zh' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-bg text-text'}`}
                >
                  <span>繁體中文</span>
                  {tempLang === 'zh' && <CheckCircle2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setTempLang('en')}
                  className={`w-full p-4 rounded-2xl font-bold border-2 transition-colors flex justify-between items-center ${tempLang === 'en' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-bg text-text'}`}
                >
                  <span>English</span>
                  {tempLang === 'en' && <CheckCircle2 className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLangModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-muted bg-bg border border-border"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={applyLanguage}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-primary shadow-md"
                >
                  {t('Save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy & Security Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl p-6 relative z-10 w-full max-w-sm shadow-xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text">{t('Change Password')}</h3>
                <button onClick={() => setIsPrivacyModalOpen(false)} className="p-2 bg-bg rounded-full text-muted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-muted mb-2">{t('Change Password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('New Password (min 6 chars)')}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-bg text-text outline-none focus:border-primary transition-colors"
                  />
                </div>
                {passwordMessage && (
                  <p className={`mt-2 text-sm font-bold ${passwordMessage.includes('success') || passwordMessage.includes('成功') ? 'text-success' : 'text-danger'}`}>
                    {passwordMessage}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-muted bg-bg border border-border"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-primary shadow-md"
                >
                  {t('Update')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {imageToCrop && (
          <div className="fixed inset-0 z-[60] flex flex-col bg-black">
            <div className="flex-1 relative">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="bg-card p-6 pb-safe rounded-t-3xl relative z-10">
              <div className="mb-6">
                <label className="text-sm font-bold text-muted block mb-2">{t('Zoom')}</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setImageToCrop(null)}
                  className="flex-1 py-4 rounded-xl font-bold text-text bg-bg border border-border"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleUploadCroppedImage}
                  disabled={uploading}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-primary shadow-md disabled:opacity-50"
                >
                  {uploading ? t('Uploading...') : t('Save Photo')}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingItem({ icon, label, onClick, rightElement }: { icon: React.ReactNode, label: string, onClick: () => void, rightElement?: React.ReactNode }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 border-b border-border last:border-0 active:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-bg flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-bold text-text">{label}</span>
      </div>
      {rightElement || <ChevronRight className="w-5 h-5 text-muted" />}
    </div>
  );
}
