// Android Bridge Utility for WebView Integration

// Define the shape of the interface we injected from Android
interface AndroidInterface {
    syncLeads: (token: string) => void;
    getRecordingStatus: () => string;
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
