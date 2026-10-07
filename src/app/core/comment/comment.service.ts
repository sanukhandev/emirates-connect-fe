import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Comment, CommentResponse, CreateCommentPayload, CreateReplyPayload, PaginatedCommentResponse, UpdateCommentPayload } from './comment.models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getComments(targetType: 'post' | 'reel', targetId: number, page = 1): Observable<PaginatedCommentResponse> {
    return this.http.get<PaginatedCommentResponse>(`${this.baseUrl}/${targetType}s/${targetId}/comments?page=${page}`);
  }

  createComment(targetType: 'post' | 'reel', targetId: number, payload: CreateCommentPayload): Observable<Comment> {
    return this.http.post<CommentResponse>(`${this.baseUrl}/${targetType}s/${targetId}/comments`, payload).pipe(map((response) => response.data));
  }

  createReply(commentId: number, payload: CreateReplyPayload): Observable<Comment> {
    return this.http.post<CommentResponse>(`${this.baseUrl}/comments/${commentId}/replies`, payload).pipe(map((response) => response.data));
  }

  updateComment(commentId: number, payload: UpdateCommentPayload): Observable<Comment> {
    return this.http.patch<CommentResponse>(`${this.baseUrl}/comments/${commentId}`, payload).pipe(map((response) => response.data));
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}`).pipe(map(() => undefined));
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Please sign in to comment.';
    if (status === 403) return 'You do not have permission to do that.';
    if (status === 404) return 'This post or comment is no longer available.';
    if (status === 422) return 'Please check the comment text.';
    return 'We could not complete that comment request. Please try again.';
  }
}
