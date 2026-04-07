import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, User, Clock, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ForumPost, UserProfile } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhTW, enUS } from 'date-fns/locale';

export default function ForumScreen({ profile }: { profile: UserProfile | null }) {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumPost[];
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!newTitle || !newContent || !profile) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        author_id: profile.id,
        author_name: profile.display_name,
        author_avatar: profile.avatar_path,
        title: newTitle,
        content: newContent,
        created_at: new Date().toISOString()
      });

      setNewTitle('');
      setNewContent('');
      setShowModal(false);
    } catch (error) {
      console.error('Error posting:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t('Forum')}</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100">
                {post.author_avatar ? (
                  <img src={post.author_avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{post.author_name}</p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.created_at ? formatDistanceToNow(typeof post.created_at === 'string' ? parseISO(post.created_at) : post.created_at, { 
                    addSuffix: true,
                    locale: i18n.language === 'zh' ? zhTW : enUS 
                  }) : 'Just now'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-gray-800">{post.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{post.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="text-primary" />
                  {t('Post')}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest">{t('Title')}</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="輸入標題..."
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest">{t('Content')}</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="分享你的心得..."
                    rows={4}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handlePost}
                  disabled={submitting}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('Post')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
