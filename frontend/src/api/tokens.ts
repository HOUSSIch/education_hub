const ACCESS_TOKEN_KEY = 'hub_educatif_access_token';
const REFRESH_TOKEN_KEY = 'hub_educatif_refresh_token';
const REMEMBER_KEY = 'hub_educatif_remember_me';

const storages = () => typeof window === 'undefined' ? [] : [window.localStorage, window.sessionStorage];
const storageWithToken = () => storages().find((item) => item.getItem(ACCESS_TOKEN_KEY) || item.getItem(REFRESH_TOKEN_KEY)) ?? null;

export function getAccessToken(): string | null { return storageWithToken()?.getItem(ACCESS_TOKEN_KEY) ?? null; }
export function getRefreshToken(): string | null { return storageWithToken()?.getItem(REFRESH_TOKEN_KEY) ?? null; }

export function setTokens(accessToken: string, refreshToken: string, remember = true): void {
  clearTokens();
  const target = remember ? window.localStorage : window.sessionStorage;
  target.setItem(ACCESS_TOKEN_KEY, accessToken);
  target.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (remember) window.localStorage.setItem(REMEMBER_KEY, 'true');
}

export function setAccessToken(accessToken: string): void { storageWithToken()?.setItem(ACCESS_TOKEN_KEY, accessToken); }
export function clearTokens(): void { storages().forEach((storage) => { storage.removeItem(ACCESS_TOKEN_KEY); storage.removeItem(REFRESH_TOKEN_KEY); storage.removeItem(REMEMBER_KEY); }); }
export function getRememberPreference(): boolean { return typeof window !== 'undefined' && window.localStorage.getItem(REMEMBER_KEY) === 'true'; }
