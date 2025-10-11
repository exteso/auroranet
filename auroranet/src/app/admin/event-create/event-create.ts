import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth';
import { TimeSlot, isEventDateValid, getValidEventDateRange } from '../../models/event.model';

@Component({
  selector: 'app-event-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-create.html',
  styleUrl: './event-create.css'
})
export class EventCreate implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private router = inject(Router);

  eventForm!: FormGroup;
  TimeSlot = TimeSlot;
  successMessage: string = '';
  errorMessage: string = '';
  isSubmitting: boolean = false;
  minDate: string = '';
  maxDate: string = '';

  ngOnInit(): void {
    // Get valid date range for date picker constraints
    const dateRange = getValidEventDateRange();
    this.minDate = this.formatDateForInput(dateRange.min);
    this.maxDate = this.formatDateForInput(dateRange.max);

    // Initialize form with validators
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      date: ['', [Validators.required, this.dateRangeValidator.bind(this)]],
      timeSlot: [TimeSlot.MORNING, Validators.required],
      capacity: [20, [Validators.required, Validators.min(1), Validators.max(100)]],
      location: ['']
    });
  }

  /**
   * Custom validator to check if date is within 2-month window
   */
  dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    if (!isEventDateValid(selectedDate)) {
      return { dateOutOfRange: true };
    }

    return null;
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
   * Handle form submission
   */
  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'You must be logged in to create events.';
      this.isSubmitting = false;
      return;
    }

    const formValue = this.eventForm.value;
    const eventData = {
      title: formValue.title,
      description: formValue.description,
      date: new Date(formValue.date),
      timeSlot: formValue.timeSlot,
      capacity: formValue.capacity,
      location: formValue.location
    };

    this.eventService.createEvent(eventData, currentUser.uid).subscribe({
      next: (eventId) => {
        this.successMessage = `Event created successfully! Event ID: ${eventId}`;
        this.eventForm.reset({
          timeSlot: TimeSlot.MORNING,
          capacity: 20
        });
        this.isSubmitting = false;

        // Redirect to event management page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/admin/events']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error creating event:', error);
        this.errorMessage = 'Failed to create event. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Reset form and messages
   */
  onReset(): void {
    this.eventForm.reset({
      timeSlot: TimeSlot.MORNING,
      capacity: 20
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Navigate back to event management
   */
  onCancel(): void {
    this.router.navigate(['/admin/events']);
  }

  /**
   * Get form control for template error handling
   */
  get title() { return this.eventForm.get('title'); }
  get date() { return this.eventForm.get('date'); }
  get capacity() { return this.eventForm.get('capacity'); }
}
