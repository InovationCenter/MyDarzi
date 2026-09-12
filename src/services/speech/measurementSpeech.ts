import Tts from 'react-native-tts';
import type { AppLanguage } from '../../i18n/types';
import type { MeasurementProfile } from '../../domain/types/models';
import { buildMeasurementSpeechScript } from './measurementSpeechScript';

export type { SpeakableMeasurement } from './measurementSpeechScript';
export { buildMeasurementSpeechScript } from './measurementSpeechScript';

let initialized = false;

export async function ensureSpeechReady(language: AppLanguage): Promise<void> {
  if (!initialized) {
    try {
      await Tts.getInitStatus();
    } catch {
      // Some devices resolve without getInitStatus; continue.
    }
    Tts.setDefaultRate(0.42);
    Tts.setDefaultPitch(1.0);
    initialized = true;
  }

  const locale = language === 'ur' ? 'ur-PK' : 'en-US';
  try {
    await Tts.setDefaultLanguage(locale);
  } catch {
    try {
      await Tts.setDefaultLanguage('en-US');
    } catch {
      // Ignore
    }
  }
}

export async function speakMeasurements(
  profile: Pick<MeasurementProfile, 'name' | 'unit' | 'values'>,
  language: AppLanguage,
  customerName?: string | null,
): Promise<void> {
  await ensureSpeechReady(language);
  await Tts.stop();
  Tts.speak(buildMeasurementSpeechScript(profile, language, customerName));
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Tts.stop();
  } catch {
    // no-op
  }
}

export function subscribeSpeechEnd(onEnd: () => void): () => void {
  const handler = () => onEnd();
  // RN EventEmitter no longer has removeListener — use subscription.remove().
  const finishSub = Tts.addEventListener('tts-finish', handler);
  const cancelSub = Tts.addEventListener('tts-cancel', handler);
  return () => {
    finishSub?.remove?.();
    cancelSub?.remove?.();
  };
}
