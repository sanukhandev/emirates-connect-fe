import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DiscoveryEvent } from '../discovery/discovery.service';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  readonly upcoming = signal<DiscoveryEvent[]>([]);
  load(): Observable<DiscoveryEvent[]> { return this.http.get<{ data: DiscoveryEvent[] }>(`${environment.apiBaseUrl}/events`).pipe(map((r) => r.data), tap((events) => this.upcoming.set(events))); }
  rsvp(event: DiscoveryEvent): Observable<DiscoveryEvent> { return this.http.post<{ data: DiscoveryEvent }>(`${environment.apiBaseUrl}/events/${event.id}/rsvp`, {}).pipe(map((r) => r.data), tap((updated) => this.replace(updated))); }
  cancel(event: DiscoveryEvent): Observable<DiscoveryEvent> { return this.http.delete<{ data: DiscoveryEvent }>(`${environment.apiBaseUrl}/events/${event.id}/rsvp`).pipe(map((r) => r.data), tap((updated) => this.replace(updated))); }
  private replace(updated: DiscoveryEvent): void { this.upcoming.update((items) => items.map((item) => item.id === updated.id ? updated : item)); }
}
