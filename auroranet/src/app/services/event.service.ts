import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
  collectionData,
  docData
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  EventDocument,
  EventCreateData,
  EventUpdateData,
  EventStatus,
  TimeSlot
} from '../models/event.model';

/**
 * Query options for filtering events
 */
export interface EventQueryOptions {
  startDate?: Date;
  endDate?: Date;
  status?: EventStatus;
  timeSlot?: TimeSlot;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private firestore: Firestore = inject(Firestore);
  private eventsCollection: CollectionReference;

  constructor() {
    this.eventsCollection = collection(this.firestore, 'events');
  }

  /**
   * Create a new event
   * Admin only operation
   * @param eventData Event creation data
   * @param adminUserId Admin user ID who is creating the event
   * @returns Observable<string> - The created event ID
   */
  createEvent(eventData: EventCreateData, adminUserId: string): Observable<string> {
    const newEvent: Omit<EventDocument, 'id'> = {
      title: eventData.title,
      description: eventData.description || '',
      date: eventData.date,
      timeSlot: eventData.timeSlot,
      duration: 3, // Default 3-hour sessions
      capacity: eventData.capacity,
      registeredCount: 0, // Start with 0 registrations
      status: EventStatus.SCHEDULED,
      location: eventData.location || '',
      createdBy: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return from(addDoc(this.eventsCollection, newEvent)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error creating event:', error);
        throw error;
      })
    );
  }

  /**
   * Get all events with optional filtering
   * @param options Query options for filtering
   * @returns Observable<EventDocument[]>
   */
  getEvents(options?: EventQueryOptions): Observable<EventDocument[]> {
    const constraints: QueryConstraint[] = [];

    // Add query constraints based on options
    if (options?.startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(options.startDate)));
    }

    if (options?.endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(options.endDate)));
    }

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.timeSlot) {
      constraints.push(where('timeSlot', '==', options.timeSlot));
    }

    // Default ordering by date ascending
    constraints.push(orderBy('date', 'asc'));

    const eventsQuery = query(this.eventsCollection, ...constraints);

    return from(getDocs(eventsQuery)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EventDocument));
      }),
      catchError(error => {
        console.error('Error getting events:', error);
        return of([]);
      })
    );
  }

  /**
   * Get a single event by ID
   * @param eventId Event document ID
   * @returns Observable<EventDocument | null>
   */
  getEventById(eventId: string): Observable<EventDocument | null> {
    const eventRef = doc(this.firestore, `events/${eventId}`);

    return from(getDoc(eventRef)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          return {
            id: docSnapshot.id,
            ...docSnapshot.data()
          } as EventDocument;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error getting event:', error);
        return of(null);
      })
    );
  }

  /**
   * Real-time observable stream for a single event
   * @param eventId Event document ID
   * @returns Observable<EventDocument | null>
   */
  getEventStream(eventId: string): Observable<EventDocument | null> {
    const eventRef = doc(this.firestore, `events/${eventId}`);

    return docData(eventRef, { idField: 'id' }).pipe(
      map(data => data as EventDocument),
      catchError(error => {
        console.error('Error in event stream:', error);
        return of(null);
      })
    );
  }

  /**
   * Real-time observable stream for events collection with optional filtering
   * @param options Query options for filtering
   * @returns Observable<EventDocument[]>
   */
  getEventsStream(options?: EventQueryOptions): Observable<EventDocument[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(options.startDate)));
    }

    if (options?.endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(options.endDate)));
    }

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.timeSlot) {
      constraints.push(where('timeSlot', '==', options.timeSlot));
    }

    constraints.push(orderBy('date', 'asc'));

    const eventsQuery = query(this.eventsCollection, ...constraints);

    return collectionData(eventsQuery, { idField: 'id' }).pipe(
      map(data => data as EventDocument[]),
      catchError(error => {
        console.error('Error in events stream:', error);
        return of([]);
      })
    );
  }

  /**
   * Update an event
   * Admin only operation
   * @param eventId Event document ID
   * @param updateData Partial event data to update
   * @returns Observable<void>
   */
  updateEvent(eventId: string, updateData: EventUpdateData): Observable<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);
    const data = {
      ...updateData,
      updatedAt: new Date()
    };

    return from(updateDoc(eventRef, data)).pipe(
      catchError(error => {
        console.error('Error updating event:', error);
        throw error;
      })
    );
  }

  /**
   * Update event registered count
   * Called when reservations are added/removed
   * @param eventId Event document ID
   * @param count New registered count
   * @returns Observable<void>
   */
  updateRegisteredCount(eventId: string, count: number): Observable<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);

    return from(getDoc(eventRef)).pipe(
      map(docSnapshot => {
        if (!docSnapshot.exists()) {
          throw new Error('Event not found');
        }

        const event = docSnapshot.data() as EventDocument;
        const newStatus = count >= event.capacity ? EventStatus.FULL : EventStatus.SCHEDULED;

        return { newStatus };
      }),
      map(({ newStatus }) => {
        return updateDoc(eventRef, {
          registeredCount: count,
          status: newStatus,
          updatedAt: new Date()
        });
      }),
      map(() => undefined),
      catchError(error => {
        console.error('Error updating registered count:', error);
        throw error;
      })
    );
  }

  /**
   * Delete an event
   * Admin only operation
   * Warning: This will not automatically delete associated reservations
   * @param eventId Event document ID
   * @returns Observable<void>
   */
  deleteEvent(eventId: string): Observable<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);

    return from(deleteDoc(eventRef)).pipe(
      catchError(error => {
        console.error('Error deleting event:', error);
        throw error;
      })
    );
  }

  /**
   * Get upcoming events (from today onwards)
   * @param limit Optional limit on number of results
   * @returns Observable<EventDocument[]>
   */
  getUpcomingEvents(limit?: number): Observable<EventDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getEvents({
      startDate: today,
      status: EventStatus.SCHEDULED,
      limit
    });
  }

  /**
   * Get events created by a specific admin
   * @param adminUserId Admin user ID
   * @returns Observable<EventDocument[]>
   */
  getEventsByAdmin(adminUserId: string): Observable<EventDocument[]> {
    const eventsQuery = query(
      this.eventsCollection,
      where('createdBy', '==', adminUserId),
      orderBy('date', 'desc')
    );

    return from(getDocs(eventsQuery)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EventDocument));
      }),
      catchError(error => {
        console.error('Error getting events by admin:', error);
        return of([]);
      })
    );
  }
}
