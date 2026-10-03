import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AdminService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps admin list filters and page parameters in the backend request', () => {
    service.verifications({ status: 'pending', subject_type: 'business', page: 2 }).subscribe();
    const request = http.expectOne((candidate) => candidate.url === `${environment.apiBaseUrl}/admin/verifications`);
    expect(request.request.params.get('status')).toBe('pending');
    expect(request.request.params.get('subject_type')).toBe('business');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ data: [], meta: { current_page: 2, last_page: 2, per_page: 20, total: 0 }, links: {} });
  });

  it('uses explicit admin action endpoints', () => {
    service.rejectVerification(7, 'Needs a clearer document.').subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/admin/verifications/7/reject`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ rejection_reason: 'Needs a clearer document.' });
    request.flush({ data: {} });
  });
});
