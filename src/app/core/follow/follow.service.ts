import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Business } from '../business/business.models';
import { PublicUser } from '../profile/profile.models';
import { PaginatedFollowers, PaginatedFollowing } from './follow.models';

interface ResourceResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class FollowService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  followUser(userId: number): Observable<PublicUser> {
    return this.http.put<ResourceResponse<PublicUser>>(this.baseUrl + '/users/' + userId + '/follow', {}).pipe(map((response) => response.data));
  }

  unfollowUser(userId: number): Observable<void> {
    return this.http.delete<void>(this.baseUrl + '/users/' + userId + '/follow').pipe(map(() => undefined));
  }

  followBusiness(slug: string): Observable<Business> {
    return this.http.put<ResourceResponse<Business>>(this.baseUrl + '/businesses/' + encodeURIComponent(slug) + '/follow', {}).pipe(map((response) => response.data));
  }

  unfollowBusiness(slug: string): Observable<void> {
    return this.http.delete<void>(this.baseUrl + '/businesses/' + encodeURIComponent(slug) + '/follow').pipe(map(() => undefined));
  }

  getUserFollowers(userId: number, page = 1): Observable<PaginatedFollowers> {
    return this.http.get<PaginatedFollowers>(this.baseUrl + '/users/' + userId + '/followers?page=' + page);
  }

  getUserFollowing(userId: number, page = 1): Observable<PaginatedFollowing> {
    return this.http.get<PaginatedFollowing>(this.baseUrl + '/users/' + userId + '/following?page=' + page);
  }

  getBusinessFollowers(slug: string, page = 1): Observable<PaginatedFollowers> {
    return this.http.get<PaginatedFollowers>(this.baseUrl + '/businesses/' + encodeURIComponent(slug) + '/followers?page=' + page);
  }
}
