---
id: task-38
title: Increase the number of children joining the event
status: To Do
assignee: []
created_date: '2025-10-18 21:21'
labels:
  - event-management
  - user-experience
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently, each reservation allows only 1 child to join an event. This is too restrictive for families with multiple children. The system should allow users to specify the number of children (attendees) when registering for an event, with appropriate capacity tracking and validation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 User can specify number of children/attendees when registering for an event
- [ ] #2 Number of attendees field has appropriate validation (minimum 1, maximum configurable)
- [ ] #3 Event capacity is checked against total attendees (not just reservations)
- [ ] #4 Admin can see total attendee count vs registered reservation count in statistics
- [ ] #5 Participant list shows number of attendees per reservation
- [ ] #6 Bulk check-in properly handles multiple attendees per reservation
- [ ] #7 Payment tracking can handle different pricing based on number of attendees
- [ ] #8 Export functionality includes attendee count information
- [ ] #9 Real-time capacity updates reflect total attendees, not just reservations
<!-- AC:END -->
