import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { EventService } from '../../services/event.service';
import { ReservationService } from '../../services/reservation';
import { UserService } from '../../services/user.service';
import { EventDocument, getTimeSlotDisplay } from '../../models/event.model';
import { ReservationDocument, ReservationStatus } from '../../models/reservation.model';
import { UserDocument } from '../../models/user.model';

interface ParticipantWithUser extends ReservationDocument {
  userPhone?: string;
  registrationDate: string;
}

@Component({
  selector: 'app-event-participants',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './event-participants.html',
  styleUrl: './event-participants.css'
})
export class EventParticipants implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  eventId: string = '';
  event: EventDocument | null = null;
  participants: ParticipantWithUser[] = [];
  filteredParticipants: ParticipantWithUser[] = [];
  allUsers: UserDocument[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Search and filter
  searchTerm = '';
  filterStatus: ReservationStatus | 'ALL' = 'ALL';

  // Add user modal
  showAddUserModal = false;
  availableUsers: UserDocument[] = [];
  searchUserTerm = '';
  filteredAvailableUsers: UserDocument[] = [];
  isAddingUser = false;

  // Remove participant
  participantToRemove: ParticipantWithUser | null = null;
  isRemoving = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.eventId = params.get('eventId') || '';
        if (!this.eventId) {
          this.errorMessage = 'Event ID not found';
          this.isLoading = false;
          return [];
        }
        return this.loadEventAndParticipants();
      })
    ).subscribe({
      error: (error) => {
        console.error('Error loading data:', error);
        this.errorMessage = 'Failed to load event details';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load event details and participants with real-time updates
   */
  loadEventAndParticipants() {
    return combineLatest([
      this.eventService.getEventById(this.eventId),
      this.reservationService.getEventReservationsStream(this.eventId, false)
    ]).pipe(
      map(([event, reservations]) => {
        this.event = event;
        this.participants = reservations.map(r => ({
          ...r,
          registrationDate: new Date(r.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
        this.applyFilters();
        this.isLoading = false;
      })
    );
  }

  /**
   * Apply search and filter to participants
   */
  applyFilters(): void {
    let filtered = [...this.participants];

    // Filter by status
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(p => p.status === this.filterStatus);
    }

    // Search by name or email
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.userDisplayName?.toLowerCase().includes(term) ||
        p.userEmail.toLowerCase().includes(term)
      );
    }

    this.filteredParticipants = filtered;
  }

  /**
   * Handle search input change
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Handle filter status change
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Open add user modal
   */
  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.searchUserTerm = '';
    this.loadAvailableUsers();
  }

  /**
   * Close add user modal
   */
  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.availableUsers = [];
    this.filteredAvailableUsers = [];
  }

  /**
   * Load users who are not already registered for this event
   */
  loadAvailableUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Filter out users who are already registered
        const registeredUserIds = this.participants
          .filter(p => p.status === ReservationStatus.CONFIRMED)
          .map(p => p.userId);

        this.availableUsers = users.filter(u => !registeredUserIds.includes(u.uid));
        this.filterAvailableUsers();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Failed to load users';
      }
    });
  }

  /**
   * Filter available users based on search term
   */
  filterAvailableUsers(): void {
    if (!this.searchUserTerm.trim()) {
      this.filteredAvailableUsers = [...this.availableUsers];
      return;
    }

    const term = this.searchUserTerm.toLowerCase();
    this.filteredAvailableUsers = this.availableUsers.filter(u =>
      u.displayName?.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  }

  /**
   * Handle user search input change
   */
  onUserSearchChange(): void {
    this.filterAvailableUsers();
  }

  /**
   * Add user to event
   */
  addUserToEvent(user: UserDocument): void {
    if (!this.event) return;

    // Check if event is at capacity
    if (this.event.registeredCount >= this.event.capacity) {
      this.errorMessage = 'Event is at full capacity';
      return;
    }

    this.isAddingUser = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.registerForEvent(
      { eventId: this.eventId },
      user.uid,
      user.email,
      user.displayName
    ).subscribe({
      next: () => {
        this.successMessage = `Successfully added ${user.displayName || user.email} to the event`;
        this.closeAddUserModal();
        this.isAddingUser = false;
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error adding user:', error);
        this.errorMessage = error.message || 'Failed to add user to event';
        this.isAddingUser = false;
      }
    });
  }

  /**
   * Show remove confirmation dialog
   */
  confirmRemove(participant: ParticipantWithUser): void {
    this.participantToRemove = participant;
  }

  /**
   * Cancel remove operation
   */
  cancelRemove(): void {
    this.participantToRemove = null;
  }

  /**
   * Remove participant from event
   */
  removeParticipant(): void {
    if (!this.participantToRemove) return;

    this.isRemoving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.cancelRegistration(this.participantToRemove.id).subscribe({
      next: () => {
        this.successMessage = `Successfully removed ${this.participantToRemove?.userDisplayName || this.participantToRemove?.userEmail}`;
        this.participantToRemove = null;
        this.isRemoving = false;
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error removing participant:', error);
        this.errorMessage = error.message || 'Failed to remove participant';
        this.isRemoving = false;
      }
    });
  }

  /**
   * Export participants to CSV
   */
  exportToCSV(): void {
    if (!this.event || this.filteredParticipants.length === 0) return;

    const csvHeader = 'Name,Email,Phone,Status,Registration Date\n';
    const csvRows = this.filteredParticipants.map(p =>
      `"${p.userDisplayName || 'N/A'}","${p.userEmail}","${p.userPhone || 'N/A'}","${p.status}","${p.registrationDate}"`
    ).join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.event.title.replace(/\s+/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.successMessage = 'Participant list exported successfully';
    setTimeout(() => this.successMessage = '', 3000);
  }

  /**
   * Print participant list
   */
  printParticipantList(): void {
    window.print();
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
  getStatusClass(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'status-confirmed';
      case ReservationStatus.CANCELLED:
        return 'status-cancelled';
      case ReservationStatus.WAITLIST:
        return 'status-waitlist';
      default:
        return '';
    }
  }
}
