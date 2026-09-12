declare module 'react-native-tts' {
  type SimpleEvents = 'tts-start' | 'tts-finish' | 'tts-error' | 'tts-cancel';

  type TtsSubscription = {
    remove: () => void;
  };

  const Tts: {
    getInitStatus(): Promise<void>;
    setDefaultLanguage(lang: string): Promise<void> | void;
    setDefaultRate(rate: number): void;
    setDefaultPitch(pitch: number): void;
    speak(text: string): void;
    stop(): Promise<void> | void;
    addEventListener(
      event: SimpleEvents,
      handler: (...args: unknown[]) => void,
    ): TtsSubscription;
    removeEventListener(
      event: SimpleEvents,
      handler: (...args: unknown[]) => void,
    ): void;
  };
  export default Tts;
}
