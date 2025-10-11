/**
 * Time slot enum for events
 * Events are 3-hour sessions in morning or afternoon
 */
export enum TimeSlot {
  MORNING = 'MORNING',     // 09:00 - 12:00
  AFTERNOON = 'AFTERNOON'  // 14:00 - 17:00
}

/**
 * Event status enum
 */
export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  FULL = 'FULL',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

/**
 * Event document interface for Firestore
 */
export interface EventDocument {
  id: string;
  title: string;
  description?: string;
  date: Date;
  timeSlot: TimeSlot;
  duration: number;              // Duration in hours (default: 3)
  capacity: number;              // Maximum number of attendees
  registeredCount: number;       // Current number of registered users
  status: EventStatus;
  location?: string;
  createdBy: string;             // Admin user ID who created the event
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Event creation data (subset of EventDocument for creating new events)
 */
export interface EventCreateData {
  title: string;
  description?: string;
  date: Date;
  timeSlot: TimeSlot;
  capacity: number;
  location?: string;
}

/**
 * Event update data (partial update of event fields)
 */
export interface EventUpdateData {
  title?: string;
  description?: string;
  date?: Date;
  timeSlot?: TimeSlot;
  capacity?: number;
  status?: EventStatus;
  location?: string;
}

/**
 * Helper function to get time slot display string
 */
export function getTimeSlotDisplay(slot: TimeSlot): string {
  return slot === TimeSlot.MORNING ? 'Morning (09:00 - 12:00)' : 'Afternoon (14:00 - 17:00)';
}

/**
 * Helper function to get time slot hours
 */
export function getTimeSlotHours(slot: TimeSlot): { start: number; end: number } {
  return slot === TimeSlot.MORNING ? { start: 9, end: 12 } : { start: 14, end: 17 };
}

/**
 * Check if event is full
 */
export function isEventFull(event: EventDocument): boolean {
  return event.registeredCount >= event.capacity;
}

/**
 * Check if event date is in the past
 */
export function isEventPast(event: EventDocument): boolean {
  return new Date(event.date) < new Date();
}

/**
 * Validate event date is within 2-month planning window
 */
export function isEventDateValid(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoMonthsFromNow = new Date(today);
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);

  return eventDate >= today && eventDate <= twoMonthsFromNow;
}

/**
 * Get date range for valid event dates (next 2 months)
 */
export function getValidEventDateRange(): { min: Date; max: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const max = new Date(today);
  max.setMonth(max.getMonth() + 2);

  return { min: today, max };
}
