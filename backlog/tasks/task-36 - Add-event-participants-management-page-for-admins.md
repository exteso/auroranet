---
id: task-36
title: Add event participants management page for admins
status: To Do
assignee: []
created_date: '2025-10-18 17:07'
updated_date: '2025-10-18 19:45'
labels:
  - admin
  - event-management
  - user-management
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create an admin interface to view and manage participants for individual events. Admins need the ability to see who has registered for an event and manually add users who want to attend but haven't registered through the normal flow. This is useful for walk-in registrations, special invitations, or administrative corrections.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admin can navigate from the Event Management page to event detail page showing participant list
- [ ] #2 Page displays all registered participants with user details (name, email, phone, registration date)
- [ ] #3 Admin can search and filter the participant list
- [ ] #4 Admin can see participant count and capacity information
- [ ] #5 Admin can manually add existing users to the event from a user selection modal
- [ ] #6 Admin can remove participants from the event with confirmation dialog
- [ ] #7 Page shows real-time participant updates
- [ ] #8 Export participant list functionality (CSV or print-friendly view)
- [ ] #9 Appropriate success/error messages for all operations
<!-- AC:END -->
