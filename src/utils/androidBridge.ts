// Android Bridge Utility for WebView Integration

// Define the shape of the interface we injected from Android
interface AndroidInterface {
    syncLeads: (token: string) => void;
    saveToken: (token: string) => void;
    getToken: () => string | null;
    getRecordingStatus: () => string;
    showNotification: (title: string, message: string) => void;
}

declare global {
    interface Window {
        AndroidBridge?: AndroidInterface;
    }
}

export const isAndroidWebView = (): boolean => {
    return typeof window !== 'undefined' && !!window.AndroidBridge;
};

/**
 * Triggers the Android App to fetch the latest leads and store them
 * securely in its local SQLite database.
 * Used for offline caller ID detection.
 */
export const triggerAndroidLeadSync = (token: string) => {
    if (isAndroidWebView() && window.AndroidBridge) {
        try {
            window.AndroidBridge.syncLeads(token);
            console.log("Triggered Android lead sync");
        } catch (e) {
            console.error("Failed to trigger Android lead sync", e);
        }
    }
};

/**
 * Gets the current recording status from the Android Service.
 */
export const getAndroidRecordingStatus = () => {
    if (isAndroidWebView() && window.AndroidBridge) {
        try {
            const statusString = window.AndroidBridge.getRecordingStatus();
            return JSON.parse(statusString);
        } catch (e) {
            console.error("Failed to parse Android recording status", e);
        }
    }
    return null;
};

/**
 * Saves the token to Android SharedPreferences for background persistence.
 */
export const saveAndroidToken = (token: string) => {
    if (isAndroidWebView() && window.AndroidBridge && window.AndroidBridge.saveToken) {
        try {
            window.AndroidBridge.saveToken(token);
        } catch (e) {
            console.error("Failed to save token to Android", e);
        }
    }
};

/**
 * Retrieves the token previously saved to Android SharedPreferences.
 */
export const getAndroidToken = (): string | null => {
    if (isAndroidWebView() && window.AndroidBridge && window.AndroidBridge.getToken) {
        try {
            return window.AndroidBridge.getToken();
        } catch (e) {
            console.error("Failed to get token from Android", e);
        }
    }
    return null;
};

/**
 * Triggers a native Android Push Notification from the CRM backend websocket.
 */
export const triggerAndroidNotification = (title: string, message: string) => {
    if (isAndroidWebView() && window.AndroidBridge && window.AndroidBridge.showNotification) {
        try {
            window.AndroidBridge.showNotification(title, message);
        } catch (e) {
            console.error("Failed to trigger Android notification", e);
        }
    }
};
