import { Linking, Share as RnShare } from 'react-native';
import type { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import { generatePDF } from 'react-native-html-to-pdf';
import { normalizeWhatsAppNumber } from './buildInvoice';
import { buildInvoiceHtml } from './buildInvoiceHtml';
import type { InvoiceData } from './buildInvoice';

function fileUrl(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }
  // Android share needs a proper file URI; normalize backslashes just in case.
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
}

export async function shareInvoiceText(text: string): Promise<void> {
  await RnShare.share({ message: text });
}

/**
 * Opens WhatsApp with a pre-filled invoice message.
 * Falls back to the system share sheet when no usable phone is available.
 */
export async function sendInvoiceViaWhatsApp(options: {
  phoneOrWhatsapp: string | null | undefined;
  text: string;
}): Promise<'whatsapp' | 'share'> {
  const phone = normalizeWhatsAppNumber(options.phoneOrWhatsapp);
  if (phone) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(options.text)}`;
    try {
      await Linking.openURL(url);
      return 'whatsapp';
    } catch {
      // fall through to share
    }
  }
  await shareInvoiceText(options.text);
  return 'share';
}

export async function captureInvoiceImage(viewRef: RefObject<unknown>): Promise<string> {
  const uri = await captureRef(viewRef as never, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
  return fileUrl(uri);
}

export async function createInvoicePdf(
  data: InvoiceData,
  fileName: string,
): Promise<string> {
  const html = buildInvoiceHtml(data);
  const safeName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'invoice';
  // Omit `directory` so Android writes to app cache (shareable, no storage permission).
  const result = await generatePDF({
    html,
    fileName: safeName,
    base64: false,
  });
  if (!result?.filePath) {
    throw new Error('PDF file was not created.');
  }
  return fileUrl(result.filePath);
}

export async function shareInvoiceFile(options: {
  url: string;
  type: 'image/png' | 'application/pdf';
  title?: string;
  message?: string;
}): Promise<void> {
  await Share.open({
    url: options.url,
    type: options.type,
    title: options.title || 'Invoice',
    message: options.message,
    failOnCancel: false,
    filename: options.type === 'application/pdf' ? 'invoice.pdf' : 'invoice.png',
  });
}

/** Share image/PDF and prefer WhatsApp when social is requested. */
export async function shareInvoiceFileToWhatsApp(options: {
  url: string;
  type: 'image/png' | 'application/pdf';
  phoneOrWhatsapp?: string | null;
  message?: string;
}): Promise<'whatsapp' | 'share'> {
  const phone = normalizeWhatsAppNumber(options.phoneOrWhatsapp);
  try {
    await Share.shareSingle({
      url: options.url,
      type: options.type,
      message: options.message,
      social: Share.Social.WHATSAPP as never,
      ...(phone ? { whatsAppNumber: phone } : {}),
      failOnCancel: false,
      filename: options.type === 'application/pdf' ? 'invoice.pdf' : 'invoice.png',
    } as never);
    return 'whatsapp';
  } catch {
    await shareInvoiceFile({
      url: options.url,
      type: options.type,
      message: options.message,
    });
    return 'share';
  }
}
