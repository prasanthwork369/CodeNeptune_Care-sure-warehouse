// This utility handles sound playback using the modern expo-audio API (SDK 54+)
import { AppState } from 'react-native';
import { NotificationType } from '../store/useNotificationStore';

const SOUNDS: Record<NotificationType, any> = {
  critical: require('../../assets/sounds/warning.mp3'),
  error:    require('../../assets/sounds/warning.mp3'),
  warning:  require('../../assets/sounds/warning.mp3'),
  success:  require('../../assets/sounds/success.mp3'),
  info:     require('../../assets/sounds/success.mp3'),
};

let lastPlayedAt = 0;
const THROTTLE_MS = 2000;

/**
 * Plays a notification sound only if the app is in the foreground.
 * Includes throttling to prevent audio "overlap" in case of rapid events.
 */
export const playSound = async (type: NotificationType = 'info') => {
  // 1. Strict Foreground Check
  if (AppState.currentState !== 'active') return;

  // 2. Throttling Logic (Critical alerts bypass)
  const now = Date.now();
  if (now - lastPlayedAt < THROTTLE_MS && type !== 'critical') {
    return;
  }

  try {
    // 3. Dynamic Import for SDK 54 compatibility
    let Audio;
    try {
      Audio = require('expo-audio');
    } catch (e) {
      // Silence if dependency is not installed
      return;
    }

    if (!Audio || !Audio.createAudioPlayer) return;

    // 4. One-off Player Creation
    const player = Audio.createAudioPlayer(SOUNDS[type]);
    
    player.play();
    lastPlayedAt = now;

  } catch (error) {
    // Fail silently to avoid interrupting the main thread
  }
};
