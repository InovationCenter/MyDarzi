import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import type { CustomersStackParamList } from '../../app/navigation/types';
import { spacing, colors } from '../../app/theme';
import {
  PAYMENT_METHOD_LABELS,
  PRODUCTION_STATUS_LABELS,
} from '../../domain/constants';
import type { Customer } from '../../domain/types/customer';
import type {
  Alteration,
  MeasurementProfile,
  Order,
  Payment,
} from '../../domain/types/models';
import { useI18n } from '../../i18n';
import { customerMarkCode } from '../../shared/customerMark';
import {
  speakMeasurements,
  stopSpeaking,
  subscribeSpeechEnd,
} from '../../services/speech/measurementSpeech';
import {
  Card,
  EmptyState,
  ErrorText,
  LoadingState,
  Money,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '../../shared/ui';

type Route = RouteProp<CustomersStackParamList, 'CustomerDetail'>;

function navigateLocalOrTab(
  navigation: any,
  screen: string,
  params: Record<string, unknown> | undefined,
  tab: string,
) {
  const names: string[] = navigation.getState?.()?.routeNames ?? [];
  if (names.includes(screen)) {
    navigation.navigate(screen, params);
    return;
  }
  navigation.getParent()?.navigate(tab, { screen, params });
}

export function CustomerDetailScreen() {
  const deps = useDependencies();
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { t, language } = useI18n();
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speakingProfileId, setSpeakingProfileId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSpeechEnd(() => setSpeakingProfileId(null));
    return () => {
      unsubscribe();
      void stopSpeaking();
    };
  }, []);

  const listenProfile = async (profile: MeasurementProfile) => {
    if (profile.values.every(v => v.value == null)) {
      setError(t('speech.noSizes'));
      return;
    }
    try {
      if (speakingProfileId === profile.id) {
        await stopSpeaking();
        setSpeakingProfileId(null);
        return;
      }
      await stopSpeaking();
      setSpeakingProfileId(profile.id);
      await speakMeasurements(profile, language, customer?.name);
    } catch {
      setSpeakingProfileId(null);
      setError(t('speech.unavailable'));
    }
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, o, p, pay, alt] = await Promise.all([
        deps.customerRepository.getById(customerId),
        deps.orderRepository.list({ customerId }),
        deps.measurementRepository.listProfiles(customerId),
        deps.paymentRepository.listForCustomer(customerId),
        deps.alterationRepository.listForCustomer(customerId),
      ]);
      if (!c) {
        setError('Customer not found.');
        setCustomer(null);
        return;
      }
      setCustomer(c);
      setOrders(o);
      setProfiles(p);
      setPayments(pay);
      setAlterations(alt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId, deps]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const archive = () => {
    Alert.alert('Archive customer?', 'They will be hidden from the active list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deps.customerRepository.archive(customerId);
              navigation.goBack();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Archive failed');
            }
          })();
        },
      },
    ]);
  };

  const copyLatest = async () => {
    if (!profiles[0]) return;
    setError(null);
    try {
      await deps.measurementRepository.copyProfile(profiles[0].id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Copy failed');
    }
  };

  if (loading && !customer) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen>
        <ErrorText message={error || 'Customer not found.'} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {customer.photoKey ? (
          <Image
            source={{ uri: customer.photoKey }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : null}
        <Title>{customer.name}</Title>
        <Text style={styles.markCode}>
          {t('orders.fabricMark', { code: customerMarkCode(customer.id) })}
        </Text>
        <Subtitle>{customer.phone || 'No phone'}</Subtitle>
        {customer.whatsapp ? <Subtitle>WhatsApp: {customer.whatsapp}</Subtitle> : null}
        {customer.address ? <Subtitle>{customer.address}</Subtitle> : null}
        {customer.notes ? <Subtitle>{customer.notes}</Subtitle> : null}
        <ErrorText message={error} />

        <PrimaryButton
          label="New Order"
          onPress={() =>
            navigateLocalOrTab(navigation, 'NewOrder', { customerId }, 'Orders')
          }
        />
        <SecondaryButton
          label="Edit"
          onPress={() =>
            navigateLocalOrTab(navigation, 'CustomerForm', { customerId }, 'Customers')
          }
        />
        <SecondaryButton
          label="Add Measurement"
          onPress={() =>
            navigateLocalOrTab(
              navigation,
              'MeasurementForm',
              { customerId },
              'Customers',
            )
          }
        />
        {profiles[0] ? (
          <SecondaryButton label="Copy latest measurement" onPress={() => void copyLatest()} />
        ) : null}
        <SecondaryButton label="Archive" danger onPress={archive} />

        <Text style={styles.section}>Orders</Text>
        {orders.length === 0 ? (
          <EmptyState message="No orders yet." />
        ) : (
          orders.map(o => (
            <Card
              key={o.id}
              onPress={() =>
                navigateLocalOrTab(
                  navigation,
                  'OrderDetail',
                  { orderId: o.id },
                  'Orders',
                )
              }>
              <Text style={styles.rowTitle}>{o.orderNumber}</Text>
              <Text style={styles.markCodeSmall}>
                {t('orders.fabricMark', { code: customerMarkCode(customerId) })}
              </Text>
              <Subtitle>
                {PRODUCTION_STATUS_LABELS[o.status]}
                {o.dueDate ? ` · due ${o.dueDate}` : ''}
              </Subtitle>
              <Money amount={o.balance ?? 0} />
            </Card>
          ))
        )}

        <Text style={styles.section}>{t('customers.measurements')}</Text>
        {profiles.length === 0 ? (
          <EmptyState message={t('customers.noMeasurements')} />
        ) : (
          profiles.map(p => (
            <Card key={p.id}>
              <Text style={styles.rowTitle}>{p.name}</Text>
              <Subtitle>{t('orders.unitLabel', { unit: p.unit })}</Subtitle>
              {p.values.map(value => (
                <View key={value.id} style={styles.sizeRow}>
                  <Text style={styles.sizeLabel}>{value.fieldLabel}</Text>
                  <Text style={styles.sizeValue}>
                    {value.value == null ? '—' : `${value.value} ${value.unit}`}
                  </Text>
                </View>
              ))}
              <SecondaryButton
                label={
                  speakingProfileId === p.id
                    ? t('speech.stop')
                    : t('speech.listenMeasurements')
                }
                onPress={() => void listenProfile(p)}
              />
            </Card>
          ))
        )}

        <Text style={styles.section}>Payments</Text>
        {payments.length === 0 ? (
          <EmptyState message="No payments." />
        ) : (
          payments.map(p => (
            <Card key={p.id}>
              <Money amount={p.amount} />
              <Subtitle>
                {PAYMENT_METHOD_LABELS[p.method]} · {p.paidAt.slice(0, 10)}
              </Subtitle>
            </Card>
          ))
        )}

        <Text style={styles.section}>Alterations</Text>
        {alterations.length === 0 ? (
          <EmptyState message="No alterations." />
        ) : (
          alterations.map(a => (
            <Card key={a.id}>
              <Text style={styles.rowTitle}>{a.problem}</Text>
              <Subtitle>
                {a.status}
                {a.requestedChange ? ` · ${a.requestedChange}` : ''}
              </Subtitle>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: spacing.md,
    backgroundColor: '#E7E5E4',
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
  },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  markCode: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  markCodeSmall: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 4,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7E5E4',
  },
  sizeLabel: { flex: 1 },
  sizeValue: { fontWeight: '700' },
});
