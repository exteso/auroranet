# AuroraNet Cloud Functions

Firebase Cloud Functions for AuroraNet application, providing server-side operations using Firebase Admin SDK.

## Overview

This directory contains Firebase Cloud Functions that handle privileged operations requiring elevated permissions, such as creating users without affecting the current admin session.

## Structure

```
functions/
├── src/
│   └── index.ts          # Main functions export
├── lib/                  # Compiled JavaScript (generated)
├── node_modules/         # Dependencies (gitignored)
├── package.json          # NPM dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .gitignore           # Git ignore rules
├── DEPLOYMENT.md        # Deployment instructions
└── README.md            # This file
```

## Available Functions

### `createUserWithEmail`

Creates a new user with email/password authentication using Firebase Admin SDK.

**Type:** `https.onCall` (callable from client)

**Parameters:**
```typescript
{
  email: string;           // User's email address
  password: string;        // User's password (min 6 chars)
  displayName: string;     // User's display name
  role: 'admin' | 'guest'; // User's role
  phone?: string;          // Optional phone number
}
```

**Returns:**
```typescript
{
  success: boolean;
  uid: string;            // Firebase Auth UID
  email: string;          // User's email
}
```

**Security:**
- Requires caller to be authenticated
- Requires caller to have `admin` role in Firestore

**Usage in Angular:**
```typescript
this.userService.createUserWithEmailViaFunction(
  'user@example.com',
  'password123',
  'John Doe',
  'guest',
  '+1234567890'  // optional
);
```

---

### `createUserWithPhone`

Creates a new user with phone number authentication using Firebase Admin SDK.

**Type:** `https.onCall` (callable from client)

**Parameters:**
```typescript
{
  phoneNumber: string;     // Phone in E.164 format (e.g., +1234567890)
  displayName: string;     // User's display name
  role: 'admin' | 'guest'; // User's role
  password?: string;       // Optional password for email auth fallback
}
```

**Returns:**
```typescript
{
  success: boolean;
  uid: string;            // Firebase Auth UID
  phoneNumber: string;    // User's phone number
}
```

**Security:**
- Requires caller to be authenticated
- Requires caller to have `admin` role in Firestore
- Validates phone number format (E.164)

**Usage in Angular:**
```typescript
this.userService.createUserWithPhoneViaFunction(
  '+1234567890',
  'Jane Smith',
  'guest',
  'optionalPassword'  // optional
);
```

## Development

### Prerequisites

- Node.js 18+ (Firebase Functions requirement)
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project configured

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in `lib/` directory.

### Watch Mode

```bash
npm run build:watch
```

Automatically recompiles on file changes.

### Local Testing

```bash
npm run serve
```

Starts Firebase emulators. Configure Angular to connect:

```typescript
// In app.config.ts
import { connectFunctionsEmulator } from '@angular/fire/functions';

provideFunctions(() => {
  const functions = getFunctions();
  if (environment.useEmulators) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
  return functions;
})
```

### Deploy

```bash
npm run deploy
```

Deploys functions to Firebase. See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

## Error Handling

All functions use consistent error handling:

```typescript
try {
  // Function logic
  return { success: true, ... };
} catch (error: any) {
  functions.logger.error('Error description:', error);
  throw new functions.https.HttpsError('internal', error.message);
}
```

**Common Error Codes:**
- `unauthenticated`: User not logged in
- `permission-denied`: User not admin
- `invalid-argument`: Invalid input data
- `internal`: Server-side error

## Logging

Functions use Firebase Functions logger:

```typescript
functions.logger.info('Info message', { data });
functions.logger.error('Error message', error);
```

**View logs:**
```bash
firebase functions:log
firebase functions:log --only createUserWithEmail
firebase functions:log --follow
```

## Security

### Authentication Check

```typescript
if (!context.auth) {
  throw new functions.https.HttpsError(
    'unauthenticated',
    'Must be authenticated'
  );
}
```

### Admin Role Check

```typescript
const callerDoc = await admin.firestore()
  .collection('users')
  .doc(context.auth.uid)
  .get();

if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
  throw new functions.https.HttpsError(
    'permission-denied',
    'Only admins can perform this action'
  );
}
```

### Input Validation

All inputs are validated before processing:
- Email format validation
- Phone number E.164 format validation
- Password minimum length (6 characters)
- Role enum validation ('admin' | 'guest')

## Best Practices

1. **Always validate inputs** - Never trust client data
2. **Log important events** - Use `functions.logger` for debugging
3. **Use descriptive error messages** - Help developers debug issues
4. **Keep functions focused** - One function = one responsibility
5. **Handle errors gracefully** - Always catch and return proper errors

## Testing Checklist

Before deploying:

- [ ] Functions build successfully: `npm run build`
- [ ] No TypeScript errors
- [ ] Security checks work (auth + admin role)
- [ ] Input validation works (invalid data rejected)
- [ ] Users created in Firebase Auth
- [ ] User documents created in Firestore
- [ ] Proper error messages returned
- [ ] Logs are informative

## Cost Optimization

- Functions are lightweight (< 1 second execution)
- Use free tier: 2M invocations/month
- Monitor usage in Firebase Console
- Consider caching if needed in future

## Future Enhancements

Potential additions:

- [ ] Send welcome email on user creation
- [ ] Set custom claims for role-based access
- [ ] Batch user creation from CSV
- [ ] User deletion function
- [ ] User update function
- [ ] Email verification trigger
- [ ] Password reset function

## Troubleshooting

**Function not found:**
- Verify deployment: `firebase functions:list`
- Check function names match between code and Angular

**Permission denied:**
- Verify user is logged in
- Verify user has admin role in Firestore

**Timeout errors:**
- Check function execution time in logs
- Increase timeout if needed (default: 60s)

## Support

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Console](https://console.firebase.google.com)
- [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guide

## License

Same as parent project.
