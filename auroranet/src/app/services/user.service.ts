import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
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
   * @param email User email
   * @param role User role (admin or guest)
   * @returns Observable<void>
   */
  createUser(uid: string, email: string, role: UserRole = 'guest'): Observable<void> {
    const userDoc: UserDocument = {
      uid,
      email,
      role,
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
}
