import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { EventService } from '../../services/event.service';
import { ReservationService } from '../../services/reservation';
import { forkJoin, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService: AuthService = inject(AuthService);
  private reservationService: ReservationService = inject(ReservationService);
  private eventService: EventService = inject(EventService);

  upcomingEvents: any[] = [];
  pastEvents: any[] = [];

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.reservationService.getUserReservations(currentUser.uid, true).pipe(
        switchMap(reservations => {
          if (reservations.length === 0) {
            return of([]);
          }
          const eventObservables = reservations.map(reservation => 
            this.eventService.getEventById(reservation.eventId).pipe(
              map(event => ({...event, reservationId: reservation.id}))
            )
          );
          return forkJoin(eventObservables);
        })
      ).subscribe(events => {
        const now = new Date();
        this.upcomingEvents = events.filter(event => event.date !=undefined && event.date >= now);
        this.pastEvents = events.filter(event => event.date !=undefined && event.date < now);
      });
    }
  }

  cancelRegistration(reservationId: string): void {
    this.reservationService.cancelRegistration(reservationId).subscribe(() => {
      // Refresh the events list after cancellation
      this.ngOnInit();
    });
  }
}
