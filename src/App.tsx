/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import './lib/i18n';
import { Home, Search, Heart, User, GraduationCap, ArrowLeft, UserCheck, FileText, Users, Database, AlertOctagon, Shield, Activity, Share2, CheckCircle2, Slash, Check, BarChart2, History, UserCog, UserCircle, Gavel, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './components/HomeScreen';
import SchoolsScreen from './components/SchoolsScreen';
import SavedScreen from './components/SavedScreen';
import ProfileScreen from './components/ProfileScreen';
import NotificationsScreen from './components/NotificationsScreen';
import CalendarScreen from './components/CalendarScreen';
import ArticleScreen from './components/ArticleScreen';
import { UserProfile } from './types';

const TabsContent = ({ activeTab, profile, showToast, handleNavigate, setProfile, handleLogout, toggleTheme, isDarkMode, setHideBottomNav }: { 
  activeTab: string, 
  profile: UserProfile | null, 
  showToast: (msg: string) => void, 
  handleNavigate: (screen: string, param?: string) => void,
  setProfile: (p: UserProfile) => void,
  handleLogout: () => void,
  toggleTheme: () => void,
  isDarkMode: boolean,
  setHideBottomNav: (hide: boolean) => void
}) => {
  switch (activeTab) {
    case 'home': return <HomeScreen profile={profile} onShowToast={showToast} onNavigate={handleNavigate} />;
    case 'schools': return <SchoolsScreen onShowToast={showToast} setHideBottomNav={setHideBottomNav} />;
    case 'favorites': return <SavedScreen />;
    case 'profile': return <ProfileScreen profile={profile} setProfile={setProfile} onLogout={handleLogout} toggleTheme={toggleTheme} isDarkMode={isDarkMode} onShowToast={showToast} />;
    default: return <HomeScreen profile={profile} onShowToast={showToast} onNavigate={handleNavigate} />;
  }
};

export default function App() {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState('welcome'); // welcome, login, terms, privacy, tabs, notifications, calendar, article
  const [activeTab, setActiveTab] = useState('home');
  const [activeArticle, setActiveArticle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('user@hkmu.edu.hk');
  const [password, setPassword] = useState('COMP3130sef');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hideBottomNav, setHideBottomNav] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setSession(user);
      if (user) {
        setActiveScreen('tabs');
      } else {
        setProfile(null);
        setActiveScreen('welcome');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!session) return;

    const docRef = doc(db, 'profiles', session.uid);
    const unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile = {
          id: session.uid,
          display_name: session.displayName || 'User',
          avatar_path: session.photoURL || '',
          role: 'user'
        };
        try {
          await setDoc(docRef, newProfile);
          setProfile(newProfile as UserProfile);
        } catch (err) {
          console.error("Error creating profile:", err);
          showToast(t("Database connection failed. Please check your internet or Firebase setup."));
        }
      }
    }, (error) => {
      console.error("Profile snapshot error:", error);
      if (error.code === 'unavailable') {
        showToast(t("Database is currently unavailable. Operating in offline mode."));
      } else {
        showToast(t("Connection error: ") + error.message);
      }
    });

    return () => unsubscribeProfile();
  }, [session]);

  const handleLogin = async () => {
    setAuthError(null);
    if (!email || !password) {
      setAuthError('Email and password required');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. If you are new, please click "Create New Account".');
      } else {
        setAuthError(error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleSignUp = async () => {
    setAuthError(null);
    if (!email || !password) {
      setAuthError('Email and password required');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      alert('Registration successful! Logging you in...');
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderWelcome = () => (
    <div className="flex flex-col flex-1 bg-bg p-8 items-center justify-center">
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <div className="bg-[#FFF1E0] p-8 rounded-3xl mb-6 text-primary">
          <GraduationCap className="w-16 h-16" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-extrabold text-primary mb-2">GO2Schools</h1>
        <p className="text-lg text-[#5B697B] tracking-wide font-semibold">Let's GO 2 SCHOOL</p>
      </div>
      <div className="w-full text-center mt-auto">
        <button onClick={() => setActiveScreen('login')} className="btn mb-5">Get Started</button>
        <p className="text-xs text-muted leading-relaxed">
          By continuing, you agree to our<br />
          <span className="text-primary font-semibold cursor-pointer" onClick={() => setActiveScreen('terms')}>Terms of Service</span> and <span className="text-primary font-semibold cursor-pointer" onClick={() => setActiveScreen('privacy')}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="flex flex-col flex-1 bg-bg">
      <div className="flex items-center p-4 bg-card border-b border-border sticky top-0 z-10">
        <button onClick={() => setActiveScreen('welcome')} className="flex items-center justify-center w-10 h-10 text-primary rounded-xl -ml-2 hover:bg-primary/10 transition-colors">
          <ArrowLeft className="w-6 h-6" strokeWidth={3} />
        </button>
        <h2 className="text-xl font-bold ml-2 text-text">Account Access</h2>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="bg-[#FFF1E0] p-6 rounded-[20px] mb-8 text-primary">
          <UserCheck className="w-10 h-10" />
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="w-full flex flex-col items-center">
          <div className="w-full mb-5">
            <label className="block text-xs font-bold text-muted uppercase mb-2">Email Address</label>
            <input
              type="email"
              placeholder="e.g. parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl border border-border bg-white text-base outline-none focus:border-primary transition-colors text-text"
            />
          </div>

          <div className="w-full mb-8">
            <label className="block text-xs font-bold text-muted uppercase mb-2">Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl border border-border bg-white text-base outline-none focus:border-primary transition-colors text-text"
            />
          </div>

          {authError && <div className="text-danger text-sm font-semibold mb-6 text-center">{authError}</div>}

          <button type="submit" className="btn mb-4">Sign In</button>
          
          <div className="w-full flex items-center gap-3 mb-4">
            <div className="flex-1 h-[1px] bg-border"></div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">OR</span>
            <div className="flex-1 h-[1px] bg-border"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            className="w-full p-4 rounded-[30px] text-text font-bold text-lg border-[1.5px] border-border bg-white flex items-center justify-center gap-3 mb-4 active:scale-95 transition-transform"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>

          <button type="button" onClick={handleSignUp} className="w-full p-4 rounded-[30px] text-primary font-bold text-lg border-[1.5px] border-primary bg-white active:scale-95 transition-transform">Create New Account</button>
        </form>
        
        <div className="mt-6 text-[13px] text-muted text-center">Secure authentication powered by Firebase</div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="flex flex-col flex-1 bg-[#F8F9FA] overflow-y-auto">
      <div className="flex items-center px-5 h-[60px] bg-[#F8F9FA] sticky top-0 z-10">
        <button onClick={() => setActiveScreen('welcome')} className="flex items-center justify-center w-11 h-11 text-[#F05A28] rounded-xl -ml-2 hover:bg-[#F05A28]/10 transition-colors">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <h2 className="text-[17px] font-semibold ml-2 text-[#1A1A1A]">Terms of Service</h2>
      </div>
      <div className="p-6 pb-12">
        <div className="flex items-center mb-8">
          <div className="w-1.5 h-8 bg-[#F05A28] rounded-full mr-4"></div>
          <h1 className="text-[28px] font-bold text-[#F05A28]">Terms of Service</h1>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EAEAEA] border-t-4 border-t-[#F05A28] p-6 mb-6">
          <h3 className="flex items-center gap-3 text-lg font-bold text-[#1A1A1A] mb-4">
            <FileText className="w-5 h-5 text-[#F05A28]" strokeWidth={2.5} /> 1. Introduction
          </h3>
          <p className="text-[14px] text-[#4A4A4A] leading-loose mb-4 font-serif">
            Welcome to GO2Schools. By accessing or using our platform, you signify that you have read, understood, and agree to be bound by these Terms of Service. This is a legally binding agreement between you and GO2Schools.
          </p>
          <p className="text-[14px] text-[#4A4A4A] leading-loose font-serif">
            Our mission is to provide an editorial-grade encyclopedia of educational institutions, helping parents and students make informed decisions through curated data and community insights.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-[#F4F5F7] rounded-2xl p-6 mb-6">
          <h3 className="flex items-center gap-3 text-lg font-bold text-[#1A1A1A] mb-5">
            <UserCircle className="w-5 h-5 text-[#F05A28]" strokeWidth={2.5} /> 2. User Accounts
          </h3>
          <div className="mb-5">
            <div className="font-bold text-[#A52A2A] text-[15px] mb-2">For Parents</div>
            <p className="text-[14px] text-[#4A4A4A] leading-relaxed">
              Parents are responsible for maintaining the confidentiality of their account credentials and ensuring that information provided for school matches is accurate and updated.
            </p>
          </div>
          <div>
            <div className="font-bold text-[#A52A2A] text-[15px] mb-2">For Administrators</div>
            <p className="text-[14px] text-[#4A4A4A] leading-relaxed">
              School administrators must represent their institutions truthfully. Unauthorized claim of school profiles is strictly prohibited and subject to legal action.
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EAEAEA] p-6 mb-6">
          <h3 className="flex items-center gap-3 text-lg font-bold text-[#1A1A1A] mb-4">
            <Database className="w-5 h-5 text-[#F05A28]" strokeWidth={2.5} /> 3. Content & Data
          </h3>
          <p className="text-[14px] text-[#4A4A4A] leading-loose mb-6 font-serif">
            Our platform utilizes a blend of public data, proprietary curation, and user-generated reviews. All editorial content produced by GO2Schools is protected by intellectual property laws.
          </p>
          <div className="bg-[#F8FAFC] p-5 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0066CC] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[13px] text-[#2C3E50] leading-relaxed">
              Your privacy is our priority. Personal data is handled according to our Privacy Policy. User-contributed reviews become part of our curated database but you retain ownership of your voice.
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EAEAEA] p-6 mb-6">
          <h3 className="flex items-center gap-3 text-lg font-bold text-[#1A1A1A] mb-5">
            <Gavel className="w-5 h-5 text-[#F05A28]" strokeWidth={2.5} /> 4. Prohibited Conduct
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F05A28] mt-2 flex-shrink-0"></div>
              <p className="text-[14px] text-[#4A4A4A] leading-relaxed">No harassment or hate speech in school forums.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F05A28] mt-2 flex-shrink-0"></div>
              <p className="text-[14px] text-[#4A4A4A] leading-relaxed">No scraping of curated school data for commercial use.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F05A28] mt-2 flex-shrink-0"></div>
              <p className="text-[14px] text-[#4A4A4A] leading-relaxed">No impersonation of school staff or other parents.</p>
            </li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="bg-[#EBEBEB] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">
            5. Limitation of Liability
          </h3>
          <p className="text-[14px] text-[#4A4A4A] leading-relaxed">
            GO2Schools is an information curator. We are not liable for the final outcome of school admissions or the specific accuracy of third-party reviews.
          </p>
        </div>

        {/* Section 6 */}
        <div className="bg-[#F05A28] rounded-2xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-3">
            6. Changes to Terms
          </h3>
          <p className="text-[14px] text-white/90 leading-relaxed">
            We evolve. Terms may be updated periodically. Your continued use of the service signifies acceptance of the new curated standards.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <div className="text-[20px] font-bold text-[#1A1A1A] mb-2">GO2Schools</div>
          <div className="text-[12px] text-[#666666]">© 2026 GO2Schools. All rights reserved.</div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="flex flex-col flex-1 bg-[#F8F9FA] overflow-y-auto">
      <div className="flex items-center px-5 h-[60px] bg-[#F8F9FA] sticky top-0 z-10">
        <button onClick={() => setActiveScreen('welcome')} className="flex items-center justify-center w-11 h-11 text-[#F05A28] rounded-xl -ml-2 hover:bg-[#F05A28]/10 transition-colors">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <h2 className="text-[17px] font-semibold ml-2 text-[#1A1A1A]">Privacy Policy</h2>
      </div>
      <div className="p-6 pb-12">
        <div className="flex items-center mb-8">
          <div className="w-1.5 h-8 bg-[#F05A28] rounded-full mr-4"></div>
          <h1 className="text-[28px] font-bold text-[#F05A28]">Privacy Policy</h1>
        </div>

        {/* Section 1 */}
        <div className="mb-10">
          <h3 className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-4">
            <Database className="w-6 h-6 text-[#F05A28]" strokeWidth={2.5} /> 1. Information Collection
          </h3>
          <p className="text-[15px] text-[#4A4A4A] leading-relaxed mb-6">
            We collect information that you provide directly to us when you create an account, browse school profiles, or communicate with our team. This includes your name, email address, and academic preferences.
          </p>
          <div className="p-5 bg-[#F4F5F7] border-l-4 border-[#F05A28] rounded-r-xl">
            <div className="font-bold text-[#1A1A1A] mb-2 text-[15px]">Automated Data</div>
            <div className="text-[14px] text-[#666666] leading-relaxed">
              We also collect certain information automatically when you use GO2Schools, such as your IP address, browser type, and interaction data to improve your curation experience.
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="mb-10">
          <h3 className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-4">
            <BarChart2 className="w-6 h-6 text-[#F05A28]" strokeWidth={2.5} /> 2. How We Use Information
          </h3>
          <p className="text-[15px] text-[#4A4A4A] leading-relaxed mb-6">
            Your data allows us to provide a personalized educational discovery journey. We use the collected information to:
          </p>
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EAEAEA]">
              <div className="w-10 h-10 rounded-full bg-[#FFF5F2] flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5 text-[#8B3A1A]" strokeWidth={2.5} />
              </div>
              <div className="font-bold text-[#1A1A1A] text-[15px] mb-1">Personalized Matching</div>
              <div className="text-[14px] text-[#666666]">Connecting you with institutions that fit your profile.</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EAEAEA]">
              <div className="w-10 h-10 rounded-full bg-[#FFF5F2] flex items-center justify-center mb-3">
                <History className="w-5 h-5 text-[#8B3A1A]" strokeWidth={2.5} />
              </div>
              <div className="font-bold text-[#1A1A1A] text-[15px] mb-1">Platform Evolution</div>
              <div className="text-[14px] text-[#666666]">Improving UI layouts and editorial content based on usage.</div>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="mb-10">
          <h3 className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-4">
            <Share2 className="w-6 h-6 text-[#F05A28]" strokeWidth={2.5} /> 3. Information Sharing
          </h3>
          <p className="text-[15px] text-[#4A4A4A] leading-relaxed">
            We do not sell your personal data. Sharing only occurs with your explicit consent or when required by law. We may share anonymized, aggregated statistics with academic partners to improve industry standards.
          </p>
        </div>

        {/* Section 4 */}
        <div className="mb-10">
          <h3 className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-4">
            <Shield className="w-6 h-6 text-[#F05A28]" strokeWidth={2.5} /> 4. Data Security
          </h3>
          <div className="bg-[#F05A28] p-6 rounded-2xl text-white">
            <p className="text-[15px] leading-relaxed">
              We employ industry-leading encryption and multi-layered security protocols to protect your information. Our editorial servers are monitored 24/7 to prevent unauthorized access.
            </p>
          </div>
        </div>

        {/* Section 5 */}
        <div className="mb-10">
          <h3 className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A] mb-6">
            <UserCog className="w-6 h-6 text-[#F05A28]" strokeWidth={2.5} /> 5. Your Rights
          </h3>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#0066CC] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-[15px] text-[#4A4A4A] leading-relaxed">Access and update your personal data at any time via your Profile settings.</p>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#0066CC] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-[15px] text-[#4A4A4A] leading-relaxed">Request the deletion of your account and all associated data records.</p>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#0066CC] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-[15px] text-[#4A4A4A] leading-relaxed">Opt-out of any non-essential marketing communications.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  const handleNavigate = (screen: string, param?: string) => {
    if (screen === 'article' && param) {
      setActiveArticle(param);
      setActiveScreen('article');
    } else {
      setActiveScreen(screen);
    }
  };

  const renderTabs = () => (
    <div className="flex flex-col flex-1 bg-bg relative overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full w-full pb-[72px]"
          >
            <TabsContent 
              activeTab={activeTab} 
              profile={profile}
              showToast={showToast}
              handleNavigate={handleNavigate}
              setProfile={setProfile}
              handleLogout={handleLogout}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
              setHideBottomNav={setHideBottomNav}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideBottomNav && (
        <nav className="absolute bottom-0 left-0 w-full h-[72px] bg-card border-t border-border flex items-center justify-around pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md z-50">
          <NavButton icon={<Home />} label={t('Home')} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={<Search />} label={t('Schools')} active={activeTab === 'schools'} onClick={() => setActiveTab('schools')} />
          <NavButton icon={<Heart />} label={t('Favorites')} active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
          <NavButton icon={<User />} label={t('Profile')} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
      )}
    </div>
  );

  return (
    <div className={`w-full h-full flex flex-col ${isDarkMode ? 'dark' : ''} relative`}>
      {activeScreen === 'welcome' && renderWelcome()}
      {activeScreen === 'login' && renderLogin()}
      {activeScreen === 'terms' && renderTerms()}
      {activeScreen === 'privacy' && renderPrivacy()}
      {activeScreen === 'tabs' && renderTabs()}
      {activeScreen === 'notifications' && <NotificationsScreen onBack={() => setActiveScreen('tabs')} />}
      {activeScreen === 'calendar' && <CalendarScreen onBack={() => setActiveScreen('tabs')} />}
      {activeScreen === 'article' && <ArticleScreen articleId={activeArticle} onBack={() => setActiveScreen('tabs')} />}

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-[100] text-sm font-medium whitespace-nowrap"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${active ? 'text-primary font-bold' : 'text-muted text-[10px]'}`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-[22px] h-[22px] mb-1' })}
      <span className={active ? 'text-[10px]' : ''}>{label}</span>
    </div>
  );
}
