---
id: task-16
title: Design Event data model and Firestore schema
status: To Do
assignee: []
created_date: '2025-10-10 19:13'
labels:
  - data-model
  - firestore
  - design
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define the data structure for events including all required fields for 3-hour sessions, morning/afternoon slots, capacity, and date constraints (2-month planning window).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Event interface/model is defined with all required fields (id, title, date, timeSlot, capacity, registeredUsers)
- [ ] #2 TimeSlot enum is defined (MORNING, AFTERNOON)
- [ ] #3 Date validation logic ensures events are within 2-month window
- [ ] #4 Firestore collection structure for events is documented
- [ ] #5 Firestore collection structure for reservations/registrations is documented
<!-- AC:END -->
