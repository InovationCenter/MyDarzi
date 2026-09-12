import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDependencies } from '../../app/DependenciesContext';
import type { OrdersStackParamList } from '../../app/navigation/types';
import { colors, spacing } from '../../app/theme';
import {
  PRODUCTION_STATUSES,
  type ProductionStatus,
} from '../../domain/constants';
import type { Order } from '../../domain/types/models';
import { useI18n, statusKey } from '../../i18n';
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
  Subtitle,
  Title,
} from '../../shared/ui';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;
type Filter = 'all' | 'active' | ProductionStatus;

export function OrdersScreen() {
  const { t } = useI18n();
  const { orderRepository } = useDependencies();
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextFilter?: Filter, nextQuery?: string) => {
      const status = nextFilter ?? filter;
      const q = nextQuery ?? query;
      setError(null);
      try {
        const list = await orderRepository.list({
          status,
          query: q || undefined,
        });
        setOrders(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    },
    [filter, orderRepository, query],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <Title>{t('orders.title')}</Title>
      <Field
        label="Search"
        value={query}
        onChangeText={text => {
          setQuery(text);
          void load(filter, text);
        }}
        placeholder="Order #, customer, notes…"
        autoCorrect={false}
      />

      <View style={styles.chips}>
        <Chip
          label="All"
          active={filter === 'all'}
          onPress={() => {
            setFilter('all');
            void load('all');
          }}
        />
        <Chip
          label="Active"
          active={filter === 'active'}
          onPress={() => {
            setFilter('active');
            void load('active');
          }}
        />
        {PRODUCTION_STATUSES.map(s => (
          <Chip
            key={s}
            label={t(statusKey(s))}
            active={filter === s}
            onPress={() => {
              setFilter(s);
              void load(s);
            }}
          />
        ))}
      </View>

      <ErrorText message={error} />
      <PrimaryButton label="New Order" onPress={() => navigation.navigate('NewOrder')} />

      {loading && orders.length === 0 ? (
        <LoadingState />
      ) : (
        <FlatList
          style={styles.list}
          data={orders}
          keyExtractor={item => item.id}
          contentContainerStyle={orders.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={<EmptyState message={t('orders.empty')} />}
          renderItem={({ item }) => (
            <Card
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
              <Text style={styles.name}>{item.orderNumber}</Text>
              <Text style={styles.markCode}>
                {t('orders.fabricMark', { code: customerMarkCode(item.customerId) })}
              </Text>
              <Subtitle>
                {t(statusKey(item.status))}
                {item.dueDate ? ` · due ${item.dueDate}` : ''}
              </Subtitle>
              <Money amount={item.balance ?? 0} />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  list: { marginTop: spacing.sm, flex: 1 },
  emptyList: { flexGrow: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  markCode: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 4,
  },
});
