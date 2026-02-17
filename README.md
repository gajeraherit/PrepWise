# PrepWise - AI Mock Interview SaaS Platform

<img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" />
<img src="https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase" />
<img src="https://img.shields.io/badge/AI-Gemini%20%7C%20Vapi-purple" />

A production-ready, full-stack AI-powered mock interview platform for candidates, HR recruiters, and administrators. Built with Next.js 14, Firebase, Google Gemini AI, and Vapi AI for real-time voice interviews.

## ✨ Features

### For Candidates

- 🎤 **Real-Time Voice AI Interviews** - Practice with natural conversation using Vapi AI
- 🎯 **Role-Specific Questions** - Tailored to your job role, tech stack, and experience level
- 📊 **AI-Powered Feedback** - Detailed analysis of communication, technical skills, and performance
- 📈 **Progress Tracking** - Monitor improvement over time with analytics
- 📄 **PDF Reports** - Download comprehensive feedback reports

### For HR/Recruiters

- 👥 **Candidate Management** - Invite and manage candidates
- 💼 **Job Openings** - Create and manage job posts
- 📧 **Email Invitations** - Send interview invitations to candidates
- 📊 **Performance Reports** - View and compare candidate interview results
- ⭐ **Shortlisting** - Rate and shortlist top candidates

### For Admins

- 🔐 **User Management** - Manage all users (candidates and HR)
- ✅ **HR Approvals** - Approve or suspend HR accounts
- 📊 **Platform Analytics** - Track interviews, users, and system metrics
- ⚙️ **Feature Toggles** - Control platform features and settings

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **AI Services**:
  - Google Gemini AI - Question generation & feedback analysis
  - Vapi AI - Real-time voice interviews
- **Deployment**: Vercel

## 📁 Project Structure

```
PrepWise/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Registration page
│   ├── candidate/               # Candidate dashboard
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── interview/
│   │   ├── history/
│   │   └── feedback/
│   ├── hr/                      # HR dashboard
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── jobs/
│   │   ├── candidates/
│   │   └── interviews/
│   ├── admin/                   # Admin dashboard
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── analytics/
│   │   └── settings/
│   └── api/                     # API routes
│       ├── interviews/
│       ├── ai/
│       └── auth/
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── lib/
│   ├── firebase/
│   │   ├── config.ts           # Firebase client config
│   │   └── schema.ts           # Firestore schema & types
│   ├── ai/
│   │   ├── gemini.ts           # Gemini AI integration
│   │   └── vapi.ts             # Vapi AI integration
│   └── utils.ts                # Utility functions
└── .env.local                  # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project set up
- Google Gemini API key
- Vapi AI account and API key

### Installation

1. **Clone the repository** (or use existing workspace)

```bash
cd c:\Users\Admin\OneDrive\Desktop\PW
```

1. **Install dependencies**

```bash
npm install
```

1. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"

# AI Services
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_public_key
VAPI_API_KEY=your_vapi_private_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id

# Optional
OPENAI_API_KEY=your_openai_api_key
```

1. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** (Email/Password provider)
4. Create **Firestore Database** (Start in production mode)

### 2. Get Configuration

- Go to Project Settings → General
- Scroll to "Your apps" → Web app
- Copy the Firebase config values to `.env.local`

### 3. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Other collections with role-based access
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🌐 Firestore Collections

### `users`

```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: 'candidate' | 'hr' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  skills?: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'expert';
  resumeURL?: string;
  companyId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `companies`, `jobs`, `interviews`, `feedback`, `subscriptions`

See [lib/firebase/schema.ts](lib/firebase/schema.ts) for complete schema definitions.

## 🤖 AI Integration

### Google Gemini AI

- **Purpose**: Generate interview questions and analyze feedback
- **Setup**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Vapi AI

- **Purpose**: Real-time voice interviews with speech-to-text/text-to-speech
- **Setup**: Create account at [Vapi.ai](https://www.vapi.ai/)

## 🎨 UI/UX Features

- ✅ Dark/Light mode with smooth transitions
- ✅ Glassmorphism design elements
- ✅ Gradient backgrounds and effects
- ✅ Responsive mobile-first design
- ✅ Smooth animations and hover effects
- ✅ Premium SaaS aesthetic

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub** (if not already)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

1. **Deploy on Vercel**

- Go to [Vercel](https://vercel.com/)
- Import your GitHub repository
- Add environment variables from `.env.local`
- Deploy!

### Post-Deployment

1. **Create First Admin User**
   - Register a new user
   - Manually update the user document in Firestore to set `role: 'admin'`

2. **Configure Firebase**
   - Add your Vercel domain to Firebase authorized domains
   - Update Firestore security rules for production

## 📝 Usage

### For Candidates

1. **Register** as a candidate
2. **Complete profile** with skills and resume
3. **Create interview** by selecting role, tech stack, and duration
4. **Start interview** and practice with AI
5. **Review feedback** and track progress

### For HR/Recruiters

1. **Register** as HR (requires admin approval)
2. **Set up company profile**
3. **Create job openings**
4. **Invite candidates** via email
5. **Review interview results** and shortlist candidates

### For Admins

1. **Access admin dashboard**
2. **Approve HR accounts**
3. **Monitor platform analytics**
4. **Manage users and settings**

## 🔒 Security

- Firebase Authentication for secure user management
- Role-based access control (RBAC) via Firestore
- Environment variables for sensitive data
- Client-side and server-side validation

## 🤝 Contributing

This is a proprietary project. For questions or support, please contact the development team.

## 📄 License

All rights reserved © 2026 PrepWise

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:

```bash
npm run build
```

Check for TypeScript errors and missing environment variables.

### Firebase Connection Issues

- Verify all environment variables are set correctly
- Check Firebase project permissions
- Ensure Firestore database is created

### Missing shadcn/ui Components

If components are missing:

```bash
npx shadcn@latest add button card input label select textarea dialog dropdown-menu tabs table badge avatar separator sonner
```

## 📞 Support

For technical support or questions, please refer to the documentation or contact the admin.

---

**Built with ❤️ using Next.js, Firebase, and AI**
