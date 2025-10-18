import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UserDocument, UserRole } from '../../models/user.model';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users: UserDocument[] = [];
  filteredUsers: UserDocument[] = [];
  selectedUser: UserDocument | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Search and filter
  searchTerm: string = '';
  roleFilter: string = 'all';
  showDisabled: boolean = true;

  // Modal state
  showUserModal: boolean = false;
  showConfirmDialog: boolean = false;
  confirmAction: (() => void) | null = null;
  confirmMessage: string = '';

  // Create user modal state
  showCreateUserModal: boolean = false;
  newUser = {
    email: '',
    phone: '',
    displayName: '',
    role: 'guest' as UserRole,
    password: '',
    generatePassword: false,
    sendWelcomeEmail: false
  };
  createUserStep: 'form' | 'phone-verification' = 'form';
  phoneVerificationCode: string = '';
  validationErrors: { [key: string]: string } = {};

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Load all users from Firestore
   */
  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users. Please try again.';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  /**
   * Apply search and filter to users list
   */
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Role filter
      if (this.roleFilter !== 'all' && user.role !== this.roleFilter) {
        return false;
      }

      // Disabled filter
      if (!this.showDisabled && user.disabled) {
        return false;
      }

      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return (
          user.email.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }

  /**
   * Open user detail modal
   */
  viewUser(user: UserDocument): void {
    this.selectedUser = user;
    this.showUserModal = true;
    this.clearMessages();
  }

  /**
   * Close user modal
   */
  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
  }

  /**
   * Update user role with confirmation
   */
  updateRole(user: UserDocument, newRole: UserRole): void {
    const roleAction = newRole === 'admin' ? 'promote to admin' : 'demote to guest';
    this.confirmMessage = `Are you sure you want to ${roleAction} ${user.displayName || user.email}?`;

    this.confirmAction = () => {
      this.loading = true;
      this.clearMessages();

      this.userService.updateUserRole(user.uid, newRole).subscribe({
        next: () => {
          user.role = newRole;
          this.successMessage = `User role updated successfully to ${newRole}`;
          this.loading = false;
          this.loadUsers(); // Reload to ensure consistency
        },
        error: (error) => {
          this.errorMessage = 'Failed to update user role. Please try again.';
          this.loading = false;
          console.error('Error updating user role:', error);
        }
      });
    };

    this.showConfirmDialog = true;
  }

  /**
   * Toggle user disabled status with confirmation
   */
  toggleDisabled(user: UserDocument): void {
    const action = user.disabled ? 'enable' : 'disable';
    this.confirmMessage = `Are you sure you want to ${action} ${user.displayName || user.email}?`;

    this.confirmAction = () => {
      this.loading = true;
      this.clearMessages();

      this.userService.setUserDisabled(user.uid, !user.disabled).subscribe({
        next: () => {
          user.disabled = !user.disabled;
          this.successMessage = `User ${action}d successfully`;
          this.loading = false;
          this.loadUsers(); // Reload to ensure consistency
        },
        error: (error) => {
          this.errorMessage = `Failed to ${action} user. Please try again.`;
          this.loading = false;
          console.error(`Error ${action}ing user:`, error);
        }
      });
    };

    this.showConfirmDialog = true;
  }

  /**
   * Confirm dialog action
   */
  confirmDialogAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.closeConfirmDialog();
    }
  }

  /**
   * Close confirm dialog
   */
  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.confirmAction = null;
    this.confirmMessage = '';
  }

  /**
   * Clear success and error messages
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | any): string {
    if (!date) return 'N/A';

    // Handle Firestore Timestamp
    if (date.toDate) {
      date = date.toDate();
    }

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(role: UserRole): string {
    return role === 'admin' ? 'badge-admin' : 'badge-guest';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(disabled?: boolean): string {
    return disabled ? 'badge-disabled' : 'badge-active';
  }

  /**
   * Get count of users by role
   */
  getUserCountByRole(role: UserRole): number {
    return this.users.filter(user => user.role === role).length;
  }

  /**
   * Open create user modal
   */
  openCreateUserModal(): void {
    this.showCreateUserModal = true;
    this.resetNewUserForm();
    this.clearMessages();
  }

  /**
   * Close create user modal
   */
  closeCreateUserModal(): void {
    this.showCreateUserModal = false;
    this.resetNewUserForm();
    this.authService.clearRecaptcha();
  }

  /**
   * Reset new user form
   */
  resetNewUserForm(): void {
    this.newUser = {
      email: '',
      phone: '',
      displayName: '',
      role: 'guest',
      password: '',
      generatePassword: false,
      sendWelcomeEmail: false
    };
    this.createUserStep = 'form';
    this.phoneVerificationCode = '';
    this.validationErrors = {};
  }

  /**
   * Generate random password
   */
  generateRandomPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Toggle password generation
   */
  toggleGeneratePassword(): void {
    this.newUser.generatePassword = !this.newUser.generatePassword;
    if (this.newUser.generatePassword) {
      this.newUser.password = this.generateRandomPassword();
    } else {
      this.newUser.password = '';
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (E.164 format)
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate create user form
   */
  validateCreateUserForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Check if at least email or phone is provided
    if (!this.newUser.email && !this.newUser.phone) {
      this.validationErrors['contact'] = 'Either email or phone number is required';
      isValid = false;
    }

    // Validate email if provided
    if (this.newUser.email && !this.validateEmail(this.newUser.email)) {
      this.validationErrors['email'] = 'Invalid email format';
      isValid = false;
    }

    // Validate phone if provided (and no email)
    if (this.newUser.phone) {
      if (!this.validatePhone(this.newUser.phone)) {
        this.validationErrors['phone'] = 'Invalid phone format. Use E.164 format (e.g., +1234567890)';
        isValid = false;
      }
    }

    // Password required for email users
    if (this.newUser.email && !this.newUser.phone && !this.newUser.password) {
      this.validationErrors['password'] = 'Password is required for email users';
      isValid = false;
    }

    // Password length validation
    if (this.newUser.password && this.newUser.password.length < 6) {
      this.validationErrors['password'] = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Display name validation
    if (!this.newUser.displayName || this.newUser.displayName.trim().length === 0) {
      this.validationErrors['displayName'] = 'Display name is required';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Create new user
   */
  createUser(): void {
    if (!this.validateCreateUserForm()) {
      this.errorMessage = 'Please fix the validation errors';
      return;
    }

    this.loading = true;
    this.clearMessages();

    // Verify admin is logged in
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'Admin must be logged in to create users';
      this.loading = false;
      return;
    }

    // Determine creation method: email or phone
    if (this.newUser.email) {
      // Create user with email via Cloud Function
      this.userService.createUserWithEmailViaFunction(
        this.newUser.email,
        this.newUser.password,
        this.newUser.displayName,
        this.newUser.role,
        this.newUser.phone
      ).subscribe({
        next: (result) => {
          this.successMessage = `User ${this.newUser.displayName} created successfully`;
          this.loading = false;
          this.closeCreateUserModal();
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage = `Failed to create user: ${error.message || 'Unknown error'}`;
          this.loading = false;
          console.error('Error creating user:', error);
        }
      });
    } else if (this.newUser.phone) {
      // Create user with phone via Cloud Function
      this.userService.createUserWithPhoneViaFunction(
        this.newUser.phone,
        this.newUser.displayName,
        this.newUser.role,
        this.newUser.password
      ).subscribe({
        next: (result) => {
          this.successMessage = `Phone user ${this.newUser.displayName} created successfully`;
          this.loading = false;
          this.closeCreateUserModal();
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage = `Failed to create phone user: ${error.message || 'Unknown error'}`;
          this.loading = false;
          console.error('Error creating phone user:', error);
        }
      });
    }
  }
}
