---
id: task-40
title: Admin management of yearly membership subscriptions and payments
status: To Do
assignee: []
created_date: '2025-10-18 21:26'
labels:
  - admin
  - membership
  - payment
  - user-management
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement admin interface to view, manage, and track yearly membership subscriptions for users. Admins need to be able to check subscription status, view membership history, register membership payments, and manage renewals. This is essential for tracking which users have active memberships and ensuring proper access to member-only events or benefits.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admin can view list of all users with their membership status (active, expired, pending, none)
- [ ] #2 Admin can filter users by membership status and expiration date
- [ ] #3 Admin can view detailed membership history for each user (all past subscriptions)
- [ ] #4 Admin can register a new yearly membership payment for a user with amount and payment method
- [ ] #5 System automatically calculates membership expiration date (1 year from payment date)
- [ ] #6 Admin can manually adjust membership expiration dates if needed
- [ ] #7 Visual indicators show membership status (active in green, expired in red, expiring soon in yellow)
- [ ] #8 Admin can see members expiring within the next 30 days for renewal follow-up
- [ ] #9 Membership payment history is tracked with date, amount, method, and admin who processed it
- [ ] #10 Export functionality for membership list and payment reports
- [ ] #11 Success/error messages for all membership operations
- [ ] #12 Real-time updates when membership status changes
<!-- AC:END -->
