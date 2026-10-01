import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreatePostPayload, PaginatedPostResponse, Post, PostResponse, UpdatePostPayload } from './post.models';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/posts`;

  readonly currentPost = signal<Post | null>(null);
  readonly myPosts = signal<Post[]>([]);
  readonly userPosts = signal<Post[]>([]);
  readonly businessPosts = signal<Post[]>([]);
  readonly myPostsMeta = signal<PaginatedPostResponse['meta'] | null>(null);
  readonly userPostsMeta = signal<PaginatedPostResponse['meta'] | null>(null);
  readonly businessPostsMeta = signal<PaginatedPostResponse['meta'] | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  createPost(payload: CreatePostPayload, files: File[] = []): Observable<Post> {
    this.isSaving.set(true);
    const request = files.length ? this.multipart(payload, files) : this.http.post<PostResponse>(this.baseUrl, payload);
    return request.pipe(map((response) => response.data), tap({ next: (post) => this.currentPost.set(post), finalize: () => this.isSaving.set(false) }));
  }

  getPost(id: number): Observable<Post> {
    this.isLoading.set(true);
    return this.http.get<PostResponse>(`${this.baseUrl}/${id}`).pipe(map((response) => response.data), tap({ next: (post) => this.currentPost.set(post), finalize: () => this.isLoading.set(false) }));
  }

  updatePost(id: number, payload: UpdatePostPayload): Observable<Post> {
    this.isSaving.set(true);
    return this.http.patch<PostResponse>(`${this.baseUrl}/${id}`, payload).pipe(map((response) => response.data), tap({ next: (post) => this.currentPost.set(post), finalize: () => this.isSaving.set(false) }));
  }

  deletePost(id: number): Observable<void> {
    this.isSaving.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(map(() => undefined), tap({ finalize: () => this.isSaving.set(false) }));
  }

  addMedia(id: number, file: File): Observable<Post> {
    const form = new FormData();
    form.append('media', file);
    this.isSaving.set(true);
    return this.http.post<PostResponse>(`${this.baseUrl}/${id}/media`, form).pipe(map((response) => response.data), tap({ next: (post) => this.currentPost.set(post), finalize: () => this.isSaving.set(false) }));
  }

  deleteMedia(postId: number, mediaId: number): Observable<Post> {
    this.isSaving.set(true);
    return this.http.delete<PostResponse>(`${this.baseUrl}/${postId}/media/${mediaId}`).pipe(map((response) => response.data), tap({ next: (post) => this.currentPost.set(post), finalize: () => this.isSaving.set(false) }));
  }

  getMyPosts(page = 1): Observable<PaginatedPostResponse> { return this.loadPage(`${environment.apiBaseUrl}/me/posts?page=${page}`, this.myPosts, this.myPostsMeta); }
  getUserPosts(id: number, page = 1): Observable<PaginatedPostResponse> { return this.loadPage(`${environment.apiBaseUrl}/users/${id}/posts?page=${page}`, this.userPosts, this.userPostsMeta); }
  getBusinessPosts(slug: string, page = 1): Observable<PaginatedPostResponse> { return this.loadPage(`${environment.apiBaseUrl}/businesses/${encodeURIComponent(slug)}/posts?page=${page}`, this.businessPosts, this.businessPostsMeta); }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Please sign in to continue.';
    if (status === 403) return 'You do not have permission to manage this post.';
    if (status === 404) return 'Post not found.';
    if (status === 422) return 'Please check the post details and attachments.';
    return 'We could not complete that post request. Please try again.';
  }

  validationErrors(error: unknown): Record<string, string[]> { return (error as { error?: { errors?: Record<string, string[]> } }).error?.errors ?? {}; }

  private multipart(payload: CreatePostPayload, files: File[]): Observable<PostResponse> {
    const form = new FormData();
    form.append('author_type', payload.author_type);
    if (payload.business_id !== undefined) form.append('business_id', String(payload.business_id));
    if (payload.body) form.append('body', payload.body);
    form.append('status', payload.status);
    files.forEach((file) => form.append('media[]', file));
    return this.http.post<PostResponse>(this.baseUrl, form);
  }

  private loadPage(url: string, target: ReturnType<typeof signal<Post[]>>, metaTarget: ReturnType<typeof signal<PaginatedPostResponse['meta'] | null>>): Observable<PaginatedPostResponse> {
    this.isLoading.set(true);
    target.set([]);
    metaTarget.set(null);
    return this.http.get<PaginatedPostResponse>(url).pipe(tap((response) => { target.set(response.data); metaTarget.set(response.meta); }), tap({ finalize: () => this.isLoading.set(false) }));
  }
}
