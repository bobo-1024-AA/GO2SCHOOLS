# GO2Schools - Implementation Document

## 1. Project Overview
GO2Schools is a comprehensive one-stop school information and schedule management platform designed specifically for Hong Kong parents. The application combines official school data from the Education Bureau (EDB), a cloud-synced admission calendar, and a multi-dimensional school search function to simplify the information gathering and time management pressure for parents during the admission process.

## 2. Tech Stack
- **Frontend Framework**: React 18 (Vite build)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Utility-first pattern)
- **Animations**: Framer Motion (`motion/react`)
- **Backend Services**: Firebase (Firestore Database, Firebase Auth)
- **Internationalization**: i18next (Supports English & Traditional Chinese)
- **Icon Library**: Lucide React
- **Date Handling**: date-fns

## 3. Core Features

### 3.1 Authentication & Profile
- **Google Login**: Integrated Firebase Auth for convenient third-party login.
- **Profile Management**: Users can customize their display name and avatar, with personal preferences synced between local and cloud.
- **Language Switching**: Supports one-click switching between Chinese and English interfaces.

### 3.2 Smart School Finder
- **Multi-step Filtering Logic**: 
    - Step 1: Select Education Level (Kindergarten, Primary, Secondary).
    - Step 2: Select from 18 HK Districts.
    - Step 3: Select Finance Type (Aided, DSS, Private, Government).
- **Real-time Search**: Supports keyword-based instant retrieval of school names.
- **School Details**: Displays address, telephone, website, and supports one-tap dialing and map navigation.
- **Favorites**: Users can save favorite schools, with data persistently stored in the cloud.

### 3.3 Cloud Admission Calendar
- **Event Management (CRUD)**: Supports adding, editing, and deleting events such as interviews, deadlines, and mixers.
- **Real-time Sync**: Uses Firestore `onSnapshot` for instant data synchronization across devices.
- **Data Migration**: Built-in automatic migration script to seamlessly transfer legacy `localStorage` data to Firestore cloud.
- **Type Categorization**: Provides color-coded tags to distinguish event types (e.g., Orange for Interviews, Red for Deadlines).

### 3.4 Dashboard & Notifications
- **Upcoming Dates (Countdown)**: Automatically calculates and displays important dates (e.g., SSPA allocation, DSE exams) and user-defined schedules.
- **Official News Feed**: Simulates the latest EDB updates and provides admission guide articles.
- **In-app Notifications**: Tracks important schedule changes with unread red dot indicators.

## 4. Data Architecture

### 4.1 Firestore Collection Structure
- `profiles/{userId}`: Stores basic user profile data.
- `calendar_events/{eventId}`: Stores user schedules, including `user_id`, `title`, `date`, `time`, `type`, etc.
- `saved_schools/{id}`: Stores user's favorite school associations.

### 4.2 Security Rules
- Implements strict **Owner-only** read/write permissions, ensuring users can only access their own private schedules and profiles.
- Performs Schema validation on write operations to prevent illegal field injection.

## 5. Deployment & Configuration
- **Environment Variables**: All Firebase configurations are managed via `VITE_` prefixed environment variables for security and flexibility on platforms like Vercel.
- **Responsive Design**: Adopts a Mobile-first strategy, perfectly adapted for iOS and Android mobile browsers.
