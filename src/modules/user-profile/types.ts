export interface UserProfile {
  displayName: string;
  nationality?: string;
  homeCountry?: string;
  phoneNumber?: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  displayName: '',
};
