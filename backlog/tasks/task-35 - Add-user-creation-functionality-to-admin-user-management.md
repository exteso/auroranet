---
id: task-35
title: Add user creation functionality to admin user management
status: To Do
assignee: []
created_date: '2025-10-18 16:51'
updated_date: '2025-10-18 17:01'
labels:
  - admin
  - user-management
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the admin user management portal with the ability to create new user accounts directly from the interface. This allows admins to onboard users without requiring them to self-register, useful for pre-provisioning accounts or adding users who may not have immediate access to the registration form.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admin can click 'Create User' button on user management page
- [ ] #2 Modal form opens with fields for email or phone, display name, and role selection
- [ ] #3 if email is not empty, Form validates email format and required fields before submission
- [ ] #4 if email is empty, phone must contain a valid international number and the user on firebase should be created using the phone provider
- [ ] #5 Admin can set initial password or generate random password
- [ ] #6 Option to send welcome email with credentials to new user (optional)
- [ ] #7 New user is created in Firebase Auth and Firestore
- [ ] #8 New user appears in the user list immediately after creation
- [ ] #9 Appropriate success/error messages are displayed

<!-- AC:END -->
