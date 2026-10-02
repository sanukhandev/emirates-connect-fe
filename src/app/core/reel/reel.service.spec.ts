import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ReelService } from './reel.service';

const page = (next_cursor: string | null) => ({ data: [], links: { first: null, last: null, prev: null, next: null }, meta: { per_page: 20, next_cursor, prev_cursor: null } });

describe('ReelService', () => {
  let service: ReelService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReelService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReelService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('passes the backend cursor opaquely for feed and listings', () => {
    service.getFeed('opaque/cursor?value=1').subscribe();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/reels` && request.params.get('cursor') === 'opaque/cursor?value=1').flush(page('next'));

    service.getUserReels(12, 'user-cursor').subscribe();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/users/12/reels` && request.params.get('cursor') === 'user-cursor').flush(page(null));
  });

  it('uses the two-step create and upload contract', () => {
    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
    service.createReel({ author_type: 'business', business_id: 7, caption: 'Hello' }).subscribe((reel) => service.uploadVideo(reel.id, file).subscribe());
    http.expectOne(`${environment.apiBaseUrl}/reels`).flush({ data: { id: 4 } });
    const upload = http.expectOne(`${environment.apiBaseUrl}/reels/4/video`);
    expect(upload.request.body.get('video')).toBe(file);
    upload.flush({ data: { id: 4 } });
  });

  it('keeps mutation methods typed to their backend resources', () => {
    service.updateReel(4, null).subscribe();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/reels/4` && request.method === 'PATCH').flush({ data: { id: 4 } });
    service.deleteReel(4).subscribe();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/reels/4` && request.method === 'DELETE').flush(null, { status: 204, statusText: 'No Content' });
  });
});
