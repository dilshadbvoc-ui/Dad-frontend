import { api } from './api';
import { API_URL } from '@/config';

export type AppReleasePlatform = 'mobile' | 'helper';

export interface AppRelease {
    versionName: string;
    versionCode: number;
    releaseNotes: string;
    apkFileName: string;
    releasedAt: string;
}

// GET /api/app-releases/latest?platform=mobile|helper — unauthenticated,
// backed by Dad-backend/src/controllers/appReleaseController.ts. Returns
// null (not a throw) when no release has been published yet for that
// platform, so the download page can show a friendly "coming soon" state.
export const getLatestRelease = async (platform: AppReleasePlatform): Promise<AppRelease | null> => {
    try {
        const { data } = await api.get<AppRelease>('/app-releases/latest', { params: { platform } });
        return data;
    } catch {
        return null;
    }
};

// Stable download URL — always resolves to whichever .apk the manifest
// currently names, via a 302 redirect server-side, so this link never
// needs to change across releases.
export const getDownloadUrl = (platform: AppReleasePlatform): string =>
    `${API_URL}/api/app-releases/download/${platform}`;
