import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '@shared/contracts/AuthRepository';
import type { UserProfileRepository } from '@shared/contracts/UserProfileRepository';
import type { UserProfile } from './types';
import { DEFAULT_USER_PROFILE } from './types';

interface UserProfileState {
  profile: UserProfile;
  isLoading: boolean;
  isSaving: boolean;
  saveProfile(profile: UserProfile): Promise<void>;
}

export function useUserProfile(
  repository: UserProfileRepository,
  user: AuthUser | null,
): UserProfileState {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    repository.load(user?.uid ?? null)
      .then((loaded) => {
        if (cancelled) return;
        setProfile({
          ...DEFAULT_USER_PROFILE,
          ...loaded,
          displayName: loaded.displayName || user?.displayName || '',
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [repository, user?.uid, user?.displayName]);

  const saveProfile = useCallback(async (next: UserProfile) => {
    setIsSaving(true);
    setProfile(next);
    try {
      await repository.save(user?.uid ?? null, next);
    } finally {
      setIsSaving(false);
    }
  }, [repository, user?.uid]);

  return { profile, isLoading, isSaving, saveProfile };
}
