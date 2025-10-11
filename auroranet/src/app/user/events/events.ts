import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { ReservationService } from '../../services/reservation';
import { AuthService } from '../../services/auth';
import { EventDocument, EventStatus, TimeSlot, getTimeSlotDisplay, getValidEventDateRange } from '../../models/event.model';
import { ReservationDocument, ReservationCreateData } from '../../models/reservation.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-events',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './events.html',
  styleUrl: './events.css'
})
export class Events implements OnInit, OnDestroy {
  private eventService = inject(EventService);
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  events: EventDocument[] = [];
  filteredEvents: EventDocument[] = [];
  userReservations: ReservationDocument[] = [];
  userReservedEventIds: Set<string> = new Set();

  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Registration modal
  eventToRegister: EventDocument | null = null;
  isRegistering = false;

  // Cancellation modal
  reservationToCancel: ReservationDocument | null = null;
  eventToCancel: EventDocument | null = null;
  isCancelling = false;

  filterForm!: FormGroup;
  TimeSlot = TimeSlot;
  EventStatus = EventStatus;

  minDate: string = '';
  maxDate: string = '';

  ngOnInit(): void {
    // Get valid date range for filters
    const dateRange = getValidEventDateRange();
    this.minDate = this.formatDateForInput(dateRange.min);
    this.maxDate = this.formatDateForInput(dateRange.max);

    // Initialize filter form
    this.filterForm = this.fb.group({
      startDate: [this.minDate],
      endDate: [this.maxDate],
      timeSlot: ['all']
    });

    // Load events
    this.loadEvents();

    // Load user reservations
    this.loadUserReservations();

    // Watch for filter changes
    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load events with real-time updates
   */
  loadEvents(): void {
    this.isLoading = true;

    // Get upcoming events only (from today onwards)
    // Show both SCHEDULED and FULL events (users should see full events, just can't register)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.eventService.getEventsStream({
      startDate: today
      // No status filter - show all upcoming events (SCHEDULED, FULL, etc.)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (events) => {
        // Filter out CANCELLED and COMPLETED events
        this.events = events.filter(event =>
          event.status !== EventStatus.CANCELLED &&
          event.status !== EventStatus.COMPLETED
        );
        this.applyFilters();
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
   * Load user's reservations with real-time updates
   */
  loadUserReservations(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.reservationService.getUserReservationsStream(currentUser.uid, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservations) => {
          this.userReservations = reservations;
          // Build a Set of event IDs for quick lookup
          this.userReservedEventIds = new Set(reservations.map(r => r.eventId));
        },
        error: (error) => {
          console.error('Error loading user reservations:', error);
        }
      });
  }

  /**
   * Apply filters to events list
   */
  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.events];

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(event => new Date(event.date) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(event => new Date(event.date) <= endDate);
    }

    // Filter by time slot
    if (filters.timeSlot && filters.timeSlot !== 'all') {
      filtered = filtered.filter(event => event.timeSlot === filters.timeSlot);
    }

    // Filter out past events
    const now = new Date();
    filtered = filtered.filter(event => new Date(event.date) >= now);

    this.filteredEvents = filtered;
  }

  /**
   * Format date for HTML input[type="date"]
   */
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
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
   * Get available slots count
   */
  getAvailableSlots(event: EventDocument): number {
    return event.capacity - event.registeredCount;
  }

  /**
   * Check if event is full
   */
  isEventFull(event: EventDocument): boolean {
    return event.registeredCount >= event.capacity;
  }

  /**
   * Check if event is past
   */
  isEventPast(event: EventDocument): boolean {
    return new Date(event.date) < new Date();
  }

  /**
   * Check if user is registered for event
   */
  isUserRegistered(event: EventDocument): boolean {
    return this.userReservedEventIds.has(event.id);
  }

  /**
   * Get user's reservation for an event
   */
  getUserReservation(event: EventDocument): ReservationDocument | undefined {
    return this.userReservations.find(r => r.eventId === event.id);
  }

  /**
   * Show registration confirmation modal
   */
  showRegisterModal(event: EventDocument): void {
    this.eventToRegister = event;
    this.clearMessages();
  }

  /**
   * Cancel registration modal
   */
  cancelRegisterModal(): void {
    this.eventToRegister = null;
  }

  /**
   * Register for event
   */
  confirmRegistration(): void {
    if (!this.eventToRegister) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'You must be logged in to register for events.';
      return;
    }

    this.isRegistering = true;
    this.clearMessages();

    const reservationData: ReservationCreateData = {
      eventId: this.eventToRegister.id,
      notes: ''
    };

    this.reservationService.registerForEvent(
      reservationData,
      currentUser.uid,
      currentUser.email || '',
      currentUser.displayName || ''
    ).subscribe({
      next: () => {
        this.successMessage = `Successfully registered for "${this.eventToRegister!.title}"!`;
        this.eventToRegister = null;
        this.isRegistering = false;
        // Reservations will update automatically via real-time stream
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.errorMessage = error.message || 'Failed to register for event. Please try again.';
        this.isRegistering = false;
      }
    });
  }

  /**
   * Show cancellation confirmation modal
   */
  showCancelModal(event: EventDocument): void {
    const reservation = this.getUserReservation(event);
    if (!reservation) return;

    this.eventToCancel = event;
    this.reservationToCancel = reservation;
    this.clearMessages();
  }

  /**
   * Cancel cancellation modal
   */
  cancelCancelModal(): void {
    this.eventToCancel = null;
    this.reservationToCancel = null;
  }

  /**
   * Cancel registration
   */
  confirmCancellation(): void {
    if (!this.reservationToCancel || !this.eventToCancel) return;

    this.isCancelling = true;
    this.clearMessages();

    this.reservationService.cancelRegistration(this.reservationToCancel.id).subscribe({
      next: () => {
        this.successMessage = `Successfully cancelled registration for "${this.eventToCancel!.title}".`;
        this.eventToCancel = null;
        this.reservationToCancel = null;
        this.isCancelling = false;
        // Reservations will update automatically via real-time stream
      },
      error: (error) => {
        console.error('Cancellation error:', error);
        this.errorMessage = error.message || 'Failed to cancel registration. Please try again.';
        this.isCancelling = false;
      }
    });
  }

  /**
   * Clear success and error messages
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Reset filters to default
   */
  resetFilters(): void {
    this.filterForm.patchValue({
      startDate: this.minDate,
      endDate: this.maxDate,
      timeSlot: 'all'
    });
  }
}
