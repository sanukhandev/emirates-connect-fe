import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ReactionResponse, ReactionSummary, ReactionType } from './reaction.models';

@Injectable({ providedIn: 'root' })
export class ReactionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  setPostReaction(postId: number, type: ReactionType): Observable<ReactionSummary> {
    return this.http.put<ReactionResponse>(`${this.baseUrl}/posts/${postId}/reaction`, { type }).pipe(map((response) => response.data.reactions));
  }

  removePostReaction(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}/reaction`).pipe(map(() => undefined));
  }

  setReelReaction(reelId: number, type: ReactionType): Observable<ReactionSummary> {
    return this.http.put<ReactionResponse>(`${this.baseUrl}/reels/${reelId}/reaction`, { type }).pipe(map((response) => response.data.reactions));
  }

  removeReelReaction(reelId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reels/${reelId}/reaction`).pipe(map(() => undefined));
  }

  setCommentReaction(commentId: number, type: ReactionType): Observable<ReactionSummary> {
    return this.http.put<ReactionResponse>(`${this.baseUrl}/comments/${commentId}/reaction`, { type }).pipe(map((response) => response.data.reactions));
  }

  removeCommentReaction(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}/reaction`).pipe(map(() => undefined));
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Please sign in to react.';
    if (status === 403) return 'You do not have permission to react.';
    if (status === 404) return 'This content is no longer available.';
    return 'Couldn’t update reaction. Try again.';
  }
}
