import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BusinessService } from '../../core/business/business.service';
import { VerificationService } from '../../core/verification/verification.service';
import { VerificationPageComponent } from './verification-page.component';

describe('VerificationPageComponent', () => {
  const verification = {
    getUserVerificationStatus: vi.fn(),
    getBusinessVerificationStatus: vi.fn(),
    submitUserVerification: vi.fn(),
    submitBusinessVerification: vi.fn(),
  };

  beforeEach(() => {
    verification.getUserVerificationStatus.mockReset();
    verification.getBusinessVerificationStatus.mockReset();
    verification.submitUserVerification.mockReset();
    verification.submitBusinessVerification.mockReset();
    TestBed.configureTestingModule({
      imports: [VerificationPageComponent],
      providers: [
        provideRouter([]),
        { provide: VerificationService, useValue: verification },
        { provide: BusinessService, useValue: { getBusiness: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {}, paramMap: { get: () => null } } } },
      ],
    });
  });

  it('renders the not-submitted state and start action', () => {
    verification.getUserVerificationStatus.mockReturnValue(of({ status: 'not_submitted', request: null }));
    const fixture = TestBed.createComponent(VerificationPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.status()).toBe('not_submitted');
    expect(fixture.nativeElement.textContent).toContain('Start verification');
  });

  it('shows private rejection feedback and resubmission action', () => {
    verification.getUserVerificationStatus.mockReturnValue(of({ status: 'rejected', request: { id: 1, status: 'rejected', data: null, submitted_at: null, reviewed_at: null, rejection_reason: 'Use a clearer document.', documents: [] } }));
    const fixture = TestBed.createComponent(VerificationPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Use a clearer document.');
    expect(fixture.nativeElement.textContent).toContain('Submit again');
  });

  it('blocks unsupported files before submission', () => {
    verification.getUserVerificationStatus.mockReturnValue(of({ status: 'not_submitted', request: null }));
    const fixture = TestBed.createComponent(VerificationPageComponent);
    fixture.detectChanges();
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })] });

    fixture.componentInstance.addFiles({ target: input } as unknown as Event);

    expect(fixture.componentInstance.files()).toHaveLength(0);
    expect(fixture.componentInstance.fileError()).toContain('not a supported document type');
  });
});
