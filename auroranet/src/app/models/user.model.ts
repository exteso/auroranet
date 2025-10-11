/**
 * User role types
 */
export type UserRole = 'admin' | 'guest';

/**
 * User document interface for Firestore
 */
export interface UserDocument {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
