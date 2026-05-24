import type { UserProfile } from '@modules/user-profile/types';

export interface UserProfileRepository {
  load(userId: string | null): Promise<UserProfile>;
  save(userId: string | null, profile: UserProfile): Promise<void>;
}
