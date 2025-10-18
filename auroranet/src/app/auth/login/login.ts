import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  phoneForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  // Phone auth state
  usePhoneAuth: boolean = false;
  codeSent: boolean = false;
  recaptchaRendered: boolean = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.phoneForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnDestroy(): void {
    // Clean up reCAPTCHA when component is destroyed
    this.authService.clearRecaptcha();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        // For now, redirect to user dashboard (will add role-based routing in task-15)
        this.router.navigate(['/user/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error.code);
      }
    });
  }

  toggleAuthMethod(): void {
    this.usePhoneAuth = !this.usePhoneAuth;
    this.errorMessage = '';
    this.codeSent = false;
    this.recaptchaRendered = false;
    this.authService.clearRecaptcha();

    // Reset forms
    this.loginForm.reset();
    this.phoneForm.reset();

    // Set up reCAPTCHA when switching to phone auth
    if (this.usePhoneAuth) {
      setTimeout(() => {
        this.setupRecaptcha();
      }, 100);
    }
  }

  setupRecaptcha(): void {
    if (!this.recaptchaRendered) {
      try {
        this.authService.setupRecaptcha('recaptcha-container');
        this.recaptchaRendered = true;
      } catch (error) {
        console.error('Error setting up reCAPTCHA:', error);
        this.errorMessage = 'Failed to initialize reCAPTCHA. Please refresh the page.';
      }
    }
  }

  sendVerificationCode(): void {
    if (this.phoneForm.get('phoneNumber')?.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const phoneNumber = this.phoneForm.get('phoneNumber')?.value;

    this.authService.sendPhoneVerificationCode(phoneNumber).subscribe({
      next: () => {
        this.loading = false;
        this.codeSent = true;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getPhoneErrorMessage(error.code);
        console.error('Error sending verification code:', error);
      }
    });
  }

  verifyCode(): void {
    if (this.phoneForm.get('verificationCode')?.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const verificationCode = this.phoneForm.get('verificationCode')?.value;

    this.authService.verifyPhoneCode(verificationCode).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/user/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getPhoneErrorMessage(error.code);
        console.error('Error verifying code:', error);
      }
    });
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return 'An error occurred during login. Please try again';
    }
  }

  private getPhoneErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format. Use international format (e.g., +1234567890)';
      case 'auth/missing-phone-number':
        return 'Please enter a phone number';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please check and try again';
      case 'auth/code-expired':
        return 'Verification code has expired. Please request a new code';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      default:
        return 'An error occurred during phone authentication. Please try again';
    }
  }
}
