# PrepWise Deployment Guide

This guide walks you through deploying PrepWise to production using Vercel and Firebase.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Firebase project set up with:
  - Authentication enabled (Email/Password provider)
  - Firestore database created
  - Firebase Admin SDK credentials

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "prepwise-production"
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Click "Save"

### 1.3 Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location closest to your users
5. Click "Enable"

### 1.4 Set Up Security Rules

Go to "Firestore Database" → "Rules" and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isHR() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hr';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuth();
      allow create: if isAuth() && isOwner(userId);
      allow update: if isAuth() && (isOwner(userId) || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Companies collection
    match /companies/{companyId} {
      allow read: if isAuth();
      allow write: if isAuth() && (isHR() || isAdmin());
    }
    
    // Jobs collection
    match /jobs/{jobId} {
      allow read: if isAuth();
      allow write: if isAuth() && (isHR() || isAdmin());
    }
    
    // Interviews collection
    match /interviews/{interviewId} {
      allow read: if isAuth();
      allow create: if isAuth();
      allow update, delete: if isAuth() && (
        resource.data.candidateId == request.auth.uid ||
        isHR() ||
        isAdmin()
      );
    }
    
    // Feedback collection
    match /feedback/{feedbackId} {
      allow read: if isAuth();
      allow write: if isAuth();
    }
    
    // Subscriptions collection
    match /subscriptions/{subscriptionId} {
      allow read: if isAuth() && (
        resource.data.userId == request.auth.uid ||
        isAdmin()
      );
      allow write: if isAdmin();
    }
    
    // Invitations collection
    match /invitations/{invitationId} {
      allow read: if isAuth();
      allow write: if isAuth() && (isHR() || isAdmin());
    }
  }
}
```

Click "Publish"

### 1.5 Get Firebase Config

1. Go to Project Settings (gear icon) → General
2. Scroll to "Your apps" section
3. Click web icon (</>) to add a web app
4. Register app with nickname "prepwise-web"
5. Copy the Firebase config object - you'll need these values

### 1.6 Get Firebase Admin Credentials

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. You'll need:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 2: Get API Keys

### 2.1 Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API key"
3. Create new API key or use existing
4. Copy the API key

### 2.2 Vapi AI

1. Go to [Vapi.ai](https://www.vapi.ai/)
2. Sign up or log in
3. Go to Dashboard → API Keys
4. Create new API key
5. Copy both public and private keys
6. Create a new assistant and copy the assistant ID

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

```bash
cd c:\Users\Admin\OneDrive\Desktop\PW

# Initialize git if not already
git init
git add .
git commit -m "Initial PrepWise commit"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/prepwise.git
git branch -M main
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 3.3 Add Environment Variables

In Vercel project settings → Environment Variables, add all from `.env.local.example`:

**Firebase Client (NEXT_PUBLIC_*)**

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Firebase Admin**

```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

**AI Services**

```
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_public_key
VAPI_API_KEY=your_vapi_private_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
```

**Important:** For `FIREBASE_ADMIN_PRIVATE_KEY`, make sure to:

1. Keep the quotes around the entire value
2. Keep the `\n` characters (don't replace with actual newlines)
3. Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel will provide a production URL (e.g., `prepwise.vercel.app`)

## Step 4: Post-Deployment Configuration

### 4.1 Add Vercel Domain to Firebase

1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add your Vercel domain: `your-app.vercel.app`
5. Click "Add"

### 4.2 Create First Admin User

**Option A: Via Firebase Console**

1. Deploy the app and register a new user via the UI
2. Go to Firebase Console → Firestore Database
3. Find the user document in `users` collection
4. Edit the document and change `role` to `admin`
5. Change `status` to `active`

**Option B: Via Firebase CLI/Script**

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Use Firestore directly to create admin user

### 4.3 Test the Application

1. Visit your Vercel URL
2. Register a new user (this will be a candidate by default)
3. Test login/logout
4. Navigate to candidate dashboard
5. Try creating a new interview
6. Verify Firestore is saving data

## Step 5: Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Configure DNS settings as shown by Vercel
4. Wait for SSL certificate to be issued
5. Add custom domain to Firebase authorized domains

## Troubleshooting

### Build Fails

**Error**: Missing environment variables

- **Fix**: Add all required environment variables in Vercel

**Error**: TypeScript errors

- **Fix**: Run `npm run build` locally first to catch errors

### Firebase Connection Issues

**Error**: "Firebase: Error (auth/unauthorized-domain)"

- **Fix**: Add your Vercel domain to Firebase authorized domains

**Error**: "Permission denied" in Firestore

- visit**Fix**: Check Firestore security rules are published

### Authentication Not Working

**Error**: Users can't sign up/login

- **Fix**:
  1. Verify Firebase config environment variables
  2. Check Firebase Authentication is enabled
  3. Ensure email/password provider is enabled

## Production Checklist

- [ ] Firebase project created and configured
- [ ] Firestore security rules published
- [ ] All environment variables added to Vercel
- [ ] Application successfully deployed
- [ ] Vercel domain added to Firebase authorized domains
- [ ] First admin user created
- [ ] Authentication working (signup, login, logout)
- [ ] Candidate dashboard accessible
- [ ] Interview creation working
- [ ] Custom domain configured (if applicable)

## Monitoring and Maintenance

### Vercel Dashboard

- Monitor deployment logs
- Check function execution times
- Review error logs

### Firebase Console

- Monitor authentication users
- Check Firestore usage
- Review security rules logs

### Updating the Application

```bash
# Make changes locally
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically deploy on push to main branch.

## Support

For issues:

1. Check Vercel deployment logs
2. Review Firebase console for errors
3. Check browser console for client-side errors
4. Verify all environment variables are correct

---

**PrepWise is now live! 🎉**

Visit your deployed application and start conducting AI-powered mock interviews.
