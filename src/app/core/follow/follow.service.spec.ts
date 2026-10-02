import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FollowService } from './follow.service';

const user = { id: 2, name: 'Target', profile: {} as never, followers_count: 1, following_count: 0, is_following: true };
const business = { id: 3, name: 'Business', slug: 'business', status: 'active' as const, current_user_role: null, followers_count: 1, is_following: true } as never;

describe('FollowService', () => {
  let service: FollowService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FollowService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FollowService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses user and business follow endpoints', async () => {
    const followUser = firstValueFrom(service.followUser(2));
    http.expectOne({ url: environment.apiBaseUrl + '/users/2/follow', method: 'PUT' }).flush({ data: user });
    await expect(followUser).resolves.toEqual(user);

    const unfollowUser = firstValueFrom(service.unfollowUser(2));
    http.expectOne({ url: environment.apiBaseUrl + '/users/2/follow', method: 'DELETE' }).flush(null);
    await expect(unfollowUser).resolves.toBeUndefined();

    const followBusiness = firstValueFrom(service.followBusiness('my-business'));
    http.expectOne({ url: environment.apiBaseUrl + '/businesses/my-business/follow', method: 'PUT' }).flush({ data: business });
    await expect(followBusiness).resolves.toEqual(business);

    const unfollowBusiness = firstValueFrom(service.unfollowBusiness('my-business'));
    http.expectOne({ url: environment.apiBaseUrl + '/businesses/my-business/follow', method: 'DELETE' }).flush(null);
    await expect(unfollowBusiness).resolves.toBeUndefined();
  });

  it('loads all network list types with page parameters', async () => {
    const followers = firstValueFrom(service.getUserFollowers(5, 2));
    http.expectOne(environment.apiBaseUrl + '/users/5/followers?page=2').flush({ data: [], links: {}, meta: { current_page: 2, last_page: 2, per_page: 20, total: 0 } });
    await expect(followers).resolves.toMatchObject({ data: [] });

    const following = firstValueFrom(service.getUserFollowing(5));
    http.expectOne(environment.apiBaseUrl + '/users/5/following?page=1').flush({ data: [], links: {}, meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } });
    await expect(following).resolves.toMatchObject({ data: [] });

    const businessFollowers = firstValueFrom(service.getBusinessFollowers('my-business'));
    http.expectOne(environment.apiBaseUrl + '/businesses/my-business/followers?page=1').flush({ data: [], links: {}, meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } });
    await expect(businessFollowers).resolves.toMatchObject({ data: [] });
  });
});
