import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function: Create user with email and password (Admin only)
 *
 * This function allows admins to create new users with email/password authentication
 * without being signed out themselves.
 *
 * @param data.email - User's email address
 * @param data.password - User's password (min 6 characters)
 * @param data.displayName - User's display name
 * @param data.role - User's role ('admin' or 'guest')
 * @param data.phone - Optional phone number
 * @param context - Authentication context
 * @returns Object with success status and user UID
 */
export const createUserWithEmail = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to create users'
    );
  }

  // Verify the caller is an admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();

  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create users'
    );
  }

  // Validate required fields
  const { email, password, displayName, role, phone } = data;

  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters'
    );
  }

  if (!displayName || typeof displayName !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Display name is required');
  }

  if (!role || (role !== 'admin' && role !== 'guest')) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Role must be either "admin" or "guest"'
    );
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber: phone || undefined,
    });

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role,
      phone: phone || '',
      avatarUrl: '',
      preferences: {
        emailNotifications: true,
        language: 'en',
        timezone: 'UTC',
      },
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`User created by admin ${callerUid}: ${userRecord.uid}`);

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    };
  } catch (error: any) {
    functions.logger.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Create user with phone number (Admin only)
 *
 * This function allows admins to create new users with phone authentication.
 *
 * @param data.phoneNumber - User's phone number in E.164 format (e.g., +1234567890)
 * @param data.displayName - User's display name
 * @param data.role - User's role ('admin' or 'guest')
 * @param data.password - Optional password for email/password auth fallback
 * @param context - Authentication context
 * @returns Object with success status and user UID
 */
export const createUserWithPhone = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to create users'
    );
  }

  // Verify the caller is an admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();

  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create users'
    );
  }

  // Validate required fields
  const { phoneNumber, displayName, role, password } = data;

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
  }

  // Validate E.164 format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Phone number must be in E.164 format (e.g., +1234567890)'
    );
  }

  if (!displayName || typeof displayName !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Display name is required');
  }

  if (!role || (role !== 'admin' && role !== 'guest')) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Role must be either "admin" or "guest"'
    );
  }

  try {
    // Create user in Firebase Auth with phone number
    const userRecord = await admin.auth().createUser({
      phoneNumber,
      displayName,
      password: password || undefined,
    });

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: phoneNumber, // Use phone as email identifier
      displayName,
      role,
      phone: phoneNumber,
      avatarUrl: '',
      preferences: {
        emailNotifications: false,
        language: 'en',
        timezone: 'UTC',
      },
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Phone user created by admin ${callerUid}: ${userRecord.uid}`);

    return {
      success: true,
      uid: userRecord.uid,
      phoneNumber: userRecord.phoneNumber,
    };
  } catch (error: any) {
    functions.logger.error('Error creating phone user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
