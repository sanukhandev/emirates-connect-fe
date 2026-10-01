import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ReactionService } from './reaction.service';

const summary = { total: 1, counts: { like: 1, celebrate: 0, support: 0, insightful: 0 }, current_user: 'like' as const };

describe('ReactionService', () => {
  let service: ReactionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReactionService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReactionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sets post and comment reactions with the shared payload', async () => {
    const post = firstValueFrom(service.setPostReaction(4, 'celebrate'));
    const postRequest = http.expectOne(`${environment.apiBaseUrl}/posts/4/reaction`);
    expect(postRequest.request.method).toBe('PUT');
    expect(postRequest.request.body).toEqual({ type: 'celebrate' });
    postRequest.flush({ data: { reactions: summary } });
    await expect(post).resolves.toEqual(summary);

    const comment = firstValueFrom(service.setCommentReaction(9, 'support'));
    const commentRequest = http.expectOne(`${environment.apiBaseUrl}/comments/9/reaction`);
    expect(commentRequest.request.method).toBe('PUT');
    commentRequest.flush({ data: { reactions: summary } });
    await expect(comment).resolves.toEqual(summary);
  });

  it('removes post and comment reactions', async () => {
    const post = firstValueFrom(service.removePostReaction(4));
    http.expectOne({ url: `${environment.apiBaseUrl}/posts/4/reaction`, method: 'DELETE' }).flush(null);
    await expect(post).resolves.toBeUndefined();

    const comment = firstValueFrom(service.removeCommentReaction(9));
    http.expectOne({ url: `${environment.apiBaseUrl}/comments/9/reaction`, method: 'DELETE' }).flush(null);
    await expect(comment).resolves.toBeUndefined();
  });
});
