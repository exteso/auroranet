import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UserDocument, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  private userService = inject(UserService);

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
}
