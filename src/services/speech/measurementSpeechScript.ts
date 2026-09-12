import type { AppLanguage } from '../../i18n/types';
import type { MeasurementProfile, MeasurementValue } from '../../domain/types/models';

export type SpeakableMeasurement = Pick<MeasurementValue, 'fieldLabel' | 'value' | 'unit'>;

function formatUnit(unit: string, language: AppLanguage): string {
  if (language === 'ur') {
    if (unit === 'in') return 'انچ';
    if (unit === 'cm') return 'سینٹی میٹر';
  }
  if (unit === 'in') return 'inches';
  if (unit === 'cm') return 'centimeters';
  return unit;
}

export function buildMeasurementSpeechScript(
  profile: Pick<MeasurementProfile, 'name' | 'unit' | 'values'>,
  language: AppLanguage,
  customerName?: string | null,
): string {
  const parts: string[] = [];

  if (language === 'ur') {
    if (customerName) {
      parts.push(`${customerName} کے ناپ`);
    }
    parts.push(`پروفائل ${profile.name}`);
  } else {
    if (customerName) {
      parts.push(`Measurements for ${customerName}`);
    }
    parts.push(`Profile ${profile.name}`);
  }

  const values = profile.values.filter(v => v.value != null);
  if (values.length === 0) {
    parts.push(language === 'ur' ? 'کوئی سائز محفوظ نہیں' : 'No sizes saved');
    return parts.join('. ');
  }

  for (const item of values) {
    const unitLabel = formatUnit(item.unit || profile.unit, language);
    parts.push(`${item.fieldLabel}: ${item.value} ${unitLabel}`);
  }

  return parts.join('. ');
}
