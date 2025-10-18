import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  DocumentReference,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserDocument, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);

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
}
