import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authState,
  User,
  UserCredential
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UserService } from './user.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private userService: UserService = inject(UserService);

  // Observable of authentication state
  public readonly authState$: Observable<User | null>;

  constructor() {
    this.authState$ = authState(this.auth);
  }

  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with UserCredential
   */
  login(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Register a new user with email and password
   * Creates user document in Firestore with default 'guest' role
   * @param email User email
   * @param password User password
   * @param role User role (defaults to 'guest')
   * @returns Observable with UserCredential
   */
  register(email: string, password: string, role: UserRole = 'guest'): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        // Create user document in Firestore
        return this.userService.createUser(userCredential.user.uid, email, role).pipe(
          map(() => userCredential)
        );
      })
    );
  }

  /**
   * Logout the current user
   * @returns Promise<void>
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Get current user
   * @returns Current Firebase user or null
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Check if user is authenticated (synchronous)
   * Note: May return false during initial Firebase auth state restoration
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Check if user is authenticated (asynchronous, waits for Firebase to initialize)
   * Use this in route guards to properly handle auth state restoration
   * @returns Observable<boolean>
   */
  isAuthenticatedAsync(): Observable<boolean> {
    return this.authState$.pipe(
      map(user => user !== null)
    );
  }

  /**
   * Get current user's role from Firestore
   * @returns Observable<UserRole | null>
   */
  getUserRole(): Observable<UserRole | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return from([null]);
    }
    return this.userService.getUserRole(currentUser.uid);
  }

  /**
   * Check if current user is admin
   * @returns Observable<boolean>
   */
  isAdmin(): Observable<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return from([false]);
    }
    return this.userService.isAdmin(currentUser.uid);
  }
}
