import type { AppLanguage } from '../../i18n/types';
import type {
  MeasurementProfile,
  Order,
  Payment,
} from '../../domain/types/models';
import { PRODUCTION_STATUS_LABELS } from '../../domain/constants';
import { buildMeasurementSpeechScript } from './measurementSpeechScript';
import { customerMarkCode } from '../../shared/customerMark';

export type OrderSpeechInput = {
  order: Order;
  customerName?: string | null;
  currency?: string;
  payments?: Payment[];
  measurementProfile?: Pick<MeasurementProfile, 'name' | 'unit' | 'values'> | null;
};

function moneySpoken(amount: number, currency: string, language: AppLanguage): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const value = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return language === 'ur' ? `${value} ${currency}` : `${currency} ${value}`;
}

/** Full order script: header, items, totals, then measurements. */
export function buildOrderSpeechScript(
  input: OrderSpeechInput,
  language: AppLanguage,
): string {
  const {
    order,
    customerName,
    currency = 'PKR',
    payments = [],
    measurementProfile,
  } = input;
  const parts: string[] = [];

  if (language === 'ur') {
    parts.push(`آرڈر ${order.orderNumber}`);
    parts.push(`کپڑے کا نمبر ${customerMarkCode(order.customerId)}`);
    if (customerName) {
      parts.push(`گاہک ${customerName}`);
    }
    parts.push(`حیثیت ${PRODUCTION_STATUS_LABELS[order.status]}`);
    if (order.dueDate) {
      parts.push(`تاریخِ تکمیل ${order.dueDate}`);
    }
    parts.push('آئٹمز');
    for (const item of order.items) {
      parts.push(
        `${item.garmentName}, تعداد ${item.quantity}, قیمت ${moneySpoken(item.lineTotal, currency, language)}`,
      );
    }
    parts.push(`کل رقم ${moneySpoken(order.total, currency, language)}`);
    parts.push(`ادا شدہ ${moneySpoken(order.amountPaid ?? 0, currency, language)}`);
    parts.push(`باقی رقم ${moneySpoken(order.balance ?? 0, currency, language)}`);
    if (order.fabricInfo) {
      parts.push(`کپڑا ${order.fabricInfo}`);
    }
    if (order.color) {
      parts.push(`رنگ ${order.color}`);
    }
    if (order.instructions) {
      parts.push(`ہدایات ${order.instructions}`);
    }
    if (payments.length > 0) {
      parts.push(`ادائیگیاں ${payments.length}`);
    }
  } else {
    parts.push(`Order ${order.orderNumber}`);
    parts.push(`Fabric mark ${customerMarkCode(order.customerId)}`);
    if (customerName) {
      parts.push(`Customer ${customerName}`);
    }
    parts.push(`Status ${PRODUCTION_STATUS_LABELS[order.status]}`);
    if (order.dueDate) {
      parts.push(`Due date ${order.dueDate}`);
    }
    parts.push('Items');
    for (const item of order.items) {
      parts.push(
        `${item.garmentName}, quantity ${item.quantity}, ${moneySpoken(item.lineTotal, currency, language)}`,
      );
    }
    parts.push(`Total ${moneySpoken(order.total, currency, language)}`);
    parts.push(`Paid ${moneySpoken(order.amountPaid ?? 0, currency, language)}`);
    parts.push(`Balance ${moneySpoken(order.balance ?? 0, currency, language)}`);
    if (order.fabricInfo) {
      parts.push(`Fabric ${order.fabricInfo}`);
    }
    if (order.color) {
      parts.push(`Color ${order.color}`);
    }
    if (order.instructions) {
      parts.push(`Instructions ${order.instructions}`);
    }
    if (payments.length > 0) {
      parts.push(`${payments.length} payments recorded`);
    }
  }

  if (measurementProfile) {
    parts.push(buildMeasurementSpeechScript(measurementProfile, language, customerName));
  } else {
    parts.push(
      language === 'ur'
        ? 'اس آرڈر سے منسلک ناپ پروفائل نہیں'
        : 'No measurement profile linked to this order',
    );
  }

  return parts.join('. ');
}
