import { Component, OnInit, inject } from '@angular/core';
import { CalendarView, CalendarModule, CalendarEvent, CalendarDateFormatter } from 'angular-calendar';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';
import { EventDocument, TimeSlot } from '../models/event.model';
import { addMonths, subMonths } from 'date-fns';

const colors: any = {
  morning: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  afternoon: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-event-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule],
  templateUrl: './event-calendar.html',
  styleUrls: ['./event-calendar.css']
})
export class EventCalendarComponent implements OnInit {
  private eventService: EventService = inject(EventService);

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  activeDayIsOpen: boolean = false;

  ngOnInit(): void {
    this.eventService.getEvents().subscribe((events: EventDocument[]) => {
      this.events = events.map(event => ({
        start: event.date,
        title: event.title,
        color: event.timeSlot === TimeSlot.MORNING ? colors.morning : colors.afternoon
      }));
    });
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (events.length === 0) {
      this.activeDayIsOpen = false;
    } else {
      this.activeDayIsOpen = true;
      this.viewDate = date;
    }
  }

  goToPreviousMonth(): void {
    this.viewDate = subMonths(this.viewDate, 1);
  }

  goToToday(): void {
    this.viewDate = new Date();
  }

  goToNextMonth(): void {
    this.viewDate = addMonths(this.viewDate, 1);
  }
}
