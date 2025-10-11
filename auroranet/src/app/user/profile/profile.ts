import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user.service';
import { UserDocument } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  profileForm: FormGroup;
  loading: boolean = false;
  loadingProfile: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  currentUser: UserDocument | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      avatarUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      emailNotifications: [true],
      language: ['en', [Validators.required]],
      timezone: ['UTC', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'No user logged in';
      this.loadingProfile = false;
      return;
    }

    this.userService.getUser(user.uid).subscribe({
      next: (userDoc) => {
        if (userDoc) {
          this.currentUser = userDoc;
          this.profileForm.patchValue({
            displayName: userDoc.displayName || '',
            phone: userDoc.phone || '',
            avatarUrl: userDoc.avatarUrl || '',
            emailNotifications: userDoc.preferences?.emailNotifications ?? true,
            language: userDoc.preferences?.language || 'en',
            timezone: userDoc.preferences?.timezone || 'UTC'
          });
        }
        this.loadingProfile = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load profile';
        console.error('Error loading profile:', error);
        this.loadingProfile = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'No user logged in';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.profileForm.value;
    const profileData: Partial<UserDocument> = {
      displayName: formValue.displayName,
      phone: formValue.phone,
      avatarUrl: formValue.avatarUrl,
      preferences: {
        emailNotifications: formValue.emailNotifications,
        language: formValue.language,
        timezone: formValue.timezone
      }
    };

    this.userService.updateUserProfile(user.uid, profileData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Profile updated successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to update profile. Please try again.';
        console.error('Error updating profile:', error);
      }
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error logging out:', error);
        this.errorMessage = 'Failed to logout. Please try again.';
      }
    });
  }
}
