# Deployment Guide for Netlify

## Prerequisites
- Netlify account
- Firebase project set up
- Groq API key

## Steps to Deploy

### 1. Environment Variables
In your Netlify dashboard, go to **Site settings > Environment variables** and add:

```
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Build Settings
Netlify should auto-detect these from `netlify.toml`, but verify:
- **Build command**: `pnpm run build`
- **Publish directory**: `.next`
- **Functions directory**: `.netlify/functions`

### 3. Firebase Configuration
The Firebase config is hardcoded in `lib/firebase.ts`. If you want to use different Firebase projects for different environments, you can:

1. Move the config to environment variables
2. Update `lib/firebase.ts` to read from `process.env.NEXT_PUBLIC_*`

### 4. Firestore Rules
Deploy your Firestore rules:
```bash
firebase deploy --only firestore:rules
```

### 5. Deploy to Netlify
Push to your connected Git repository, or use Netlify CLI:
```bash
netlify deploy --prod
```

## Troubleshooting

### "Page could not load" error
1. **Check build logs** in Netlify dashboard
2. **Verify environment variables** are set correctly
3. **Check Functions logs** for API route errors
4. **Ensure Firebase rules** are deployed

### Build fails
1. Check that `pnpm` is available (Netlify auto-detects from `pnpm-lock.yaml`)
2. Verify all dependencies are in `package.json`
3. Check build logs for specific errors

### Firebase connection issues
1. Verify Firebase config in `lib/firebase.ts`
2. Check Firebase project is active
3. Ensure Firestore rules allow read/write for authenticated users

### API routes not working
1. Verify `GROQ_API_KEY` is set in Netlify environment variables
2. Check Functions logs in Netlify dashboard
3. Ensure API routes are in `app/api/` directory

## Post-Deployment Checklist
- [ ] Site loads without errors
- [ ] Login/authentication works
- [ ] Firebase data loads correctly
- [ ] AI features work (Groq API)
- [ ] All dashboard features accessible
- [ ] Mobile responsive
