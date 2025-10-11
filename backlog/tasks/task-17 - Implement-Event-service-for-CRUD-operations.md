---
id: task-17
title: Implement Event service for CRUD operations
status: Done
assignee:
  - '@claude'
created_date: '2025-10-10 19:13'
updated_date: '2025-10-11 18:35'
labels:
  - service
  - firestore
  - events
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create an Angular service to handle all event-related operations including creating, reading, updating, and deleting events from Firestore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EventService is created with Firestore integration
- [x] #2 createEvent method is implemented (admin only)
- [x] #3 getEvents method is implemented (with date filtering)
- [x] #4 getEventById method is implemented
- [x] #5 updateEvent method is implemented (admin only)
- [x] #6 deleteEvent method is implemented (admin only)
- [x] #7 Observable streams are provided for real-time event updates
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create EventService using Angular CLI
2. Import Firestore modules and Event models
3. Implement createEvent method with auto-ID generation
4. Implement getEvents method with query options (date range, status)
5. Implement getEventById method
6. Implement updateEvent method with registeredCount sync
7. Implement deleteEvent method
8. Add real-time observable streams using Firestore snapshots
9. Add error handling and logging
10. Verify build and test
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Successfully implemented comprehensive EventService with full CRUD operations, advanced querying, and real-time observable streams.

**EventService (src/app/services/event.service.ts):**

**Core CRUD Methods:**

1. **createEvent(eventData, adminUserId): Observable<string>**
   - Creates new event in Firestore with auto-generated ID
   - Sets initial registeredCount to 0
   - Sets status to SCHEDULED by default
   - Sets duration to 3 hours (default for all sessions)
   - Records admin user ID who created the event
   - Auto-generates createdAt and updatedAt timestamps
   - Returns created event ID for reference

2. **getEvents(options?): Observable<EventDocument[]>**
   - Retrieves events with flexible filtering
   - Query options:
     - startDate: Filter events from specific date
     - endDate: Filter events until specific date
     - status: Filter by EventStatus (SCHEDULED, FULL, CANCELLED, COMPLETED)
     - timeSlot: Filter by TimeSlot (MORNING, AFTERNOON)
     - limit: Limit number of results
   - Default ordering: date ascending
   - Returns array of EventDocument objects
   - Error handling returns empty array

3. **getEventById(eventId): Observable<EventDocument | null>**
   - Retrieves single event by document ID
   - Returns null if event not found
   - One-time fetch (not real-time)
   - Error handling returns null

4. **updateEvent(eventId, updateData): Observable<void>**
   - Updates event with partial data (EventUpdateData)
   - Auto-updates updatedAt timestamp
   - Admin only operation (enforced by Firestore rules)
   - Supports updating: title, description, date, timeSlot, capacity, status, location

5. **deleteEvent(eventId): Observable<void>**
   - Deletes event document from Firestore
   - Admin only operation (enforced by Firestore rules)
   - WARNING: Does not automatically delete associated reservations
   - Reservations should be handled separately before deletion

**Special Methods:**

6. **updateRegisteredCount(eventId, count): Observable<void>**
   - Updates event's registeredCount field
   - Automatically updates status to FULL when capacity reached
   - Automatically updates status to SCHEDULED when capacity not reached
   - Called by ReservationService when reservations change
   - Ensures event status stays in sync with actual registrations
   - Fetches current event to check capacity before status update

7. **getUpcomingEvents(limit?): Observable<EventDocument[]>**
   - Convenience method for getting future events
   - Filters from today onwards
   - Only returns SCHEDULED events
   - Useful for user event browsing

8. **getEventsByAdmin(adminUserId): Observable<EventDocument[]>**
   - Gets all events created by specific admin
   - Ordered by date descending (newest first)
   - Useful for admin event management dashboard

**Real-time Observable Streams:**

9. **getEventStream(eventId): Observable<EventDocument | null>**
   - Real-time observable for single event
   - Updates automatically when event changes in Firestore
   - Uses Firestore docData() for live updates
   - Ideal for event detail pages that need live capacity updates

10. **getEventsStream(options?): Observable<EventDocument[]>**
    - Real-time observable for events collection
    - Supports same filtering options as getEvents()
    - Updates automatically when any event changes
    - Ideal for event lists that need live updates
    - Useful for dashboards showing event capacity changes

**Query Capabilities:**
- Date range filtering (startDate, endDate)
- Status filtering (SCHEDULED, FULL, CANCELLED, COMPLETED)
- Time slot filtering (MORNING, AFTERNOON)
- Admin filtering (events by specific admin)
- Ordering by date (ascending for user view, descending for admin)
- Automatic timestamp handling (Firestore Timestamp conversion)

**Error Handling:**
- All methods include catchError operators
- Console logging for debugging
- Graceful degradation (return empty arrays or null)
- Errors thrown for critical operations (create, update, delete)
- Safe error handling for query operations

**Firestore Integration:**
- Uses @angular/fire/firestore v20
- Collection reference: 'events'
- Document references created dynamically
- Query constraints built dynamically based on options
- Timestamp conversion for date queries
- Auto-ID generation with addDoc()

**Observable Patterns:**
- All methods return Observables for async operations
- Uses RxJS operators: map, catchError
- Real-time streams use collectionData() and docData()
- Includes idField option for automatic ID mapping
- from() operator wraps Firestore promises

**Type Safety:**
- Full TypeScript integration
- EventDocument interface for type checking
- EventCreateData for creation operations
- EventUpdateData for partial updates
- EventQueryOptions interface for filtering

**Admin Operations:**
- createEvent: Admin only (pass adminUserId)
- updateEvent: Admin only (Firestore rules enforce)
- deleteEvent: Admin only (Firestore rules enforce)
- All admin IDs recorded in createdBy field

**Automatic Status Management:**
- registeredCount tracks actual reservations
- Status automatically becomes FULL at capacity
- Status automatically becomes SCHEDULED when under capacity
- updateRegisteredCount() handles status transitions

**Build Verification:**
- Build successful with no errors
- Total bundle size: 609.95 kB initial (166.62 kB estimated transfer)
- No bundle size increase (service is tree-shakeable)
- Build time: 1.325 seconds

**Integration Points:**
- Ready for admin event management UI (task-18, 19)
- Ready for user event browsing UI (task-21)
- Works with EventDocument model from task-16
- Will integrate with ReservationService (task-20)
- updateRegisteredCount() will be called by ReservationService

**Next Steps:**
- Task-20: Implement ReservationService
- ReservationService will call updateRegisteredCount() when reservations change
- Task-18: Build admin event creation form using createEvent()
- Task-19: Build admin event management using update/delete methods
- Task-21: Build user event browsing using getEvents() and getEventsStream()

The EventService is complete and ready for UI component integration.
<!-- SECTION:NOTES:END -->
