/**
 * Utility for providing sensory feedback (audio/vibration) 
 * and system-level OS notifications.
 */

const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3';

// Web Audio API context for synthesized fallback
let audioCtx: AudioContext | null = null;

const playSynthesizedBeep = () => {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
        
        console.log('[NotificationFeedback] Played synthesized beep');
    } catch (e) {
        console.error('[NotificationFeedback] Web Audio API fallback failed:', e);
    }
};

/**
 * Plays a short notification chime with pre-loading logic.
 */
let notificationAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

/**
 * Browsers block audio until the first user interaction.
 * This should be called on the first click/tap.
 */
export const unlockAudio = () => {
    if (isAudioUnlocked) return;
    
    try {
        if (!notificationAudio) {
            notificationAudio = new Audio();
            // Important: Set src to a valid source or a base64 silent clip to avoid 'no supported source' error
            notificationAudio.src = NOTIFICATION_SOUND_PATH;
        }
        
        // Play silent sound to unlock context
        notificationAudio.muted = true;
        const playPromise = notificationAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                notificationAudio!.pause();
                notificationAudio!.muted = false;
                isAudioUnlocked = true;
                console.log('[NotificationFeedback] Audio context unlocked successfully');
            }).catch(err => {
                if (err.name === 'NotSupportedError') {
                    console.warn('[NotificationFeedback] MP3 not supported, using beep fallback.');
                    isAudioUnlocked = true; // Still mark as unlocked
                } else {
                    console.warn('[NotificationFeedback] Failed to unlock audio context:', err.name);
                }
            });
        }
    } catch (err) {
        console.error('[NotificationFeedback] Error during audio unlock:', err);
    }
};

export const playNotificationSound = () => {
    try {
        // Immediate synthesized beep fallback for environments where MP3 is known to fail
        if (!window.Audio || !notificationAudio || notificationAudio.error) {
            playSynthesizedBeep();
            if (!window.Audio) return;
        }

        if (!notificationAudio) {
            try {
                notificationAudio = new Audio(NOTIFICATION_SOUND_PATH);
                notificationAudio.load(); 
            } catch (e) {
                playSynthesizedBeep();
                return;
            }
        }

        notificationAudio.onerror = () => {
            console.warn('[NotificationFeedback] Audio source error, using beep fallback.');
            playSynthesizedBeep();
        };

        const attemptPlay = (audio: HTMLAudioElement) => {
            audio.currentTime = 0;
            if (!audio.src || audio.src === '' || audio.src.includes('undefined')) {
                audio.src = NOTIFICATION_SOUND_PATH;
            }
            return audio.play();
        };

        const p = attemptPlay(notificationAudio);
        if (p !== undefined) {
            p.then(() => {
                console.log('[NotificationFeedback] Sound played');
            }).catch(err => {
                if (err.name !== 'NotAllowedError') {
                    playSynthesizedBeep();
                }
            });
        }
    } catch (err) {
        playSynthesizedBeep();
    }
};

/**
 * Triggers haptic feedback (vibration) on supported devices.
 */
export const triggerHapticFeedback = () => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        // Standard pattern: 200ms vibration, 100ms pause, 200ms vibration
        navigator.vibrate([200, 100, 200]);
    }
};

/**
 * Shows a system-level popup notification using the Browser Notification API.
 * 
 * @param title Notification Title
 * @param message Notification Body
 * @param icon Optional Icon (defaults to logo)
 */
export const showSystemNotification = async (title: string, message: string, icon = '/logo.png') => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }

    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: message,
            icon,
            silent: true // We handle our own audio for consistency
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showSystemNotification(title, message, icon);
        }
    }
};

/**
 * Global trigger for all rich notification feedback.
 */
export const triggerRichNotification = (title: string, message: string) => {
    playNotificationSound();
    triggerHapticFeedback();
    
    // Only show system notification if the tab is not focused
    if (document.hidden) {
        showSystemNotification(title, message);
    }
};

/**
 * Requests necessary permissions for notifications.
 */
export const requestNotificationPermissions = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            await Notification.requestPermission();
        }
    }
};
