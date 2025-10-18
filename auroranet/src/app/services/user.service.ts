import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  QuerySnapshot,
  DocumentReference,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserDocument, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private functions: Functions = inject(Functions);

  /**
   * Create a new user document in Firestore
   * @param uid User ID from Firebase Auth
   * @param email User email (or phone number if phone auth)
   * @param role User role (admin or guest)
   * @param phone Optional phone number
   * @returns Observable<void>
   */
  createUser(uid: string, email: string, role: UserRole = 'guest', phone?: string): Observable<void> {
    const userDoc: UserDocument = {
      uid,
      email,
      role,
      displayName: email.includes('@') ? email.split('@')[0] : email, // Default display name from email or phone
      avatarUrl: '',
      phone: phone || '',
      preferences: {
        emailNotifications: true,
        language: 'en',
        timezone: 'UTC'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userRef = doc(this.firestore, `users/${uid}`);
    return from(setDoc(userRef, userDoc));
  }

  /**
   * Get user document from Firestore
   * @param uid User ID
   * @returns Observable<UserDocument | null>
   */
  getUser(uid: string): Observable<UserDocument | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      map((docSnapshot: DocumentSnapshot) => {
        if (docSnapshot.exists()) {
          return docSnapshot.data() as UserDocument;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error getting user document:', error);
        return of(null);
      })
    );
  }

  /**
   * Get user role from Firestore
   * @param uid User ID
   * @returns Observable<UserRole | null>
   */
  getUserRole(uid: string): Observable<UserRole | null> {
    return this.getUser(uid).pipe(
      map(user => user ? user.role : null)
    );
  }

  /**
   * Check if user is admin
   * @param uid User ID
   * @returns Observable<boolean>
   */
  isAdmin(uid: string): Observable<boolean> {
    return this.getUserRole(uid).pipe(
      map(role => role === 'admin')
    );
  }

  /**
   * Update user profile fields in Firestore
   * @param uid User ID
   * @param profileData Partial user data to update
   * @returns Observable<void>
   */
  updateUserProfile(uid: string, profileData: Partial<UserDocument>): Observable<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const updateData = {
      ...profileData,
      updatedAt: new Date()
    };

    return from(updateDoc(userRef, updateData)).pipe(
      catchError(error => {
        console.error('Error updating user profile:', error);
        throw error;
      })
    );
  }

  /**
   * Get all users from Firestore (Admin only)
   * @returns Observable<UserDocument[]>
   */
  getAllUsers(): Observable<UserDocument[]> {
    const usersRef = collection(this.firestore, 'users');
    const usersQuery = query(usersRef);

    return from(getDocs(usersQuery)).pipe(
      map((querySnapshot: QuerySnapshot) => {
        const users: UserDocument[] = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data() as UserDocument);
        });
        return users;
      }),
      catchError(error => {
        console.error('Error getting all users:', error);
        return of([]);
      })
    );
  }

  /**
   * Update user role (Admin only)
   * @param uid User ID
   * @param newRole New role to assign
   * @returns Observable<void>
   */
  updateUserRole(uid: string, newRole: UserRole): Observable<void> {
    return this.updateUserProfile(uid, { role: newRole });
  }

  /**
   * Disable or enable user account (Admin only)
   * @param uid User ID
   * @param disabled Whether to disable the account
   * @returns Observable<void>
   */
  setUserDisabled(uid: string, disabled: boolean): Observable<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const updateData = {
      disabled,
      updatedAt: new Date()
    };

    return from(updateDoc(userRef, updateData)).pipe(
      catchError(error => {
        console.error('Error updating user disabled status:', error);
        throw error;
      })
    );
  }

  /**
   * Create user with email via Cloud Function (Admin only)
   * Uses Firebase Admin SDK to create user without signing in as them
   * @param email User email
   * @param password User password
   * @param displayName User display name
   * @param role User role
   * @param phone Optional phone number
   * @returns Observable with result
   */
  createUserWithEmailViaFunction(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    phone?: string
  ): Observable<any> {
    const createUserFn = httpsCallable(this.functions, 'createUserWithEmail');
    return from(createUserFn({ email, password, displayName, role, phone })).pipe(
      map((result: any) => result.data),
      catchError(error => {
        console.error('Error calling createUserWithEmail function:', error);
        throw error;
      })
    );
  }

  /**
   * Create user with phone via Cloud Function (Admin only)
   * Uses Firebase Admin SDK to create user without signing in as them
   * @param phoneNumber User phone number in E.164 format
   * @param displayName User display name
   * @param role User role
   * @param password Optional password
   * @returns Observable with result
   */
  createUserWithPhoneViaFunction(
    phoneNumber: string,
    displayName: string,
    role: UserRole,
    password?: string
  ): Observable<any> {
    const createUserFn = httpsCallable(this.functions, 'createUserWithPhone');
    return from(createUserFn({ phoneNumber, displayName, role, password })).pipe(
      map((result: any) => result.data),
      catchError(error => {
        console.error('Error calling createUserWithPhone function:', error);
        throw error;
      })
    );
  }
}
