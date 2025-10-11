/**
 * Reservation status enum
 */
export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  WAITLIST = 'WAITLIST'
}

/**
 * Reservation document interface for Firestore
 */
export interface ReservationDocument {
  id: string;
  eventId: string;              // Reference to event document
  userId: string;               // User who made the reservation
  userEmail: string;            // User email for notifications
  userDisplayName?: string;     // User display name
  status: ReservationStatus;
  notes?: string;               // Optional notes from user
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reservation creation data
 */
export interface ReservationCreateData {
  eventId: string;
  notes?: string;
}

/**
 * Reservation with event details (for display purposes)
 */
export interface ReservationWithEvent extends ReservationDocument {
  eventTitle: string;
  eventDate: Date;
  eventTimeSlot: string;
  eventLocation?: string;
}

/**
 * Check if reservation is active
 */
export function isReservationActive(reservation: ReservationDocument): boolean {
  return reservation.status === ReservationStatus.CONFIRMED;
}

/**
 * Check if reservation can be cancelled
 * Users can cancel reservations up to 24 hours before event
 */
export function canCancelReservation(reservation: ReservationDocument, eventDate: Date): boolean {
  if (reservation.status !== ReservationStatus.CONFIRMED) {
    return false;
  }

  const now = new Date();
  const event = new Date(eventDate);
  const hoursDifference = (event.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursDifference >= 24;
}
