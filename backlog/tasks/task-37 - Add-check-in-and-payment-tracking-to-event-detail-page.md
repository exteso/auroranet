---
id: task-37
title: Add check-in and payment tracking to event detail page
status: To Do
assignee: []
created_date: '2025-10-18 17:08'
labels:
  - admin
  - event-management
  - payment
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement check-in and payment tracking functionality for event participants. This allows admins to mark attendees as checked-in when they arrive at the event and track payment status for paid events. Essential for event day operations, attendance tracking, and financial reconciliation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admin can mark individual participants as checked-in with timestamp
- [ ] #2 Bulk check-in functionality to mark multiple participants at once
- [ ] #3 Visual indicators show check-in status (checked-in, not checked-in)
- [ ] #4 Admin can see check-in statistics (total checked-in vs registered)
- [ ] #5 Payment status field for each participant (paid, unpaid, pending)
- [ ] #6 Admin can mark participants as paid with amount and payment method
- [ ] #7 Payment summary showing total revenue, paid count, unpaid count
- [ ] #8 Filter participants by check-in status and payment status
- [ ] #9 Undo check-in functionality for mistakes
- [ ] #10 Check-in and payment history with timestamps and admin who performed action
- [ ] #11 QR code generation for quick check-in (optional)
- [ ] #12 All changes are saved to Firestore and reflected in real-time
<!-- AC:END -->
