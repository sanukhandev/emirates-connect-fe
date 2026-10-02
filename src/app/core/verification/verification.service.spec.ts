import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { VerificationService } from './verification.service';

describe('VerificationService', () => {
  let service: VerificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [VerificationService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(VerificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads user and business status endpoints', async () => {
    const user = firstValueFrom(service.getUserVerificationStatus());
    http.expectOne({ url: environment.apiBaseUrl + '/verification/user', method: 'GET' }).flush({ data: { status: 'pending', request: null } });
    await expect(user).resolves.toEqual({ status: 'pending', request: null });

    const business = firstValueFrom(service.getBusinessVerificationStatus('acme group'));
    http.expectOne({ url: environment.apiBaseUrl + '/verification/business/acme%20group', method: 'GET' }).flush({ data: { status: 'approved', request: null } });
    await expect(business).resolves.toEqual({ status: 'approved', request: null });
  });

  it('sends verification submissions as multipart form data', async () => {
    const file = new File(['document'], 'identity.pdf', { type: 'application/pdf' });
    const result = firstValueFrom(service.submitUserVerification({ legal_name: 'Legal Name', documents: [{ file, documentType: 'identity_document' }] }));
    const request = http.expectOne({ url: environment.apiBaseUrl + '/verification/user', method: 'POST' });
    expect(request.request.body).toBeInstanceOf(FormData);
    const form = request.request.body as FormData;
    expect(form.get('legal_name')).toBe('Legal Name');
    expect(form.get('document_types[]')).toBe('identity_document');
    expect((form.get('documents[]') as File).name).toBe('identity.pdf');
    request.flush({ id: 1, status: 'pending', data: null, submitted_at: null, reviewed_at: null, rejection_reason: null, documents: [] });
    await expect(result).resolves.toMatchObject({ id: 1, status: 'pending' });
  });
});
