import Tts from 'react-native-tts';
import type { AppLanguage } from '../../i18n/types';
import { ensureSpeechReady, stopSpeaking } from './measurementSpeech';
import {
  buildOrderSpeechScript,
  type OrderSpeechInput,
} from './orderSpeechScript';

export { buildOrderSpeechScript } from './orderSpeechScript';
export type { OrderSpeechInput } from './orderSpeechScript';

export async function speakOrder(
  input: OrderSpeechInput,
  language: AppLanguage,
): Promise<void> {
  await ensureSpeechReady(language);
  await stopSpeaking();
  Tts.speak(buildOrderSpeechScript(input, language));
}
