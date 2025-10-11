---
id: task-16
title: Design Event data model and Firestore schema
status: Done
assignee:
  - '@claude'
created_date: '2025-10-10 19:13'
updated_date: '2025-10-11 15:13'
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
- [x] #1 Event interface/model is defined with all required fields (id, title, date, timeSlot, capacity, registeredUsers)
- [x] #2 TimeSlot enum is defined (MORNING, AFTERNOON)
- [x] #3 Date validation logic ensures events are within 2-month window
- [x] #4 Firestore collection structure for events is documented
- [x] #5 Firestore collection structure for reservations/registrations is documented
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create TimeSlot enum for MORNING/AFTERNOON sessions
2. Define Event interface with all required fields
3. Define Reservation interface for user registrations
4. Add date validation utility functions for 2-month window
5. Document Firestore collection structures
6. Create model files in src/app/models/
7. Verify build
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Successfully designed and implemented comprehensive data models for events and reservations with Firestore schema documentation.

**Event Model (src/app/models/event.model.ts):**

**TimeSlot Enum:**
- MORNING: 09:00 - 12:00 (3 hours)
- AFTERNOON: 14:00 - 17:00 (3 hours)

**EventStatus Enum:**
- SCHEDULED: Event is scheduled and accepting registrations
- FULL: Event has reached capacity
- CANCELLED: Event has been cancelled by admin
- COMPLETED: Event has finished

**EventDocument Interface:**
```typescript
{
  id: string;                    // Firestore document ID
  title: string;                 // Event title
  description?: string;          // Optional event description
  date: Date;                    // Event date
  timeSlot: TimeSlot;           // MORNING or AFTERNOON
  duration: number;              // Duration in hours (default: 3)
  capacity: number;              // Maximum attendees
  registeredCount: number;       // Current registered count
  status: EventStatus;           // Event status
  location?: string;             // Optional location info
  createdBy: string;             // Admin user ID
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

**Helper Interfaces:**
- EventCreateData: Subset for creating new events
- EventUpdateData: Partial update interface

**Utility Functions:**
- `getTimeSlotDisplay()`: Returns formatted time slot string
- `getTimeSlotHours()`: Returns start/end hours object
- `isEventFull()`: Checks if event reached capacity
- `isEventPast()`: Checks if event date has passed
- `isEventDateValid()`: Validates event is within 2-month window
- `getValidEventDateRange()`: Returns min/max date range for events

**Date Validation:**
- Events must be scheduled within next 2 months from today
- Prevents scheduling events too far in advance
- Enforces minimum date of today (no past events)

**Reservation Model (src/app/models/reservation.model.ts):**

**ReservationStatus Enum:**
- CONFIRMED: Reservation is confirmed
- CANCELLED: User cancelled reservation
- WAITLIST: User on waitlist (future enhancement)

**ReservationDocument Interface:**
```typescript
{
  id: string;                    // Firestore document ID
  eventId: string;               // Reference to event
  userId: string;                // User who made reservation
  userEmail: string;             // User email for notifications
  userDisplayName?: string;      // User display name
  status: ReservationStatus;     // Reservation status
  notes?: string;                // Optional user notes
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

**Helper Interfaces:**
- ReservationCreateData: Data needed to create reservation
- ReservationWithEvent: Extended interface with event details for display

**Utility Functions:**
- `isReservationActive()`: Checks if reservation is confirmed
- `canCancelReservation()`: Validates if user can cancel (24hr rule)

**Cancellation Policy:**
- Users can cancel up to 24 hours before event
- Prevents last-minute cancellations

**Firestore Schema Documentation:**

**Collection: `events`**
```
/events/{eventId}
  - id: string
  - title: string
  - description: string (optional)
  - date: timestamp
  - timeSlot: string ('MORNING' | 'AFTERNOON')
  - duration: number
  - capacity: number
  - registeredCount: number
  - status: string ('SCHEDULED' | 'FULL' | 'CANCELLED' | 'COMPLETED')
  - location: string (optional)
  - createdBy: string (admin user ID)
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Collection: `reservations`**
```
/reservations/{reservationId}
  - id: string
  - eventId: string (reference to events/{eventId})
  - userId: string (reference to users/{userId})
  - userEmail: string
  - userDisplayName: string (optional)
  - status: string ('CONFIRMED' | 'CANCELLED' | 'WAITLIST')
  - notes: string (optional)
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Firestore Indexes Needed:**
```
events:
  - date ASC, timeSlot ASC
  - status ASC, date ASC
  - createdBy ASC, date DESC

reservations:
  - userId ASC, createdAt DESC
  - eventId ASC, status ASC
  - status ASC, createdAt DESC
```

**Firestore Security Rules (Already Implemented):**
- Events: Read by all authenticated, write by admins only
- Reservations: Users can read/write own reservations, admins can manage all

**Data Relationships:**
- One event can have many reservations (1:N)
- One user can have many reservations (1:N)
- Event.registeredCount should match count of confirmed reservations
- Reservation.eventId references Event.id
- Reservation.userId references User.uid

**Business Rules:**
1. Events are 3-hour sessions (MORNING: 9-12, AFTERNOON: 14-17)
2. Events can only be scheduled within next 2 months
3. Each event has a capacity limit
4. When capacity is reached, event status becomes FULL
5. Users can cancel reservations up to 24 hours before event
6. Only admins can create/edit/delete events
7. registeredCount must be kept in sync with actual reservations

**Build Verification:**
- Build successful with no errors
- Total bundle size: 609.95 kB initial (166.62 kB estimated transfer)
- No bundle size increase (models are TypeScript interfaces)
- Build time: 1.393 seconds

**Next Steps:**
- Task-17: Implement EventService with CRUD operations
- Task-20: Implement ReservationService with booking logic
- Implement logic to update event.registeredCount when reservations change
- Add Firestore compound indexes via Firebase Console or firebase.indexes.json

The data models and Firestore schema are complete and ready for service implementation.
<!-- SECTION:NOTES:END -->
