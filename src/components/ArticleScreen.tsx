import React, { useState } from 'react';
import { ArrowLeft, Share2, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

const getArticles = (lang: string) => ({
  'sspa': {
    title: lang === 'zh' ? '中學學位分配辦法 (SSPA) 系統概覽' : 'General Information on Secondary School Places Allocation (SSPA) System',
    date: lang === 'zh' ? '最近更新' : 'Updated Recently',
    tag: lang === 'zh' ? '教育制度' : 'Education System',
    readTime: lang === 'zh' ? '3 分鐘閱讀' : '3 min read',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=1000',
    content: lang === 'zh' ? (
      <div className="space-y-6 text-[16px] leading-loose text-text/90">
        <p className="text-lg font-medium text-text">中學學位分配辦法 (SSPA) 是香港為小六學生分配資助中學學位的機制。該系統主要分為兩個階段：</p>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-3 text-primary flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            自行分配學位 (DP)
          </h3>
          <p className="mb-3">在此階段，中學可分配最多 30% 的中一學位。學生可以不受校網限制，向任何兩所參加派位的中學提出申請。</p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>學校根據自行訂定的收生準則（如學業成績、課外活動、面試表現）錄取學生。</li>
            <li>申請通常在每年一月遞交。</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-3 text-primary flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            統一派位 (CA)
          </h3>
          <p className="mb-3">扣除自行分配學位後，餘下的學位將於統一派位階段分配。此階段根據學生的派位組別、家長選校意願及隨機編號進行。</p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li><strong>甲部（不受校網限制）：</strong> 佔統一派位學額 10%。家長可選擇最多 3 所位於任何校網的中學。</li>
            <li><strong>乙部（按校網）：</strong> 佔統一派位學額 90%。家長可選擇最多 30 所所屬校網的中學。</li>
          </ul>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mt-8">
          <h3 className="text-lg font-bold mb-4 text-text">2026 重要日期</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p><strong>2026年7月7日：</strong> 公布自行分配學位及統一派位結果</p>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p><strong>2026年7月9日及10日：</strong> 辦理中一註冊</p>
            </li>
          </ul>
        </div>

        <div className="mt-8 border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-xl">
          <h3 className="text-lg font-bold mb-2 text-text">家長重要貼士</h3>
          <p>在參與自行分配學位及統一派位前，務必深入了解各學校的辦學理念、參加開放日，並根據子女的特質與興趣作出合適的選擇。</p>
        </div>
      </div>
    ) : (
      <div className="space-y-6 text-[16px] leading-loose text-text/90">
        <p className="text-lg font-medium text-text">The Secondary School Places Allocation (SSPA) System is a mechanism for allocating subsidized secondary school places to Primary 6 students in Hong Kong. The system is divided into two main stages:</p>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-3 text-primary flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Discretionary Places (DP)
          </h3>
          <p className="mb-3">In this stage, secondary schools can allocate up to 30% of their Secondary 1 places. Students can apply to any two participating secondary schools of their choice, regardless of their school net.</p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>Schools admit students based on their own criteria (e.g., academic performance, extracurricular activities, interview performance).</li>
            <li>Applications are usually submitted in January.</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-3 text-primary flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            Central Allocation (CA)
          </h3>
          <p className="mb-3">The remaining places are allocated in the Central Allocation stage. This stage is based on the student's allocation band, parental choice of schools, and a random number.</p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li><strong>Part A (Unrestricted):</strong> 10% of CA places. Parents can choose up to 3 schools from any school net.</li>
            <li><strong>Part B (Restricted):</strong> 90% of CA places. Parents can choose up to 30 schools from their own school net.</li>
          </ul>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mt-8">
          <h3 className="text-lg font-bold mb-4 text-text">Important Dates 2026</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p><strong>July 7, 2026:</strong> Release of DP and CA results</p>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p><strong>July 9 & 10, 2026:</strong> Registration for S1 students</p>
            </li>
          </ul>
        </div>

        <div className="mt-8 border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-xl">
          <h3 className="text-lg font-bold mb-2 text-text">Important Tips for Parents</h3>
          <p>It is crucial to research schools thoroughly, attend open days, and understand your child's strengths and interests before making choices in both the DP and CA stages.</p>
        </div>
      </div>
    )
  },
  'dse': {
    title: lang === 'zh' ? 'HKDSE 2026 放榜日期及準備指南' : 'HKDSE 2026 Release Date & Prep Guide',
    date: lang === 'zh' ? '即將到來' : 'Upcoming',
    tag: lang === 'zh' ? '考試' : 'Examination',
    readTime: lang === 'zh' ? '2 分鐘閱讀' : '2 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
    content: lang === 'zh' ? (
      <div className="space-y-6 text-[16px] leading-loose text-text/90">
        <p className="text-lg font-medium text-text">2026年香港中學文憑考試 (HKDSE) 的放榜日期預計為 <strong className="text-primary">2026年7月15日（星期三）</strong>。</p>
        
        <h3 className="text-xl font-bold mt-8 mb-4 text-text border-b border-border pb-2">放榜日安排</h3>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
            <p><strong>學校考生：</strong> 請按所屬學校的安排，回校領取成績通知書。</p>
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
            <p><strong>自修生：</strong> 成績通知書將透過郵遞寄出，亦可於早上起透過考評局網上系統查閱成績。</p>
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
            <p><strong>SMS 提示：</strong> 已登記的考生將於放榜日早上收到包含成績的 SMS 短訊。</p>
          </li>
        </ul>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mt-8">
          <h3 className="text-lg font-bold mb-4 text-text">放榜前準備</h3>
          <p className="mb-4 text-muted">考生應及早準備放榜日的安排，以應對不同的成績結果：</p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>準備好各項升學途徑的報名文件（如身份證副本、證件相、歷年成績表等）。</li>
            <li>了解各大專院校的收生要求及面試安排。</li>
            <li>留意 JUPAS 改選課程的指定時段，並根據實際成績調整策略。</li>
            <li>保持平常心，與家人及老師商討未來的升學或就業路向。</li>
          </ul>
        </div>
      </div>
    ) : (
      <div className="space-y-6 text-[16px] leading-loose text-text/90">
        <p className="text-lg font-medium text-text">The release date for the 2026 Hong Kong Diploma of Secondary Education (HKDSE) examination results is expected to be on <strong className="text-primary">July 15, 2026 (Wednesday)</strong>.</p>
        
        <h3 className="text-xl font-bold mt-8 mb-4 text-text border-b border-border pb-2">Results Release Arrangements</h3>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
            <p><strong>School Candidates:</strong> Please follow your school's arrangements to collect your results notice on campus.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
            <p><strong>Private Candidates:</strong> Results notices will be sent by post. You can also check your results online via the HKEAA system from morning.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
            <p><strong>SMS Alert:</strong> Registered candidates will receive an SMS with their results on the morning of the release day.</p>
          </li>
        </ul>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mt-8">
          <h3 className="text-lg font-bold mb-4 text-text">Preparation Before Release</h3>
          <p className="mb-4 text-muted">Candidates should prepare early for different outcome scenarios:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>Prepare necessary application documents (e.g., ID copy, passport photos, past transcripts).</li>
            <li>Understand the admission requirements and interview arrangements of various institutions.</li>
            <li>Note the designated time slots for modifying JUPAS program choices and adjust strategies based on actual results.</li>
            <li>Stay calm and discuss future study or career paths with family and teachers.</li>
          </ul>
        </div>
      </div>
    )
  },
  'jupas': {
    title: lang === 'zh' ? 'JUPAS 2026 放榜日期及重要事項' : 'JUPAS 2026 Release Date & Important Notes',
    date: lang === 'zh' ? '即將到來' : 'Upcoming',
    tag: lang === 'zh' ? '大學聯招' : 'University Admission',
    readTime: lang === 'zh' ? '2 分鐘閱讀' : '2 min read',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
    content: lang === 'zh' ? (
      <div className="space-y-6 text-[16px] leading-loose text-text/90">
        <p className="text-lg font-medium text-text">2026年大學聯合招生辦法 (JUPAS) 的正式遴選結果將於 <strong className="text-primary">2026年8月5日（上午9時）</strong> 公佈。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-text">查閱結果方式</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>透過 JUPAS 網站登入申請人帳戶查閱。</li>
              <li>透過各大院校的網站查閱。</li>
              <li>已登記的申請人將收到 SMS 短訊通知。</li>
            </ul>
          </div>
          
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-text">獲取錄後的安排</h3>
            <p className="mb-2 text-sm text-muted">獲得取錄資格的申請人必須於指定限期前完成以下事項，否則將被視為放棄：</p>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>繳交留位費（通常為港幣 5,000 元）。</li>
              <li>於指定時間內到所屬院校完成註冊手續。</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-l-4 border-info pl-4 py-2 bg-info/5 rounded-r-xl">
          <h3 className="text-lg font-bold mb-2 text-text">補選及後續安排</h3>
          <p>若未能於正式遴選中獲得取錄，申請人應留意隨後公佈的補選結果。此外，亦可考慮其他非 JUPAS 的升學途徑，如副學士、高級文憑或海外升學。</p>
        </div>
      </div>
    ) : (
      <div className="space-y-6 text-[16px] leading-loose text-text/90">
        <p className="text-lg font-medium text-text">The main round offer results for the 2026 Joint University Programmes Admissions System (JUPAS) will be announced on <strong className="text-primary">August 5, 2026 (9:00 AM)</strong>.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-text">How to Check Results</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>Log in to your applicant account via the JUPAS website.</li>
              <li>Check through the websites of the respective institutions.</li>
              <li>Registered applicants will receive an SMS notification.</li>
            </ul>
          </div>
          
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-3 text-text">Arrangements After Offer</h3>
            <p className="mb-2 text-sm text-muted">Successful applicants must complete the following by the deadline, or the offer will be forfeited:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>Pay the acceptance fee (usually HK$5,000).</li>
              <li>Complete registration procedures at the respective institution within the specified period.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-l-4 border-info pl-4 py-2 bg-info/5 rounded-r-xl">
          <h3 className="text-lg font-bold mb-2 text-text">Clearing Round & Alternatives</h3>
          <p>If you do not receive an offer in the Main Round, please pay attention to the Clearing Round results announced later. Additionally, consider non-JUPAS pathways such as Associate Degrees, Higher Diplomas, or studying abroad.</p>
        </div>
      </div>
    )
  }
});

export default function ArticleScreen({ articleId, onBack }: { articleId: string, onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const articles = getArticles(i18n.language);
  const article = articles[articleId as keyof typeof articles];
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'GO2Schools Article',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (!article) {
    return (
      <div className="flex flex-col h-full bg-bg p-5">
        <button onClick={onBack} className="mb-4 text-primary font-bold">{t('Back')}</button>
        <div className="text-text">{t('Article not found.')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-bg/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center justify-center w-10 h-10 text-primary rounded-xl -ml-2 hover:bg-primary/10 transition-colors">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <button onClick={handleShare} className="flex items-center justify-center w-10 h-10 text-text rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Hero Image */}
        <div className="w-full h-48 md:h-64 relative">
          <img src={article.image} alt="Article Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        </div>

        <div className="px-5 -mt-10 relative z-10">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 shadow-sm">
              {article.tag}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text mb-4 leading-tight">{article.title}</h1>
            <div className="flex items-center gap-4 text-xs font-medium text-muted">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                {article.date}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </div>
            </div>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            {article.content}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text text-bg px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-bold">{t('Copied to clipboard!')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
