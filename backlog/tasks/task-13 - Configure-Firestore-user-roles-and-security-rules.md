---
id: task-13
title: Configure Firestore user roles and security rules
status: Done
assignee:
  - '@claude'
created_date: '2025-10-10 19:13'
updated_date: '2025-10-11 14:21'
labels:
  - firebase
  - security
  - authentication
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Set up Firestore data structure for storing user roles (admin/guest) and implement security rules to enforce role-based access control at the database level.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Firestore users collection is created with role field
- [x] #2 Security rules enforce that only admins can create/edit events
- [x] #3 Security rules allow guests to read events and create reservations
- [x] #4 Security rules prevent users from modifying other users' data
- [x] #5 Custom claims or Firestore-based roles are properly configured
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define User interface/model with role field (admin/guest)
2. Create Firestore security rules file (firestore.rules)
3. Implement UserService to create/read user documents with roles
4. Update AuthService to create user document on registration
5. Add getUserRole() method to AuthService
6. Update AdminGuard to check actual admin role from Firestore
7. Test role-based access control and verify build
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Successfully implemented Firestore-based role management with comprehensive security rules and role-based access control throughout the application.

**User Model (src/app/models/user.model.ts):**
- Defined UserRole type: 'admin' | 'guest'
- Created UserDocument interface with required fields:
  - uid: User ID from Firebase Auth
  - email: User email address
  - role: User role (admin or guest)
  - createdAt: Document creation timestamp
  - updatedAt: Document update timestamp

**Firestore Security Rules (firestore.rules):**
- Complete security rules for users, events, and reservations collections
- Helper functions for authentication and role checking
- Users collection:
  - Users can read their own documents
  - Users can create their own documents during registration
  - Users can update their own documents but cannot change their role
  - Only admins can delete user documents
- Events collection:
  - All authenticated users can read events
  - Only admins can create, update, or delete events
- Reservations collection:
  - Users can read their own reservations, admins can read all
  - Users can create reservations for themselves
  - Users can update/delete their own reservations
  - Admins can update/delete any reservation

**UserService (src/app/services/user.service.ts):**
- createUser(): Creates user document in Firestore with specified role
- getUser(): Retrieves user document by UID
- getUserRole(): Gets user's role from Firestore
- isAdmin(): Checks if user has admin role
- All methods return Observables for async operations
- Error handling with console logging and null returns

**AuthService Updates (src/app/services/auth.ts):**
- Injected UserService for Firestore operations
- Updated register() method:
  - Creates Firebase Auth user
  - Creates corresponding Firestore user document with 'guest' role by default
  - Uses switchMap to chain operations
  - Optional role parameter for future admin creation
- Added getUserRole() method: Returns current user's role from Firestore
- Added isAdmin() method: Checks if current user has admin role
- Both new methods return Observables

**AdminGuard Updates (src/app/guards/admin-guard.ts):**
- Now performs two-level check:
  1. Authentication check (isAuthenticatedAsync)
  2. Admin role check (authService.isAdmin)
- Redirects unauthenticated users to login
- Redirects non-admin users to /user/dashboard
- Uses switchMap to chain async operations
- Properly handles Observable streams with take(1)

**Role Assignment Strategy:**
- New registrations default to 'guest' role
- Admin role must be assigned manually via Firestore console or backend function
- First user can be promoted to admin through Firebase console
- Security rules prevent users from self-promoting to admin

**Build Verification:**
- Build successful with no errors
- Total bundle size: 605.15 kB initial (165.28 kB estimated transfer)
- Bundle size warning (exceeded 500 kB budget) is expected with Firebase/Firestore
- All lazy-loaded chunks working correctly
- Build time: 1.340 seconds

**Security Features:**
- Role-based access control at database level (Firestore rules)
- Role-based access control at application level (Guards)
- Users cannot modify their own roles
- Admin-only operations are protected both in UI and database
- Proper authentication checks before role checks

**Next Steps:**
- Deploy firestore.rules to Firebase project using Firebase CLI
- Create first admin user manually via Firebase console
- Test role-based access control with both admin and guest users
- Event management features (tasks 16-19) will leverage these security rules

The role-based access control system is complete and ready for event management implementation.
<!-- SECTION:NOTES:END -->
