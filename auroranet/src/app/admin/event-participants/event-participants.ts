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
import {
  ReservationDocument,
  ReservationStatus,
  PaymentStatus,
  PaymentMethod,
  isCheckedIn,
  isPaid,
  getPaymentStatusLabel,
  getPaymentMethodLabel
} from '../../models/reservation.model';
import { UserDocument } from '../../models/user.model';
import { Auth } from '@angular/fire/auth';

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
  private auth = inject(Auth);
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
  filterStatus: ReservationStatus | 'ALL' = ReservationStatus.CONFIRMED;
  filterCheckIn: 'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN' = 'ALL';
  filterPayment: PaymentStatus | 'ALL' = 'ALL';

  // Check-in
  selectedParticipants: Set<string> = new Set();
  isCheckingIn = false;
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;

  // Payment modal
  showPaymentModal = false;
  participantForPayment: ParticipantWithUser | null = null;
  paymentAmount: number = 0;
  paymentMethod: PaymentMethod = PaymentMethod.CASH;
  paymentTransactionId = '';
  paymentNotes = '';
  isProcessingPayment = false;

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

    // Filter by check-in status
    if (this.filterCheckIn === 'CHECKED_IN') {
      filtered = filtered.filter(p => isCheckedIn(p));
    } else if (this.filterCheckIn === 'NOT_CHECKED_IN') {
      filtered = filtered.filter(p => !isCheckedIn(p));
    }

    // Filter by payment status
    if (this.filterPayment !== 'ALL') {
      filtered = filtered.filter(p => p.paymentStatus === this.filterPayment);
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

  /**
   * Toggle participant selection for bulk check-in
   */
  toggleParticipantSelection(participantId: string): void {
    if (this.selectedParticipants.has(participantId)) {
      this.selectedParticipants.delete(participantId);
    } else {
      this.selectedParticipants.add(participantId);
    }
  }

  /**
   * Toggle all participants selection
   */
  toggleAllSelection(): void {
    if (this.selectedParticipants.size === this.filteredParticipants.length) {
      this.selectedParticipants.clear();
    } else {
      this.filteredParticipants.forEach(p => this.selectedParticipants.add(p.id));
    }
  }

  /**
   * Check if participant is selected
   */
  isSelected(participantId: string): boolean {
    return this.selectedParticipants.has(participantId);
  }

  /**
   * Check if all participants are selected
   */
  areAllSelected(): boolean {
    return this.filteredParticipants.length > 0 &&
           this.selectedParticipants.size === this.filteredParticipants.length;
  }

  /**
   * Check in a single participant
   */
  checkInParticipant(participant: ParticipantWithUser): void {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    this.isCheckingIn = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.checkInParticipant(
      participant.id,
      currentUser.uid,
      currentUser.displayName || "UNK"
    ).subscribe({
      next: () => {
        this.successMessage = `${participant.userDisplayName || participant.userEmail} checked in successfully`;
        this.isCheckingIn = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error checking in participant:', error);
        this.errorMessage = 'Failed to check in participant';
        this.isCheckingIn = false;
      }
    });
  }

  /**
   * Undo check-in for a participant
   */
  undoCheckIn(participant: ParticipantWithUser): void {
    this.isCheckingIn = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.undoCheckIn(participant.id).subscribe({
      next: () => {
        this.successMessage = `Check-in undone for ${participant.userDisplayName || participant.userEmail}`;
        this.isCheckingIn = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error undoing check-in:', error);
        this.errorMessage = 'Failed to undo check-in';
        this.isCheckingIn = false;
      }
    });
  }

  /**
   * Bulk check-in selected participants
   */
  bulkCheckIn(): void {
    if (this.selectedParticipants.size === 0) return;

    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    this.isCheckingIn = true;
    this.errorMessage = '';
    this.successMessage = '';

    const selectedIds = Array.from(this.selectedParticipants);

    this.reservationService.bulkCheckIn(
      selectedIds,
      currentUser.uid,
      currentUser.displayName || undefined
    ).subscribe({
      next: () => {
        this.successMessage = `Successfully checked in ${selectedIds.length} participant(s)`;
        this.selectedParticipants.clear();
        this.isCheckingIn = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error bulk checking in:', error);
        this.errorMessage = 'Failed to check in participants';
        this.isCheckingIn = false;
      }
    });
  }

  /**
   * Open payment modal
   */
  openPaymentModal(participant: ParticipantWithUser): void {
    this.participantForPayment = participant;
    this.paymentAmount = 0;
    this.paymentMethod = PaymentMethod.CASH;
    this.paymentTransactionId = '';
    this.paymentNotes = '';
    this.showPaymentModal = true;
  }

  /**
   * Close payment modal
   */
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.participantForPayment = null;
  }

  /**
   * Record payment
   */
  recordPayment(): void {
    if (!this.participantForPayment || this.paymentAmount <= 0) return;

    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    this.isProcessingPayment = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.recordPayment(
      this.participantForPayment.id,
      this.paymentAmount,
      this.paymentMethod,
      currentUser.uid,
      currentUser.displayName || undefined,
      this.paymentTransactionId || undefined,
      this.paymentNotes || undefined
    ).subscribe({
      next: () => {
        this.successMessage = `Payment recorded for ${this.participantForPayment?.userDisplayName || this.participantForPayment?.userEmail}`;
        this.closePaymentModal();
        this.isProcessingPayment = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error recording payment:', error);
        this.errorMessage = 'Failed to record payment';
        this.isProcessingPayment = false;
      }
    });
  }

  /**
   * Update payment status
   */
  updatePaymentStatus(participant: ParticipantWithUser, status: PaymentStatus): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.updatePaymentStatus(participant.id, status).subscribe({
      next: () => {
        this.successMessage = `Payment status updated to ${getPaymentStatusLabel(status)}`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
        this.errorMessage = 'Failed to update payment status';
      }
    });
  }

  /**
   * Get check-in and payment statistics
   */
  getStatistics() {
    const confirmedParticipants = this.participants.filter(p => p.status === ReservationStatus.CONFIRMED);
    const checkedInCount = confirmedParticipants.filter(p => isCheckedIn(p)).length;
    const paidCount = confirmedParticipants.filter(p => isPaid(p)).length;
    const unpaidCount = confirmedParticipants.filter(p => p.paymentStatus === PaymentStatus.UNPAID).length;
    const pendingCount = confirmedParticipants.filter(p => p.paymentStatus === PaymentStatus.PENDING).length;
    const totalRevenue = confirmedParticipants
      .filter(p => p.payment)
      .reduce((sum, p) => sum + (p.payment?.amount || 0), 0);

    return {
      totalConfirmed: confirmedParticipants.length,
      checkedInCount,
      notCheckedInCount: confirmedParticipants.length - checkedInCount,
      paidCount,
      unpaidCount,
      pendingCount,
      totalRevenue
    };
  }

  /**
   * Check if participant is checked in (helper for template)
   */
  isParticipantCheckedIn(participant: ParticipantWithUser): boolean {
    return isCheckedIn(participant);
  }

  /**
   * Check if participant has paid (helper for template)
   */
  isParticipantPaid(participant: ParticipantWithUser): boolean {
    return isPaid(participant);
  }

  /**
   * Get payment status label (helper for template)
   */
  getPaymentLabel(status: PaymentStatus): string {
    return getPaymentStatusLabel(status);
  }

  /**
   * Get payment method label (helper for template)
   */
  getMethodLabel(method: PaymentMethod): string {
    return getPaymentMethodLabel(method);
  }

  /**
   * Get payment status badge class
   */
  getPaymentStatusClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID:
        return 'payment-paid';
      case PaymentStatus.UNPAID:
        return 'payment-unpaid';
      case PaymentStatus.PENDING:
        return 'payment-pending';
      case PaymentStatus.REFUNDED:
        return 'payment-refunded';
      default:
        return '';
    }
  }
}
