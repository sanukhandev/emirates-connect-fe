import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReportService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the canonical target and reason payload', () => {
    const payload = { target_type: 'comment' as const, target_id: 12, reason: 'other' as const, details: 'Specific concern' };
    service.createReport(payload).subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/reports`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
  });
});
