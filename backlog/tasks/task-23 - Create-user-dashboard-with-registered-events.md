---
id: task-23
title: Create user dashboard with registered events
status: Done
assignee:
  - '@yanke'
created_date: '2025-10-10 19:14'
updated_date: '2025-10-11 21:07'
labels:
  - user
  - ui
  - dashboard
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a dashboard view for users to see all their registered events and manage their bookings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 User dashboard component is created
- [x] #2 Dashboard displays all user's registered events
- [x] #3 Events are grouped by upcoming and past
- [x] #4 Each event shows date, time slot, and event details
- [x] #5 Cancel registration button is available for upcoming events
- [x] #6 Empty state message when user has no registrations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Generate a new Angular component for the user dashboard (user-dashboard).
2. Create the basic structure of the dashboard component's HTML and CSS.
3. Implement the service method to fetch the user's registered events.
4. Implement the logic to group events into 'upcoming' and 'past'.
5. Display event details in the template.
6. Add a 'Cancel' button for upcoming events and implement the cancellation logic.
7. Implement the empty state view.
8. Add the new component to the routing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created the user-dashboard component to display a user's registered events.\nImplemented the logic to fetch the user's reservations and the corresponding event details.\nThe dashboard now separates events into upcoming and past sections.\nUsers can cancel their registration for upcoming events directly from the dashboard.\nAn empty state message is displayed if the user has no registered events.\nThe component is integrated into the existing routing at /user/dashboard.
<!-- SECTION:NOTES:END -->
