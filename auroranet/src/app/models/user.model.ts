/**
 * User role types
 */
export type UserRole = 'admin' | 'guest';

/**
 * User preferences interface
 */
export interface UserPreferences {
  emailNotifications: boolean;
  language: string;
  timezone: string;
}

/**
 * User document interface for Firestore
 */
export interface UserDocument {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  disabled?: boolean;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
