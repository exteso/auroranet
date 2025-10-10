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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);

  // Observable of authentication state
  public readonly authState$: Observable<User | null>;
  public readonly currentUser: User | null;

  constructor() {
    this.authState$ = authState(this.auth);
    this.currentUser = this.auth.currentUser;
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
   * @param email User email
   * @param password User password
   * @returns Promise with UserCredential
   */
  register(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
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
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }
}
