import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authState,
  User,
  UserCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  linkWithCredential
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

  // Store reCAPTCHA verifier and confirmation result for phone auth
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

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

  /**
   * Set up reCAPTCHA verifier for phone authentication
   * Must be called before sending phone verification code
   * @param containerId ID of the HTML element to render reCAPTCHA
   * @returns RecaptchaVerifier instance
   */
  setupRecaptcha(containerId: string): RecaptchaVerifier {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'normal',
      callback: () => {
        // reCAPTCHA solved, allow phone auth
      },
      'expired-callback': () => {
        // Reset reCAPTCHA if it expires
        this.recaptchaVerifier?.clear();
      }
    });
    return this.recaptchaVerifier;
  }

  /**
   * Send verification code to phone number
   * @param phoneNumber Phone number in E.164 format (e.g., +1234567890)
   * @returns Observable with ConfirmationResult
   */
  sendPhoneVerificationCode(phoneNumber: string): Observable<ConfirmationResult> {
    if (!this.recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier not initialized. Call setupRecaptcha() first.');
    }

    return from(signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier)).pipe(
      map(confirmationResult => {
        this.confirmationResult = confirmationResult;
        return confirmationResult;
      })
    );
  }

  /**
   * Verify phone number with the code sent via SMS
   * Creates user document in Firestore if it's a new user
   * @param verificationCode 6-digit code sent to phone
   * @returns Observable with UserCredential
   */
  verifyPhoneCode(verificationCode: string): Observable<UserCredential> {
    if (!this.confirmationResult) {
      throw new Error('No confirmation result found. Send verification code first.');
    }

    return from(this.confirmationResult.confirm(verificationCode)).pipe(
      switchMap(userCredential => {
        const user = userCredential.user;
        const phoneNumber = user.phoneNumber || '';

        // Check if user document exists, create if not
        return this.userService.getUserRole(user.uid).pipe(
          switchMap(role => {
            if (role === null) {
              // New user - create user document with phone number
              // Use phone number as email placeholder and pass phone as separate param
              return this.userService.createUser(user.uid, phoneNumber, 'guest', phoneNumber).pipe(
                map(() => userCredential)
              );
            }
            // Existing user - just return credentials
            return from([userCredential]);
          })
        );
      })
    );
  }

  /**
   * Clear reCAPTCHA verifier
   * Call this when component is destroyed or when switching auth methods
   */
  clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  /**
   * Admin: Create new user with email and password
   * Creates both Firebase Auth account and Firestore user document
   * @param email User email
   * @param password User password
   * @param role User role
   * @param displayName Optional display name
   * @returns Observable with UserCredential
   */
  adminCreateUserWithEmail(
    email: string,
    password: string,
    role: UserRole = 'guest',
    displayName?: string
  ): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        // Create user document in Firestore
        const userDoc = {
          uid: userCredential.user.uid,
          email,
          role,
          displayName: displayName || email.split('@')[0]
        };

        return this.userService.createUser(
          userCredential.user.uid,
          email,
          role,
          undefined
        ).pipe(
          switchMap(() => {
            // Update display name if provided
            if (displayName) {
              return this.userService.updateUserProfile(userCredential.user.uid, { displayName }).pipe(
                map(() => userCredential)
              );
            }
            return from([userCredential]);
          })
        );
      })
    );
  }

  /**
   * Admin: Create new user with phone number
   * Note: This creates a user account but requires phone verification
   * For admin creation without verification, use Firebase Admin SDK on backend
   * @param phoneNumber Phone number in E.164 format
   * @param role User role
   * @param displayName Optional display name
   * @returns Observable with ConfirmationResult for verification
   */
  adminCreateUserWithPhone(
    phoneNumber: string,
    role: UserRole = 'guest',
    displayName?: string
  ): Observable<ConfirmationResult> {
    if (!this.recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier not initialized. Call setupRecaptcha() first.');
    }

    return from(signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier)).pipe(
      map(confirmationResult => {
        this.confirmationResult = confirmationResult;
        return confirmationResult;
      })
    );
  }
}
