import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PostService } from './post.service';

const post = { id: 4, body: 'Hello', status: 'published' as const, published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', author: { type: 'user' as const, id: 1, name: 'User', display_name: 'User', headline: null, avatar_url: null }, media: [] };

describe('PostService', () => {
  let service: PostService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PostService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PostService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates JSON and multipart user/business posts without client author ids', async () => {
    const text = firstValueFrom(service.createPost({ author_type: 'user', body: 'Hello', status: 'published' }));
    const textRequest = http.expectOne(`${environment.apiBaseUrl}/posts`);
    expect(textRequest.request.body).toEqual({ author_type: 'user', body: 'Hello', status: 'published' });
    textRequest.flush({ data: post });
    await expect(text).resolves.toEqual(post);

    const image = firstValueFrom(service.createPost({ author_type: 'business', business_id: 8, body: null, status: 'draft' }, [new File(['image'], 'image.png', { type: 'image/png' })]));
    const imageRequest = http.expectOne(`${environment.apiBaseUrl}/posts`);
    expect(imageRequest.request.body).toBeInstanceOf(FormData);
    expect((imageRequest.request.body as FormData).get('author_type')).toBe('business');
    expect((imageRequest.request.body as FormData).get('business_id')).toBe('8');
    imageRequest.flush({ data: { ...post, status: 'draft' } });
    await expect(image).resolves.toMatchObject({ status: 'draft' });
  });

  it('uses post, media and listing endpoints', async () => {
    const read = firstValueFrom(service.getPost(4));
    http.expectOne(`${environment.apiBaseUrl}/posts/4`).flush({ data: post });
    await expect(read).resolves.toEqual(post);

    const media = firstValueFrom(service.addMedia(4, new File(['image'], 'image.webp', { type: 'image/webp' })));
    const mediaRequest = http.expectOne(`${environment.apiBaseUrl}/posts/4/media`);
    expect(mediaRequest.request.body).toBeInstanceOf(FormData);
    mediaRequest.flush({ data: post });
    await expect(media).resolves.toEqual(post);

    const mine = firstValueFrom(service.getMyPosts());
    http.expectOne(`${environment.apiBaseUrl}/me/posts?page=1`).flush({ data: [post], links: {}, meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 } });
    await expect(mine).resolves.toMatchObject({ data: [post] });
    expect(service.myPosts()).toEqual([post]);
  });
});
