---
id: task-41
title: Login user with OAuth for google and meta
status: To Do
assignee: []
created_date: '2025-10-19 10:21'
labels:
  - auth
  - oauth
  - user-experience
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement OAuth authentication to allow users to sign in using their Google or Meta (Facebook) accounts. This provides a seamless login experience and reduces friction for new users who don't want to create a separate email/password account.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 User can see 'Sign in with Google' button on login page
- [ ] #2 User can see 'Sign in with Meta' button on login page
- [ ] #3 Clicking Google button initiates Google OAuth flow
- [ ] #4 Clicking Meta button initiates Meta OAuth flow
- [ ] #5 After successful OAuth authentication, user is redirected back to the app
- [ ] #6 New OAuth user gets Firestore user document created with 'guest' role
- [ ] #7 Existing OAuth user is signed in and redirected to dashboard
- [ ] #8 User's profile includes OAuth provider information (Google or Meta)
- [ ] #9 Error messages are displayed for failed OAuth attempts
- [ ] #10 OAuth users can access all features available to email/password users
<!-- AC:END -->
