import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { PostService } from '../../core/post/post.service';
import { UserProfile } from '../../core/auth/auth.models';
import { ProfileComponent } from './profile.component';

const mockProfile: UserProfile = {
  display_name: 'Sanu Khan',
  headline: 'Product Engineer',
  job_title: 'Lead Architect',
  company_name: 'Gulf Tech',
  industry: 'technology',
  emirate: 'dubai',
  bio: 'Building UAE digital ecosystem',
  website_url: 'https://example.ae',
  linkedin_url: 'https://linkedin.com/in/sanukhan',
  avatar_url: 'https://example.ae/avatar.jpg',
  cover_image_url: 'https://example.ae/cover.jpg',
  is_verified: true,
  onboarding_completed: true,
};

describe('ProfileComponent', () => {
  it('populates form with profile data on load', () => {
    const fixture = createFixture(true);
    fixture.detectChanges();

    const form = fixture.componentInstance.form;
    expect(form.value.display_name).toBe('Sanu Khan');
    expect(form.value.headline).toBe('Product Engineer');
    expect(form.value.job_title).toBe('Lead Architect');
    expect(form.value.company_name).toBe('Gulf Tech');
  });

  it('marks all touched and aborts save when form is invalid', () => {
    const updateProfile = vi.fn();
    const fixture = createFixture(true, { updateProfile });
    fixture.detectChanges();

    fixture.componentInstance.form.controls.display_name.setValue('');
    fixture.componentInstance.save();

    expect(updateProfile).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.display_name.touched).toBe(true);
  });

  it('saves profile payload when valid and updates status message', () => {
    const updateProfile = vi.fn().mockReturnValue(of(mockProfile));
    const fixture = createFixture(true, { updateProfile });
    fixture.detectChanges();

    fixture.componentInstance.save();

    expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      display_name: 'Sanu Khan',
      headline: 'Product Engineer',
    }));
    expect(fixture.componentInstance.message()).toBe('Profile saved.');
  });
});

function createFixture(
  editMode = true,
  profileOverrides: Partial<Record<string, unknown>> = {},
) {
  const profileServiceMock = {
    profile: signal(mockProfile),
    industries: signal([{ value: 'technology', label: 'Technology' }]),
    emirates: signal([{ value: 'dubai', label: 'Dubai' }]),
    isLoading: signal(false),
    isSaving: signal(false),
    isUploadingAvatar: signal(false),
    isUploadingCover: signal(false),
    getCurrentProfile: vi.fn().mockReturnValue(of(mockProfile)),
    getIndustries: vi.fn().mockReturnValue(of([])),
    getEmirates: vi.fn().mockReturnValue(of([])),
    updateProfile: vi.fn().mockReturnValue(of(mockProfile)),
    errorMessage: vi.fn().mockReturnValue('Error occurred'),
    ...profileOverrides,
  };

  const authServiceMock = {
    currentUser: signal({ name: 'Sanu Khan', email: 'sanu@example.com' }),
    logout: vi.fn().mockReturnValue(of(null)),
  };

  const postServiceMock = {
    myPosts: signal([]),
    getMyPosts: vi.fn().mockReturnValue(of([])),
  };

  TestBed.configureTestingModule({
    imports: [ProfileComponent],
    providers: [
      { provide: ProfileService, useValue: profileServiceMock },
      { provide: AuthService, useValue: authServiceMock },
      { provide: PostService, useValue: postServiceMock },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { edit: editMode } } },
      },
      provideRouter([]),
    ],
  });

  return TestBed.createComponent(ProfileComponent);
}
