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
            notificationAudio.src = NOTIFICATION_SOUND_PATH;
        }
        
        // Play silent sound to unlock context
        notificationAudio.muted = true;
        notificationAudio.play().then(() => {
            notificationAudio!.pause();
            notificationAudio!.muted = false;
            isAudioUnlocked = true;
            console.log('[NotificationFeedback] Audio context unlocked successfully');
        }).catch(err => {
            console.warn('[NotificationFeedback] Failed to unlock audio context. This is expected if no user gesture:', err);
        });
    } catch (err) {
        console.error('[NotificationFeedback] Error during audio unlock:', err);
    }
};

export const playNotificationSound = () => {
    try {
        if (!notificationAudio) {
            notificationAudio = new Audio(NOTIFICATION_SOUND_PATH);
        }

        notificationAudio.onerror = () => {
            console.warn('[NotificationFeedback] Primary MP3 failed, switching to synthesized fallback');
            playSynthesizedBeep();
        };

        const attemptPlay = (audio: HTMLAudioElement) => {
            audio.currentTime = 0;
            return audio.play();
        };

        attemptPlay(notificationAudio).then(() => {
            console.log('[NotificationFeedback] MP3 played successfully');
        }).catch(err => {
            console.warn('[NotificationFeedback] Audio playback failed (Policy or Source):', err);
            
            // Final fallback: Web Audio API (immune to source loading errors)
            console.log('[NotificationFeedback] Triggering global synthesized fallback audio...');
            playSynthesizedBeep();
        });
    } catch (err) {
        console.error('[NotificationFeedback] Error playing sound:', err);
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
