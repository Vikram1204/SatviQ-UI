import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { db } from '../db/satviq-db';

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  id?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresAt: number; // timestamp ms
  refreshToken?: string;
}

const SETTINGS_USER_KEY = 'google_user_profile';
const SETTINGS_TOKENS_KEY = 'google_auth_tokens';

// Default Client ID placeholder (can be configured in app settings or environment)
export const DEFAULT_GOOGLE_CLIENT_ID = 'satviq-google-drive-client-id.apps.googleusercontent.com';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  userProfile = signal<GoogleUserProfile | null>(null);
  isLoggedIn = signal<boolean>(false);
  clientId = signal<string>(DEFAULT_GOOGLE_CLIENT_ID);
  isAuthenticating = signal<boolean>(false);

  constructor() {
    if (this.isBrowser) {
      this.loadStoredAuth();
    }
  }

  async loadStoredAuth() {
    try {
      const userRecord = await db.settings.get(SETTINGS_USER_KEY);
      const tokenRecord = await db.settings.get(SETTINGS_TOKENS_KEY);
      const clientIdRecord = await db.settings.get('google_client_id');

      if (clientIdRecord?.value) {
        this.clientId.set(clientIdRecord.value);
      }

      if (userRecord?.value && tokenRecord?.value) {
        const tokens: AuthTokens = tokenRecord.value;
        if (tokens.expiresAt > Date.now()) {
          this.userProfile.set(userRecord.value);
          this.isLoggedIn.set(true);
        } else {
          // Token expired, clear or attempt silent refresh
          this.userProfile.set(userRecord.value); // keep profile preview
          this.isLoggedIn.set(false);
        }
      }
    } catch (e) {
      console.error('Error loading stored auth:', e);
    }
  }

  async setClientId(id: string) {
    this.clientId.set(id);
    await db.settings.put({ key: 'google_client_id', value: id });
  }

  async saveAuth(profile: GoogleUserProfile, tokens: AuthTokens) {
    this.userProfile.set(profile);
    this.isLoggedIn.set(true);
    await db.settings.put({ key: SETTINGS_USER_KEY, value: profile });
    await db.settings.put({ key: SETTINGS_TOKENS_KEY, value: tokens });
  }

  async logout() {
    this.userProfile.set(null);
    this.isLoggedIn.set(false);
    await db.settings.delete(SETTINGS_USER_KEY);
    await db.settings.delete(SETTINGS_TOKENS_KEY);
  }

  async getAccessToken(): Promise<string | null> {
    const tokenRecord = await db.settings.get(SETTINGS_TOKENS_KEY);
    if (!tokenRecord?.value) return null;
    const tokens: AuthTokens = tokenRecord.value;
    if (tokens.expiresAt <= Date.now()) {
      this.isLoggedIn.set(false);
      return null;
    }
    return tokens.accessToken;
  }

  /**
   * Initiate Google OAuth 2.0 login popup / redirect
   */
  async loginWithGoogle(): Promise<boolean> {
    if (!this.isBrowser) return false;
    this.isAuthenticating.set(true);

    return new Promise((resolve) => {
      const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file');
      const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(this.clientId())}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=token` +
        `&scope=${scope}` +
        `&prompt=consent`;

      // Open OAuth popup window
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'GoogleSignIn',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0`
      );

      const checkPopupTimer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(checkPopupTimer);
          this.isAuthenticating.set(false);
          resolve(this.isLoggedIn());
          return;
        }

        try {
          if (popup.location.href.includes('access_token=')) {
            const hash = popup.location.hash || popup.location.href.split('#')[1] || '';
            const params = new URLSearchParams(hash.replace('#', ''));
            const accessToken = params.get('access_token');
            const expiresIn = parseInt(params.get('expires_in') || '3600', 10);

            if (accessToken) {
              popup.close();
              clearInterval(checkPopupTimer);

              const expiresAt = Date.now() + (expiresIn - 60) * 1000;
              const profile = await this.fetchUserProfile(accessToken);
              
              if (profile) {
                await this.saveAuth(profile, { accessToken, expiresAt });
                this.isAuthenticating.set(false);
                resolve(true);
              } else {
                this.isAuthenticating.set(false);
                resolve(false);
              }
            }
          }
        } catch (e) {
          // Cross-origin errors expected until redirect lands back on origin
        }
      }, 500);
    });
  }

  private async fetchUserProfile(accessToken: string): Promise<GoogleUserProfile | null> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        return {
          email: data.email,
          name: data.name || data.email,
          picture: data.picture,
          id: data.sub
        };
      }
    } catch (e) {
      console.error('Failed to fetch Google user profile:', e);
    }
    return null;
  }
}
