import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SearchService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends typed unified filters to the backend', async () => {
    const request = firstValueFrom(service.search({ q: 'software', type: 'all', industry: 'technology', emirate: 'dubai', verified: true, page: 2 }));
    const expected = http.expectOne((item) => item.url === `${environment.apiBaseUrl}/search`);
    expect(expected.request.params.get('q')).toBe('software');
    expect(expected.request.params.get('industry')).toBe('technology');
    expect(expected.request.params.get('emirate')).toBe('dubai');
    expect(expected.request.params.get('verified')).toBe('true');
    expect(expected.request.params.get('page')).toBe('2');
    expect(expected.request.params.get('type')).toBeNull();
    expected.flush({ data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: 2, last_page: 2, per_page: 20, total: 0 } });
    await expect(request).resolves.toMatchObject({ meta: { current_page: 2 } });
  });

  it('uses dedicated user and business endpoints', () => {
    service.searchUsers({ type: 'all', page: 1 }).subscribe();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/search/users`).flush({ data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } });
    service.searchBusinesses({ type: 'all', page: 1 }).subscribe();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/search/businesses`).flush({ data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } });
  });
});
