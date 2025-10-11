import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  CollectionReference,
  QueryConstraint,
  collectionData
} from '@angular/fire/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import {
  ReservationDocument,
  ReservationCreateData,
  ReservationStatus,
  canCancelReservation
} from '../models/reservation.model';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private firestore: Firestore = inject(Firestore);
  private eventService: EventService = inject(EventService);
  private reservationsCollection: CollectionReference;

  constructor() {
    this.reservationsCollection = collection(this.firestore, 'reservations');
  }

  /**
   * Register user for an event
   * Prevents double-booking and checks capacity
   * @param reservationData Reservation creation data
   * @param userId User ID making the reservation
   * @param userEmail User email
   * @param userDisplayName Optional user display name
   * @returns Observable<string> - Created reservation ID
   */
  registerForEvent(
    reservationData: ReservationCreateData,
    userId: string,
    userEmail: string,
    userDisplayName?: string
  ): Observable<string> {
    const { eventId, notes } = reservationData;

    // Step 1: Check if user already has a reservation for this event
    return this.checkExistingReservation(userId, eventId).pipe(
      switchMap(hasReservation => {
        if (hasReservation) {
          return throwError(() => new Error('You already have a reservation for this event'));
        }

        // Step 2: Check event availability
        return this.checkEventAvailability(eventId);
      }),
      switchMap(isAvailable => {
        if (!isAvailable) {
          return throwError(() => new Error('Event is full or not available'));
        }

        // Step 3: Get current event to fetch registeredCount
        return this.eventService.getEventById(eventId);
      }),
      switchMap(event => {
        if (!event) {
          return throwError(() => new Error('Event not found'));
        }

        // Step 4: Create reservation
        const newReservation: Omit<ReservationDocument, 'id'> = {
          eventId,
          userId,
          userEmail,
          userDisplayName: userDisplayName || '',
          status: ReservationStatus.CONFIRMED,
          notes: notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return from(addDoc(this.reservationsCollection, newReservation)).pipe(
          map(docRef => ({ reservationId: docRef.id, event }))
        );
      }),
      switchMap(({ reservationId, event }) => {
        // Step 5: Update event registeredCount
        const newCount = event.registeredCount + 1;
        return this.eventService.updateRegisteredCount(event.id, newCount).pipe(
          map(() => reservationId)
        );
      }),
      catchError(error => {
        console.error('Error registering for event:', error);
        throw error;
      })
    );
  }

  /**
   * Cancel a user's reservation
   * Enforces 24-hour cancellation policy
   * @param reservationId Reservation document ID
   * @returns Observable<void>
   */
  cancelRegistration(reservationId: string): Observable<void> {
    const reservationRef = doc(this.firestore, `reservations/${reservationId}`);

    // Step 1: Get reservation and event details
    return from(getDoc(reservationRef)).pipe(
      switchMap(docSnapshot => {
        if (!docSnapshot.exists()) {
          return throwError(() => new Error('Reservation not found'));
        }

        const reservation = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as ReservationDocument;

        if (reservation.status !== ReservationStatus.CONFIRMED) {
          return throwError(() => new Error('Reservation is not active'));
        }

        // Step 2: Get event to check cancellation policy
        return this.eventService.getEventById(reservation.eventId).pipe(
          map(event => ({ reservation, event }))
        );
      }),
      switchMap(({ reservation, event }) => {
        if (!event) {
          return throwError(() => new Error('Event not found'));
        }

        // Step 3: Check if user can cancel (24hr rule)
        if (!canCancelReservation(reservation, event.date)) {
          return throwError(() => new Error('Cannot cancel reservation within 24 hours of event'));
        }

        // Step 4: Update reservation status to CANCELLED
        return from(updateDoc(reservationRef, {
          status: ReservationStatus.CANCELLED,
          updatedAt: new Date()
        })).pipe(
          map(() => ({ event }))
        );
      }),
      switchMap(({ event }) => {
        // Step 5: Update event registeredCount
        const newCount = Math.max(0, event.registeredCount - 1);
        return this.eventService.updateRegisteredCount(event.id, newCount);
      }),
      catchError(error => {
        console.error('Error cancelling reservation:', error);
        throw error;
      })
    );
  }

  /**
   * Get all reservations for a specific user
   * @param userId User ID
   * @param activeOnly If true, only return CONFIRMED reservations
   * @returns Observable<ReservationDocument[]>
   */
  getUserReservations(userId: string, activeOnly: boolean = false): Observable<ReservationDocument[]> {
    // Only query by userId to avoid composite index requirement
    const reservationsQuery = query(
      this.reservationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(reservationsQuery)).pipe(
      map(snapshot => {
        let reservations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ReservationDocument));

        // Filter by status client-side if activeOnly
        if (activeOnly) {
          reservations = reservations.filter(r => r.status === ReservationStatus.CONFIRMED);
        }

        return reservations;
      }),
      catchError(error => {
        console.error('Error getting user reservations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all reservations for a specific event
   * @param eventId Event ID
   * @param activeOnly If true, only return CONFIRMED reservations
   * @returns Observable<ReservationDocument[]>
   */
  getEventReservations(eventId: string, activeOnly: boolean = false): Observable<ReservationDocument[]> {
    // Only query by eventId to avoid composite index requirement
    // Filter by status client-side if needed
    const reservationsQuery = query(
      this.reservationsCollection,
      where('eventId', '==', eventId),
      orderBy('createdAt', 'asc')
    );

    return from(getDocs(reservationsQuery)).pipe(
      map(snapshot => {
        let reservations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ReservationDocument));

        // Filter by status client-side if activeOnly
        if (activeOnly) {
          reservations = reservations.filter(r => r.status === ReservationStatus.CONFIRMED);
        }

        return reservations;
      }),
      catchError(error => {
        console.error('Error getting event reservations:', error);
        return of([]);
      })
    );
  }

  /**
   * Check if event has available capacity
   * @param eventId Event ID
   * @returns Observable<boolean> - True if event has space
   */
  checkEventAvailability(eventId: string): Observable<boolean> {
    return this.eventService.getEventById(eventId).pipe(
      map(event => {
        if (!event) {
          return false;
        }
        return event.registeredCount < event.capacity;
      }),
      catchError(error => {
        console.error('Error checking event availability:', error);
        return of(false);
      })
    );
  }

  /**
   * Check if user already has a reservation for an event
   * Prevents double-booking
   * @param userId User ID
   * @param eventId Event ID
   * @returns Observable<boolean> - True if user already has reservation
   */
  private checkExistingReservation(userId: string, eventId: string): Observable<boolean> {
    const reservationsQuery = query(
      this.reservationsCollection,
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      where('status', '==', ReservationStatus.CONFIRMED)
    );

    return from(getDocs(reservationsQuery)).pipe(
      map(snapshot => !snapshot.empty),
      catchError(error => {
        console.error('Error checking existing reservation:', error);
        return of(false);
      })
    );
  }

  /**
   * Real-time observable stream for user's reservations
   * @param userId User ID
   * @param activeOnly If true, only return CONFIRMED reservations
   * @returns Observable<ReservationDocument[]>
   */
  getUserReservationsStream(userId: string, activeOnly: boolean = false): Observable<ReservationDocument[]> {
    // Only query by userId to avoid composite index requirement
    const reservationsQuery = query(
      this.reservationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return collectionData(reservationsQuery, { idField: 'id' }).pipe(
      map(data => {
        let reservations = data as ReservationDocument[];

        // Filter by status client-side if activeOnly
        if (activeOnly) {
          reservations = reservations.filter(r => r.status === ReservationStatus.CONFIRMED);
        }

        return reservations;
      }),
      catchError(error => {
        console.error('Error in user reservations stream:', error);
        return of([]);
      })
    );
  }

  /**
   * Real-time observable stream for event's reservations
   * @param eventId Event ID
   * @param activeOnly If true, only return CONFIRMED reservations
   * @returns Observable<ReservationDocument[]>
   */
  getEventReservationsStream(eventId: string, activeOnly: boolean = false): Observable<ReservationDocument[]> {
    // Only query by eventId to avoid composite index requirement
    const reservationsQuery = query(
      this.reservationsCollection,
      where('eventId', '==', eventId),
      orderBy('createdAt', 'asc')
    );

    return collectionData(reservationsQuery, { idField: 'id' }).pipe(
      map(data => {
        let reservations = data as ReservationDocument[];

        // Filter by status client-side if activeOnly
        if (activeOnly) {
          reservations = reservations.filter(r => r.status === ReservationStatus.CONFIRMED);
        }

        return reservations;
      }),
      catchError(error => {
        console.error('Error in event reservations stream:', error);
        return of([]);
      })
    );
  }
}
