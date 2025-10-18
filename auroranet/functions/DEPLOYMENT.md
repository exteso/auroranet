# Firebase Cloud Functions - Deployment Guide

This document provides instructions for deploying and testing the Firebase Cloud Functions for user creation.

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Logged into Firebase**
   ```bash
   firebase login
   ```

3. **Firebase project initialized**
   - Already configured in `firebase.json`
   - Functions directory: `functions/`

## Cloud Functions Overview

### Functions Implemented

1. **createUserWithEmail**
   - Creates user with email/password authentication
   - Parameters: `email`, `password`, `displayName`, `role`, `phone` (optional)
   - Returns: `{ success: true, uid: string, email: string }`

2. **createUserWithPhone**
   - Creates user with phone number authentication
   - Parameters: `phoneNumber`, `displayName`, `role`, `password` (optional)
   - Returns: `{ success: true, uid: string, phoneNumber: string }`

### Security

- Both functions verify the caller is authenticated
- Both functions check that the caller has `admin` role in Firestore
- Only admins can create new users
- All errors are logged with Firebase Functions logger

## Deployment Steps

### 1. Build the Functions

```bash
cd functions
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### 2. Deploy to Firebase

**Deploy all functions:**
```bash
firebase deploy --only functions
```

**Deploy specific function:**
```bash
firebase deploy --only functions:createUserWithEmail
firebase deploy --only functions:createUserWithPhone
```

### 3. Verify Deployment

After deployment, Firebase CLI will show:
```
✔ functions[createUserWithEmail(us-central1)] Successful update operation.
✔ functions[createUserWithPhone(us-central1)] Successful update operation.
```

You can verify in Firebase Console:
- Go to https://console.firebase.google.com
- Select your project
- Navigate to "Functions" in the left menu
- You should see both functions listed

## Testing

### Local Testing with Emulator

1. **Start the Firebase emulator:**
   ```bash
   cd functions
   npm run serve
   ```

2. **Configure Angular to use emulator:**
   In `src/environments/environment.ts`, add:
   ```typescript
   export const environment = {
     // ... other config
     useEmulators: true
   };
   ```

3. **Connect Functions to emulator in Angular:**
   In `app.config.ts`:
   ```typescript
   import { connectFunctionsEmulator } from '@angular/fire/functions';

   provideFunctions(() => {
     const functions = getFunctions();
     if (environment.useEmulators) {
       connectFunctionsEmulator(functions, 'localhost', 5001);
     }
     return functions;
   })
   ```

### Production Testing

1. **Deploy functions** (see deployment steps above)

2. **Test in Angular app:**
   - Log in as an admin user
   - Navigate to User Management
   - Click "Create User"
   - Fill in the form with email or phone
   - Submit

3. **Check Firebase Console:**
   - Functions → Logs: Check function execution logs
   - Authentication → Users: Verify new user was created
   - Firestore → users collection: Verify user document was created

## Monitoring

### View Logs

**All function logs:**
```bash
firebase functions:log
```

**Specific function logs:**
```bash
firebase functions:log --only createUserWithEmail
```

**Real-time logs:**
```bash
firebase functions:log --follow
```

### Firebase Console

View logs in real-time:
1. Go to Firebase Console
2. Functions → Logs
3. Filter by function name

## Cost Considerations

- **Free tier**: 2M invocations/month, 400,000 GB-sec, 200,000 GHz-sec
- These functions are lightweight and should stay within free tier for normal usage
- Each user creation = 1 invocation + Firestore write

## Troubleshooting

### Function Not Found

If you get "Function not found" error:
1. Verify deployment: `firebase functions:list`
2. Check function names match in code and Angular service
3. Ensure functions are deployed to same project as Angular app

### Permission Denied

If you get "permission-denied" error:
1. Verify user is logged in: Check `context.auth` in function
2. Verify user has admin role: Check Firestore `users/{uid}` document
3. Test with Firebase Console to verify Firestore rules

### Function Timeout

Default timeout is 60 seconds. If needed, increase:
```typescript
export const createUserWithEmail = functions
  .runWith({ timeoutSeconds: 120 })
  .https.onCall(async (data, context) => {
    // ...
  });
```

## Environment Variables (If Needed)

If you need to add environment variables:

```bash
firebase functions:config:set someservice.key="THE API KEY"
```

Access in code:
```typescript
const apiKey = functions.config().someservice.key;
```

## Rollback

If you need to rollback to a previous version:

1. **View deployment history:**
   ```bash
   firebase functions:log --limit 50
   ```

2. **Redeploy previous version:**
   - Checkout previous git commit
   - Run `firebase deploy --only functions`

## Next Steps

1. ✅ Functions are deployed and working
2. ⚠️ Consider adding email notifications when users are created
3. ⚠️ Consider adding custom claims for role-based access control
4. ⚠️ Consider adding welcome email functionality
5. ⚠️ Monitor function performance and costs in Firebase Console

## Support

- Firebase Functions docs: https://firebase.google.com/docs/functions
- Firebase Console: https://console.firebase.google.com
- GitHub issues: [Your repo URL]
