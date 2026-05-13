# Firebase Setup Guide - Fix Environment Variables

**Issue**: Firebase Admin SDK cannot initialize because environment variables are missing.

**Your Firebase Project**:
- Project Name: `Remo`
- Project ID: `remo-3dedf`
- Project Number: `956812936514`

---

## Step 1: Get Firebase Client SDK Credentials

These are used in the browser (client-side).

### 1.1 Go to Firebase Console
1. Visit: https://console.firebase.google.com/project/remo-3dedf/settings/general
2. Scroll down to "Your apps" section
3. If you don't have a web app, click "Add app" → Web (</>) icon
4. Register your app with a nickname (e.g., "REMO Web App")

### 1.2 Copy the Config Values
You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "remo-3dedf.firebaseapp.com",
  projectId: "remo-3dedf",
  storageBucket: "remo-3dedf.appspot.com",
  messagingSenderId: "956812936514",
  appId: "1:956812936514:web:XXXXXXXXXXXXXXXX"
};
```

### 1.3 Update .env.local
Replace these values in your `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=remo-3dedf.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=remo-3dedf
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=remo-3dedf.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=956812936514
NEXT_PUBLIC_FIREBASE_APP_ID=1:956812936514:web:XXXXXXXXXXXXXXXX
```

---

## Step 2: Get Firebase Admin SDK Credentials (Service Account)

These are used on the server-side (API routes).

### 2.1 Generate Service Account Key
1. Go to: https://console.firebase.google.com/project/remo-3dedf/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Click "Generate key" in the confirmation dialog
4. A JSON file will download (e.g., `remo-3dedf-firebase-adminsdk-xxxxx.json`)

### 2.2 Extract Values from JSON
Open the downloaded JSON file. It looks like this:

```json
{
  "type": "service_account",
  "project_id": "remo-3dedf",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@remo-3dedf.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40remo-3dedf.iam.gserviceaccount.com"
}
```

### 2.3 Update .env.local
Copy these values from the JSON:

```bash
FIREBASE_ADMIN_PROJECT_ID=remo-3dedf
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@remo-3dedf.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT**: 
- Keep the quotes around the private key
- Keep the `\n` characters (they represent line breaks)
- Never commit this file to Git (it's already in .gitignore)

---

## Step 3: Alternative - Use Full Service Account JSON (Easier)

Instead of extracting individual values, you can use the entire JSON file:

### 3.1 Copy the Entire JSON Content
Copy the entire content of the downloaded JSON file.

### 3.2 Add to .env.local as Single Variable
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"remo-3dedf",...}'
```

**Note**: Use single quotes to wrap the JSON, and make sure it's all on one line.

---

## Step 4: Restart Development Server

After updating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
# Then restart
pnpm dev
```

---

## Complete .env.local Template

Here's what your complete `.env.local` should look like:

```bash
# ============================================
# Firebase Client SDK (Public - used in browser)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=remo-3dedf.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=remo-3dedf
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=remo-3dedf.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=956812936514
NEXT_PUBLIC_FIREBASE_APP_ID=1:956812936514:web:XXXXXXXXXXXXXXXX

# ============================================
# Firebase Admin SDK (Server-side only)
# ============================================
# Option 1: Individual values
FIREBASE_ADMIN_PROJECT_ID=remo-3dedf
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@remo-3dedf.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Option 2: Full service account JSON (use this OR option 1, not both)
# FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"remo-3dedf",...}'

# ============================================
# Groq API
# ============================================
GROQ_API_KEY=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

# ============================================
# Automation (optional)
# ============================================
CRON_SECRET=your_random_secret_for_cron_jobs
```

---

## Troubleshooting

### Error: "FIREBASE_ADMIN_PROJECT_ID is required"
- Make sure you've added the Firebase Admin variables to `.env.local`
- Restart your development server after adding variables
- Check that there are no typos in variable names

### Error: "Invalid service account"
- Make sure the private key includes the full content with BEGIN and END markers
- Keep the `\n` characters in the private key
- Use double quotes around the private key value

### Error: "Permission denied"
- Make sure Firestore is enabled in your Firebase project
- Check that your service account has the correct permissions
- Go to: https://console.firebase.google.com/project/remo-3dedf/firestore

### Cache Still Not Working
The Groq cache will work once Firebase Admin is properly configured. The cache stores AI responses in Firestore to reduce API calls.

---

## Security Reminders

⚠️ **NEVER commit `.env.local` to Git**
- It's already in `.gitignore`
- Contains sensitive credentials
- Each developer should have their own copy

⚠️ **Keep service account keys secure**
- Don't share them publicly
- Don't include them in screenshots
- Rotate keys if compromised

⚠️ **For production deployment**
- Use environment variables in your hosting platform (Vercel, Netlify, etc.)
- Don't use `.env.local` in production
- Consider using secret management services

---

## Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/remo-3dedf
- **Project Settings**: https://console.firebase.google.com/project/remo-3dedf/settings/general
- **Service Accounts**: https://console.firebase.google.com/project/remo-3dedf/settings/serviceaccounts/adminsdk
- **Firestore Database**: https://console.firebase.google.com/project/remo-3dedf/firestore

---

## Next Steps After Setup

1. ✅ Add all environment variables to `.env.local`
2. ✅ Restart development server
3. ✅ Test login functionality
4. ✅ Verify Groq cache is working (check console logs)
5. ✅ Create test users
6. ✅ Test all features

---

**Need Help?**
If you're still having issues, check:
1. Firebase Console → Project Settings → General (for client SDK config)
2. Firebase Console → Project Settings → Service Accounts (for admin SDK)
3. Make sure Firestore and Authentication are enabled in your Firebase project
