interface MobileCallData {
    phoneNumber: string;
    duration: number;
    timestamp: number;
    status: string;
    [key: string]: string | number | undefined;
}

declare global {
    interface Window {
        MobileBridge?: {
            initiateCall: (phoneNumber: string) => void;
            syncToken?: (token: string) => void;
            onCallCompleted?: (data: MobileCallData) => void;
        };
    }
}

export const isMobileApp = () => {
    return typeof window !== 'undefined' && !!window.MobileBridge;
};

export const initiateCall = (phoneNumber: string) => {
    if (isMobileApp() && window.MobileBridge) {
        window.MobileBridge.initiateCall(phoneNumber);
        return true;
    }
    return false;
};

export const syncToken = (token: string) => {
    if (isMobileApp() && window.MobileBridge?.syncToken) {
        window.MobileBridge.syncToken(token);
    }
};

// Initialize MobileBridge object if detecting mobile environment
if (typeof window !== 'undefined') {
    window.MobileBridge = window.MobileBridge || {
        initiateCall: (phoneNumber: string) => console.log('Mock initiate call:', phoneNumber)
    };

    // Define the native callback handler that dispatches a DOM event
    window.MobileBridge.onCallCompleted = (data: MobileCallData) => {
        console.log('Mobile Bridge: Call Completed', data);
        const event = new CustomEvent('mobile_call_completed', { detail: data });
        window.dispatchEvent(event);
    };
}

export const onCallCompleted = (callback: (data: MobileCallData) => void) => {
    if (typeof window !== 'undefined') {
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent;
            callback(customEvent.detail);
        };
        window.addEventListener('mobile_call_completed', handler);
        return () => window.removeEventListener('mobile_call_completed', handler);
    }
    return () => { };
};
