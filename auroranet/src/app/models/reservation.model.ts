/**
 * Reservation status enum
 */
export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  WAITLIST = 'WAITLIST'
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED'
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  OTHER = 'OTHER'
}

/**
 * Check-in record interface
 */
export interface CheckInRecord {
  checkedInAt: Date;
  checkedInBy: string;      // Admin user ID who performed check-in
  checkedInByName?: string; // Admin display name
}

/**
 * Payment record interface
 */
export interface PaymentRecord {
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
  processedBy: string;      // Admin user ID who recorded payment
  processedByName?: string; // Admin display name
  transactionId?: string;
  notes?: string;
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

  // Check-in tracking
  checkIn?: CheckInRecord;      // Check-in information (if checked in)

  // Payment tracking
  paymentStatus: PaymentStatus; // Payment status (defaults to UNPAID)
  payment?: PaymentRecord;      // Payment information (if paid)
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

/**
 * Check if participant is checked in
 */
export function isCheckedIn(reservation: ReservationDocument): boolean {
  return !!reservation.checkIn;
}

/**
 * Check if participant has paid
 */
export function isPaid(reservation: ReservationDocument): boolean {
  return reservation.paymentStatus === PaymentStatus.PAID;
}

/**
 * Get payment status display label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PAID:
      return 'Paid';
    case PaymentStatus.UNPAID:
      return 'Unpaid';
    case PaymentStatus.PENDING:
      return 'Pending';
    case PaymentStatus.REFUNDED:
      return 'Refunded';
    default:
      return status;
  }
}

/**
 * Get payment method display label
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.CASH:
      return 'Cash';
    case PaymentMethod.CREDIT_CARD:
      return 'Credit Card';
    case PaymentMethod.DEBIT_CARD:
      return 'Debit Card';
    case PaymentMethod.BANK_TRANSFER:
      return 'Bank Transfer';
    case PaymentMethod.DIGITAL_WALLET:
      return 'Digital Wallet';
    case PaymentMethod.OTHER:
      return 'Other';
    default:
      return method;
  }
}
