import { computed, Injectable, signal } from '@angular/core';

import { User, UserProfile } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly userSignal = signal<User | null>(null);
  private readonly initializingSignal = signal(true);
  private stateVersion = 0;

  readonly currentUser = this.userSignal.asReadonly();
  readonly isInitializing = this.initializingSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  setUser(user: User | null): void {
    this.stateVersion += 1;
    this.userSignal.set(user);
  }

  version(): number {
    return this.stateVersion;
  }

  setInitializing(value: boolean): void {
    this.initializingSignal.set(value);
  }

  clear(): void {
    this.stateVersion += 1;
    this.userSignal.set(null);
  }

  updateProfile(profile: UserProfile): void {
    const user = this.userSignal();
    if (user) {
      this.userSignal.set({ ...user, profile });
    }
  }
}
