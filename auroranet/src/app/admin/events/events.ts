import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ReservationService } from '../../services/reservation';
import { EventDocument, EventStatus, getTimeSlotDisplay } from '../../models/event.model';
import { ReservationDocument } from '../../models/reservation.model';

@Component({
  selector: 'app-events',
  imports: [CommonModule, RouterLink],
  templateUrl: './events.html',
  styleUrl: './events.css'
})
export class Events implements OnInit {
  private eventService = inject(EventService);
  private reservationService = inject(ReservationService);

  events: EventDocument[] = [];
  isLoading = true;
  errorMessage = '';
  EventStatus = EventStatus;

  // For delete confirmation
  eventToDelete: EventDocument | null = null;
  isDeleting = false;

  // For viewing registrations
  selectedEvent: EventDocument | null = null;
  eventRegistrations: ReservationDocument[] = [];
  loadingRegistrations = false;

  ngOnInit(): void {
    this.loadEvents();
  }

  /**
   * Load events with real-time updates
   */
  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getEventsStream().subscribe({
      next: (events) => {
        this.events = events.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.errorMessage = 'Failed to load events. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get time slot display string
   */
  getTimeSlot(event: EventDocument): string {
    return getTimeSlotDisplay(event.timeSlot);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.SCHEDULED:
        return 'status-scheduled';
      case EventStatus.FULL:
        return 'status-full';
      case EventStatus.CANCELLED:
        return 'status-cancelled';
      case EventStatus.COMPLETED:
        return 'status-completed';
      default:
        return '';
    }
  }

  /**
   * Check if event is past
   */
  isEventPast(event: EventDocument): boolean {
    return new Date(event.date) < new Date();
  }

  /**
   * Show delete confirmation dialog
   */
  confirmDelete(event: EventDocument): void {
    this.eventToDelete = event;
  }

  /**
   * Cancel delete operation
   */
  cancelDelete(): void {
    this.eventToDelete = null;
  }

  /**
   * Delete event
   */
  deleteEvent(): void {
    if (!this.eventToDelete) return;

    this.isDeleting = true;
    const eventId = this.eventToDelete.id;

    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.eventToDelete = null;
        this.isDeleting = false;
        // Event will be automatically removed from list via real-time stream
      },
      error: (error) => {
        console.error('Error deleting event:', error);
        this.errorMessage = 'Failed to delete event. Please try again.';
        this.isDeleting = false;
      }
    });
  }

  /**
   * View registrations for an event
   */
  viewRegistrations(event: EventDocument): void {
    this.selectedEvent = event;
    this.loadingRegistrations = true;

    this.reservationService.getEventReservations(event.id, true).subscribe({
      next: (reservations) => {
        this.eventRegistrations = reservations;
        this.loadingRegistrations = false;
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
        this.errorMessage = 'Failed to load registrations.';
        this.loadingRegistrations = false;
      }
    });
  }

  /**
   * Close registrations modal
   */
  closeRegistrations(): void {
    this.selectedEvent = null;
    this.eventRegistrations = [];
  }
}
