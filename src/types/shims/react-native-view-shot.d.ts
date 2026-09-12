declare module 'react-native-view-shot' {
  export type CaptureOptions = {
    format?: 'png' | 'jpg' | 'webm' | 'raw';
    quality?: number;
    result?: 'tmpfile' | 'base64' | 'data-uri';
    width?: number;
    height?: number;
  };

  export function captureRef(
    ref: unknown,
    options?: CaptureOptions,
  ): Promise<string>;
}
