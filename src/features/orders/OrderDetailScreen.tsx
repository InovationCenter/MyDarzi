import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useDependencies } from '../../app/DependenciesContext';
import type { OrdersStackParamList } from '../../app/navigation/types';
import { colors, spacing } from '../../app/theme';
import { useI18n } from '../../i18n';
import {
  nextProductionStatus,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PRODUCTION_STATUS_LABELS,
  type PaymentMethod,
} from '../../domain/constants';
import type {
  Alteration,
  BusinessProfile,
  DesignReference,
  MeasurementProfile,
  Order,
  Payment,
  ProductionEvent,
} from '../../domain/types/models';
import type { Customer } from '../../domain/types/customer';
import { buildInvoiceText } from '../../services/invoice/buildInvoice';
import {
  captureInvoiceImage,
  createInvoicePdf,
  sendInvoiceViaWhatsApp,
  shareInvoiceFile,
  shareInvoiceFileToWhatsApp,
  shareInvoiceText,
} from '../../services/invoice/shareInvoice';
import {
  speakOrder,
} from '../../services/speech/orderSpeech';
import {
  stopSpeaking,
  subscribeSpeechEnd,
} from '../../services/speech/measurementSpeech';
import { InvoicePreviewCard } from './InvoicePreviewCard';
import { customerMarkCode } from '../../shared/customerMark';
import {
  Card,
  Chip,
  EmptyState,
  ErrorText,
  Field,
  LoadingState,
  Money,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '../../shared/ui';

type Nav = NativeStackNavigationProp<OrdersStackParamList, 'OrderDetail'>;
type Route = RouteProp<OrdersStackParamList, 'OrderDetail'>;

export function OrderDetailScreen() {
  const deps = useDependencies();
  const { t, language } = useI18n();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const invoiceShotRef = useRef<any>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<ProductionEvent[]>([]);
  const [designs, setDesigns] = useState<DesignReference[]>([]);
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [measurementProfile, setMeasurementProfile] =
    useState<MeasurementProfile | null>(null);
  const [invoiceNote, setInvoiceNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payNote, setPayNote] = useState('');
  const [altProblem, setAltProblem] = useState('');
  const [altChange, setAltChange] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return subscribeSpeechEnd(() => setSpeaking(false));
  }, []);

  useEffect(() => {
    return () => {
      void stopSpeaking();
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [o, p, e, d, a, profile] = await Promise.all([
        deps.orderRepository.getById(orderId),
        deps.paymentRepository.listForOrder(orderId),
        deps.orderRepository.listProductionEvents(orderId),
        deps.designRepository.listForOrder(orderId),
        deps.alterationRepository.listForOrder(orderId),
        deps.businessRepository.get(),
      ]);
      if (!o) {
        setError('Order not found.');
        setOrder(null);
        setCustomer(null);
        setBusiness(null);
        setMeasurementProfile(null);
        return;
      }
      setOrder(o);
      setPayments(p);
      setEvents(e);
      setDesigns(d);
      setAlterations(a);
      setBusiness(profile);
      const cust = await deps.customerRepository.getById(o.customerId);
      setCustomer(cust);
      if (o.measurementProfileId) {
        const mp = await deps.measurementRepository.getProfile(o.measurementProfileId);
        setMeasurementProfile(mp);
      } else {
        setMeasurementProfile(null);
      }
      navigation.setOptions?.({ title: o.orderNumber });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [deps, navigation, orderId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const shareAction = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInvoiceNote(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invoice.shareFailed'));
    } finally {
      setBusy(false);
    }
  };

  const invoiceData = () => {
    if (!order) {
      return null;
    }
    return {
      business,
      customer,
      order,
      payments,
      currency: business?.currency || 'PKR',
    };
  };

  const makeInvoiceText = () => {
    const data = invoiceData();
    return data ? buildInvoiceText(data) : '';
  };

  const toggleListenOrder = async () => {
    setError(null);
    try {
      if (speaking) {
        await stopSpeaking();
        setSpeaking(false);
        return;
      }
      if (!order) {
        return;
      }
      setSpeaking(true);
      await speakOrder(
        {
          order,
          customerName: customer?.name,
          currency: business?.currency || 'PKR',
          payments,
          measurementProfile,
        },
        language,
      );
    } catch {
      setSpeaking(false);
      setError(t('speech.unavailable'));
    }
  };

  const sendInvoiceWhatsApp = () =>
    shareAction(async () => {
      const mode = await sendInvoiceViaWhatsApp({
        phoneOrWhatsapp: customer?.whatsapp || customer?.phone,
        text: makeInvoiceText(),
      });
      setInvoiceNote(
        mode === 'whatsapp' ? t('invoice.sentWhatsApp') : t('invoice.sharedFallback'),
      );
    });

  const shareInvoiceMessage = () =>
    shareAction(async () => {
      await shareInvoiceText(makeInvoiceText());
      setInvoiceNote(t('invoice.shared'));
    });

  const shareInvoiceAsImage = (toWhatsApp: boolean) =>
    shareAction(async () => {
      const url = await captureInvoiceImage(invoiceShotRef);
      const message = `${business?.name || 'MyDarzi'} — ${order?.orderNumber || 'Invoice'}`;
      if (toWhatsApp) {
        const mode = await shareInvoiceFileToWhatsApp({
          url,
          type: 'image/png',
          phoneOrWhatsapp: customer?.whatsapp || customer?.phone,
          message,
        });
        setInvoiceNote(
          mode === 'whatsapp' ? t('invoice.imageWhatsApp') : t('invoice.imageShared'),
        );
      } else {
        await shareInvoiceFile({ url, type: 'image/png', message });
        setInvoiceNote(t('invoice.imageShared'));
      }
    });

  const shareInvoiceAsPdf = (toWhatsApp: boolean) =>
    shareAction(async () => {
      const data = invoiceData();
      if (!data || !order) {
        return;
      }
      const url = await createInvoicePdf(data, `invoice_${order.orderNumber}`);
      const message = `${business?.name || 'MyDarzi'} — ${order.orderNumber}`;
      if (toWhatsApp) {
        const mode = await shareInvoiceFileToWhatsApp({
          url,
          type: 'application/pdf',
          phoneOrWhatsapp: customer?.whatsapp || customer?.phone,
          message,
        });
        setInvoiceNote(
          mode === 'whatsapp' ? t('invoice.pdfWhatsApp') : t('invoice.pdfShared'),
        );
      } else {
        await shareInvoiceFile({ url, type: 'application/pdf', message });
        setInvoiceNote(t('invoice.pdfShared'));
      }
    });

  const addPayment = () =>
    run(async () => {
      if (!order) return;
      await deps.paymentRepository.add({
        orderId: order.id,
        customerId: order.customerId,
        amount: Number(payAmount),
        method: payMethod,
        note: payNote.trim() || null,
      });
      setPayAmount('');
      setPayNote('');
    });

  const addDesign = (fromCamera: boolean) =>
    run(async () => {
      const result = fromCamera
        ? await launchCamera({ mediaType: 'photo', quality: 0.8 })
        : await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || !result.assets?.[0]?.uri) return;
      await deps.designRepository.add({
        orderId,
        mediaKey: result.assets[0].uri,
        kind: 'reference',
      });
    });

  const addAlteration = () =>
    run(async () => {
      if (!order) return;
      await deps.alterationRepository.create({
        orderId: order.id,
        customerId: order.customerId,
        problem: altProblem,
        requestedChange: altChange.trim() || null,
      });
      setAltProblem('');
      setAltChange('');
    });

  if (loading && !order) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <ErrorText message={error || 'Order not found.'} />
      </Screen>
    );
  }

  const next = nextProductionStatus(order.status);
  const data = invoiceData();

  return (
    <Screen style={styles.screen}>
      {data ? (
        <View
          ref={invoiceShotRef}
          collapsable={false}
          style={styles.offscreenShot}>
          <InvoicePreviewCard data={data} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>{order.orderNumber}</Title>
        <Subtitle>
          {PRODUCTION_STATUS_LABELS[order.status]}
          {order.dueDate ? ` · due ${order.dueDate}` : ''}
        </Subtitle>
        {customer ? <Subtitle>{customer.name}</Subtitle> : null}
        <Text style={styles.markCode}>
          {t('orders.fabricMark', { code: customerMarkCode(order.customerId) })}
        </Text>
        <ErrorText message={error} />

        <SecondaryButton
          label={
            speaking
              ? t('speech.stop')
              : t('speech.listenOrder')
          }
          onPress={() => void toggleListenOrder()}
          disabled={busy}
        />
        {speaking ? <Subtitle>{t('speech.speaking')}</Subtitle> : null}

        <Card>
          <Subtitle>Total</Subtitle>
          <Money amount={order.total} />
          <Subtitle>Paid</Subtitle>
          <Money amount={order.amountPaid ?? 0} />
          <Subtitle>Balance</Subtitle>
          <Money amount={order.balance ?? 0} />
          {order.fabricInfo ? <Subtitle>Fabric: {order.fabricInfo}</Subtitle> : null}
          {order.color ? <Subtitle>Color: {order.color}</Subtitle> : null}
          {order.instructions ? <Subtitle>{order.instructions}</Subtitle> : null}
          {order.notes ? <Subtitle>{order.notes}</Subtitle> : null}
          {measurementProfile ? (
            <Subtitle>
              {t('speech.linkedMeasurements')}: {measurementProfile.name} (
              {measurementProfile.values.filter(v => v.value != null).length})
            </Subtitle>
          ) : null}
        </Card>

        <Text style={styles.section}>{t('invoice.section')}</Text>
        {invoiceNote ? <Subtitle>{invoiceNote}</Subtitle> : null}
        <PrimaryButton
          label={busy ? t('common.saving') : t('invoice.sendWhatsApp')}
          onPress={() => void sendInvoiceWhatsApp()}
          disabled={busy}
        />
        <SecondaryButton
          label={t('invoice.shareText')}
          onPress={() => void shareInvoiceMessage()}
          disabled={busy}
        />
        <SecondaryButton
          label={t('invoice.shareImage')}
          onPress={() => void shareInvoiceAsImage(false)}
          disabled={busy}
        />
        <SecondaryButton
          label={t('invoice.shareImageWhatsApp')}
          onPress={() => void shareInvoiceAsImage(true)}
          disabled={busy}
        />
        <SecondaryButton
          label={t('invoice.sharePdf')}
          onPress={() => void shareInvoiceAsPdf(false)}
          disabled={busy}
        />
        <SecondaryButton
          label={t('invoice.sharePdfWhatsApp')}
          onPress={() => void shareInvoiceAsPdf(true)}
          disabled={busy}
        />
        {!customer?.whatsapp && !customer?.phone ? (
          <Subtitle>{t('invoice.noPhone')}</Subtitle>
        ) : null}

        <Text style={styles.section}>Items</Text>
        {order.items.map(item => (
          <Card key={item.id}>
            <Text style={styles.rowTitle}>
              {item.garmentName} × {item.quantity}
            </Text>
            <Money amount={item.lineTotal} />
          </Card>
        ))}

        <Text style={styles.section}>Production</Text>
        {next ? (
          <PrimaryButton
            label={busy ? 'Working…' : `Advance to ${PRODUCTION_STATUS_LABELS[next]}`}
            onPress={() =>
              run(() => deps.orderRepository.advanceStatus(orderId).then(() => undefined))
            }
            disabled={busy}
          />
        ) : null}
        {order.status !== 'ready' && order.status !== 'delivered' ? (
          <SecondaryButton
            label="Set Ready"
            onPress={() =>
              run(() => deps.orderRepository.setStatus(orderId, 'ready').then(() => undefined))
            }
          />
        ) : null}
        {order.status !== 'delivered' ? (
          <SecondaryButton
            label="Set Delivered"
            onPress={() =>
              run(() =>
                deps.orderRepository.setStatus(orderId, 'delivered').then(() => undefined),
              )
            }
          />
        ) : null}

        {events.map(ev => (
          <Card key={ev.id}>
            <Text style={styles.rowTitle}>
              {ev.fromStatus
                ? `${PRODUCTION_STATUS_LABELS[ev.fromStatus]} → ${PRODUCTION_STATUS_LABELS[ev.toStatus]}`
                : PRODUCTION_STATUS_LABELS[ev.toStatus]}
            </Text>
            <Subtitle>
              {ev.changedAt.slice(0, 16).replace('T', ' ')}
              {ev.note ? ` · ${ev.note}` : ''}
            </Subtitle>
          </Card>
        ))}

        <Text style={styles.section}>Payments</Text>
        {payments.length === 0 ? <EmptyState message="No payments yet." /> : null}
        {payments.map(p => (
          <Card key={p.id}>
            <Money amount={p.amount} />
            <Subtitle>
              {PAYMENT_METHOD_LABELS[p.method]} · {p.paidAt.slice(0, 10)}
              {p.note ? ` · ${p.note}` : ''}
            </Subtitle>
          </Card>
        ))}
        <Field
          label="Payment amount"
          value={payAmount}
          onChangeText={setPayAmount}
          keyboardType="decimal-pad"
        />
        <View style={styles.chips}>
          {PAYMENT_METHODS.map(m => (
            <Chip
              key={m}
              label={PAYMENT_METHOD_LABELS[m]}
              active={payMethod === m}
              onPress={() => setPayMethod(m)}
            />
          ))}
        </View>
        <Field label="Note" value={payNote} onChangeText={setPayNote} />
        <PrimaryButton label="Add payment" onPress={() => void addPayment()} disabled={busy} />

        <Text style={styles.section}>Design references</Text>
        <SecondaryButton label="Pick from gallery" onPress={() => void addDesign(false)} />
        <SecondaryButton label="Take photo" onPress={() => void addDesign(true)} />
        {designs.length === 0 ? <EmptyState message="No designs yet." /> : null}
        {designs.map(d => (
          <Card key={d.id}>
            {d.mediaKey ? (
              <Image source={{ uri: d.mediaKey }} style={styles.image} resizeMode="cover" />
            ) : null}
            <Subtitle>{d.caption || d.kind}</Subtitle>
            <SecondaryButton
              label="Archive"
              danger
              onPress={() => run(() => deps.designRepository.archive(d.id))}
            />
          </Card>
        ))}

        <Text style={styles.section}>Alterations</Text>
        {alterations.map(a => (
          <Card key={a.id}>
            <Text style={styles.rowTitle}>{a.problem}</Text>
            <Subtitle>
              {a.status}
              {a.requestedChange ? ` · ${a.requestedChange}` : ''}
            </Subtitle>
          </Card>
        ))}
        <Field label="Problem" value={altProblem} onChangeText={setAltProblem} multiline />
        <Field
          label="Requested change"
          value={altChange}
          onChangeText={setAltChange}
          multiline
        />
        <PrimaryButton
          label="Add alteration"
          onPress={() => void addAlteration()}
          disabled={busy}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  markCode: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primary,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  offscreenShot: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0.02,
    zIndex: -1,
  },
});
