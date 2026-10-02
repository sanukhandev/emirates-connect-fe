import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SearchFilters, SearchResponse } from './search.models';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/search`;

  search(filters: SearchFilters): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(this.endpoint, { params: this.params(filters) });
  }

  searchUsers(filters: SearchFilters): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.endpoint}/users`, { params: this.params({ ...filters, type: 'users' }) });
  }

  searchBusinesses(filters: SearchFilters): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.endpoint}/businesses`, { params: this.params({ ...filters, type: 'businesses' }) });
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 422) return 'Please check the selected search filters.';
    if (status === 429) return 'Too many searches. Please try again shortly.';
    return 'Unable to load search results.';
  }

  private params(filters: SearchFilters): HttpParams {
    let params = new HttpParams().set('page', filters.page).set('per_page', 20);
    if (filters.q) params = params.set('q', filters.q);
    if (filters.type !== 'all') params = params.set('type', filters.type);
    if (filters.industry) params = params.set('industry', filters.industry);
    if (filters.emirate) params = params.set('emirate', filters.emirate);
    if (filters.verified !== undefined) params = params.set('verified', filters.verified);
    return params;
  }
}
