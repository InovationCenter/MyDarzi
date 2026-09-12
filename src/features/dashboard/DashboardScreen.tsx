import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDependencies } from '../../app/DependenciesContext';
import type { DashboardStackParamList } from '../../app/navigation/types';
import { colors, spacing } from '../../app/theme';
import { PRODUCTION_STATUS_LABELS } from '../../domain/constants';
import type { DashboardSnapshot } from '../../domain/types/models';
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
import { FadeInView } from '../../shared/motion';
import { BrandLogo } from '../../shared/BrandLogo';
import { customerMarkCode } from '../../shared/customerMark';
import { useI18n } from '../../i18n';

type Nav = NativeStackNavigationProp<DashboardStackParamList>;

export function DashboardScreen() {
  const { dashboardRepository, businessRepository } = useDependencies();
  const navigation = useNavigation<Nav>();
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await dashboardRepository.getSnapshot();
      setSnapshot(data);
      const profile = await businessRepository.get();
      setShopName(profile?.name ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [dashboardRepository, businessRepository]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (loading && !snapshot) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.header}>
            <BrandLogo size={48} />
            <View style={styles.headerText}>
              <Title>{shopName || t('app.name')}</Title>
              <Subtitle>{t('dashboard.overview')}</Subtitle>
            </View>
          </View>
        </FadeInView>
        <ErrorText message={error} />

        {snapshot ? (
          <>
            <FadeInView delay={80}>
              <View style={styles.metrics}>
                <Metric label={t('dashboard.ordersToday')} value={String(snapshot.ordersToday)} />
                <Metric label={t('dashboard.dueToday')} value={String(snapshot.dueToday)} />
                <Metric label={t('dashboard.overdue')} value={String(snapshot.overdue)} />
                <Metric label={t('dashboard.ready')} value={String(snapshot.ready)} />
              </View>
            </FadeInView>

            <FadeInView delay={140}>
              <View style={styles.actions}>
                <PrimaryButton
                  label={t('dashboard.newOrder')}
                  onPress={() => navigation.navigate('NewOrder')}
                />
                <SecondaryButton
                  label="Customer"
                  onPress={() => navigation.navigate('CustomerForm')}
                />
                <SecondaryButton
                  label={t('dashboard.search')}
                  onPress={() => navigation.navigate('Search')}
                />
              </View>
            </FadeInView>

            <FadeInView delay={200}>
            <SectionTitle>{t('dashboard.actionable')}</SectionTitle>
            {snapshot.actionableOrders.length === 0 ? (
              <EmptyState message={t('dashboard.noOpenOrders')} />
            ) : (
              snapshot.actionableOrders.map(o => (
                <Card
                  key={o.id}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}>
                  <Text style={styles.cardTitle}>{o.orderNumber}</Text>
                  <Text style={styles.markCode}>
                    {t('orders.fabricMark', { code: customerMarkCode(o.customerId) })}
                  </Text>
                  <Subtitle>
                    {o.customerName} · {PRODUCTION_STATUS_LABELS[o.status]}
                    {o.dueDate ? ` · due ${o.dueDate}` : ''}
                  </Subtitle>
                </Card>
              ))
            )}
            </FadeInView>

            <SectionTitle>{t('dashboard.recentCustomers')}</SectionTitle>
            {snapshot.recentCustomers.length === 0 ? (
              <EmptyState message={t('dashboard.noCustomers')} />
            ) : (
              snapshot.recentCustomers.map(c => (
                <Card
                  key={c.id}
                  onPress={() =>
                    navigation.navigate('CustomerDetail', { customerId: c.id })
                  }>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Subtitle>{c.phone || 'No phone'}</Subtitle>
                </Card>
              ))
            )}

            <SectionTitle>{t('dashboard.recentOrders')}</SectionTitle>
            {snapshot.recentOrders.length === 0 ? (
              <EmptyState message={t('dashboard.noOrders')} />
            ) : (
              snapshot.recentOrders.map(o => (
                <Card
                  key={o.id}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}>
                  <Text style={styles.cardTitle}>{o.orderNumber}</Text>
                  <Text style={styles.markCode}>
                    {t('orders.fabricMark', { code: customerMarkCode(o.customerId) })}
                  </Text>
                  <Subtitle>
                    {o.customerName} · {PRODUCTION_STATUS_LABELS[o.status]}
                  </Subtitle>
                  <Money amount={o.balance} />
                </Card>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  metric: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  metricLabel: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 13,
  },
  actions: { marginVertical: spacing.md },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  markCode: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 4,
  },
});
