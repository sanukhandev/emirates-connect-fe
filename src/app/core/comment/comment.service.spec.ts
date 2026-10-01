import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CommentService } from './comment.service';

const comment = { id: 9, body: 'Hello', author: { type: 'user' as const, id: 1, name: 'User', display_name: 'User', headline: null, avatar_url: null }, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', replies_count: 0, replies: [] };

describe('CommentService', () => {
  let service: CommentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CommentService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CommentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists comments and forwards pagination', async () => {
    const request = firstValueFrom(service.getComments(4, 2));
    http.expectOne(`${environment.apiBaseUrl}/posts/4/comments?page=2`).flush({ data: [comment], links: { next: null }, meta: { current_page: 2, last_page: 2, per_page: 20, total: 1 } });
    await expect(request).resolves.toMatchObject({ data: [comment], meta: { current_page: 2 } });
  });

  it('uses user/business author payloads and mutation endpoints', async () => {
    const user = firstValueFrom(service.createComment(4, { author_type: 'user', body: 'User comment' }));
    http.expectOne(`${environment.apiBaseUrl}/posts/4/comments`).flush({ data: comment });
    await expect(user).resolves.toEqual(comment);

    const business = firstValueFrom(service.createReply(9, { author_type: 'business', business_id: 8, body: 'Business reply' }));
    const replyRequest = http.expectOne(`${environment.apiBaseUrl}/comments/9/replies`);
    expect(replyRequest.request.body).toEqual({ author_type: 'business', business_id: 8, body: 'Business reply' });
    replyRequest.flush({ data: comment });
    await expect(business).resolves.toEqual(comment);

    const update = firstValueFrom(service.updateComment(9, { body: 'Updated' }));
    http.expectOne({ url: `${environment.apiBaseUrl}/comments/9`, method: 'PATCH' }).flush({ data: comment });
    await expect(update).resolves.toEqual(comment);
    const remove = firstValueFrom(service.deleteComment(9));
    http.expectOne({ url: `${environment.apiBaseUrl}/comments/9`, method: 'DELETE' }).flush(null);
    await expect(remove).resolves.toBeUndefined();
  });
});
