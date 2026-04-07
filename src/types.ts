export interface UserProfile {
  id: string;
  display_name: string;
  avatar_path: string;
  role: string;
}

export interface SavedSchool {
  id: string;
  user_id: string;
  school_id: string;
}

export interface ForumPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  title: string;
  content: string;
  created_at: string | any;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  school_name: string;
  date: string; // ISO format YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  type: 'interview' | 'deadline' | 'mixer' | 'other';
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'admission' | 'forum' | 'deadline' | 'system';
  created_at: string;
  is_read: boolean;
}

export interface SchoolData {
  "SCHOOL NO.": number;
  "ENGLISH NAME": string;
  "CHINESE NAME": string;
  "中文名稱": string;
  "ENGLISH ADDRESS": string;
  "CHINESE ADDRESS": string;
  "中文地址": string;
  "TELEPHONE": string;
  "聯絡電話": string;
  "FAX": string;
  "傳真號碼": string;
  "WEBSITE": string;
  "網頁": string;
  "RELIGION": string;
  "宗教": string;
  "GENDER": string;
  "STUDENT GENDER"?: string;
  "就讀學生性別": string;
  "DISTRICT": string;
  "分區": string;
  "SCHOOL LEVEL": string;
  "學校類型": string;
  "FINANCE TYPE": string;
  "資助種類": string;
}
