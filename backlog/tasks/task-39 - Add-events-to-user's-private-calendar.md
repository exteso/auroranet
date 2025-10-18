---
id: task-39
title: Add events to user's private calendar
status: To Do
assignee: []
created_date: '2025-10-18 21:23'
labels:
  - user-experience
  - integration
  - calendar
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users browsing events should be able to add events to their private calendar. For users who logged in with a Google account, use Google Calendar API integration to directly add events. For other users, provide downloadable calendar files (iCal format) that work with most calendar applications.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Add to Calendar button visible on event detail pages for logged-in users
- [ ] #2 For Google-authenticated users, integrate with Google Calendar API to add events directly
- [ ] #3 For non-Google users, generate and download iCal (.ics) file for the event
- [ ] #4 Calendar entry includes event title, date, time, location, and description
- [ ] #5 Calendar entry includes reminder set for 24 hours before event
- [ ] #6 Success message shown when event is added to calendar
- [ ] #7 Error handling for calendar API failures with user-friendly messages
- [ ] #8 User can add event to calendar from both event list and event detail views
- [ ] #9 Calendar entry updates if event details change (for Google Calendar)
- [ ] #10 Support for adding recurring events if applicable
- [ ] #11 Option to add all registered events to calendar at once from user dashboard
<!-- AC:END -->
