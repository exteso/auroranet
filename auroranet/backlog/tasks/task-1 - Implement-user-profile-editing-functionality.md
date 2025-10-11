---
id: task-1
title: Implement user profile editing functionality
status: To Do
assignee: []
created_date: '2025-10-11 14:40'
updated_date: '2025-10-11 14:42'
labels:
  - profile
  - user-management
  - firestore
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a user profile page where users can view and edit their profile information (display name, avatar, phone, preferences) and persist changes to Firestore. Note: Basic user document creation (uid, email, role) already implemented in task-13. This task extends the User model with additional profile fields and provides UI for editing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Profile component displays current user information
- [ ] #2 Users can edit their display name and profile details
- [ ] #3 Profile changes are saved to Firestore users collection
- [ ] #4 Profile page shows loading and success/error states
- [ ] #5 Users can only access and edit their own profile

- [ ] #6 User model is extended with profile fields (displayName, avatarUrl, phone, preferences)

- [ ] #7 User profile fields are initialized with default values during registration

- [ ] #8 UserService includes updateUserProfile method to persist changes to Firestore
<!-- AC:END -->
