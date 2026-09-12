import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDependencies } from '../../app/DependenciesContext';
import type { CustomersStackParamList } from '../../app/navigation/types';
import { colors, spacing } from '../../app/theme';
import type { Customer } from '../../domain/types/customer';
import { useI18n } from '../../i18n';
import { customerMarkCode } from '../../shared/customerMark';
import {
  Card,
  EmptyState,
  ErrorText,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../shared/ui';

type Nav = NativeStackNavigationProp<CustomersStackParamList>;

function CustomerAvatar({ photoKey, name }: { photoKey: string | null; name: string }) {
  if (photoKey) {
    return <Image source={{ uri: photoKey }} style={styles.avatar} />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

export function CustomersScreen() {
  const { t } = useI18n();
  const { customerRepository } = useDependencies();
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (q?: string) => {
      setError(null);
      try {
        const list = await customerRepository.list({ query: q ?? query });
        setCustomers(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    },
    [customerRepository, query],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <Title>{t('customers.title')}</Title>
      <Field
        label={t('common.search')}
        value={query}
        onChangeText={text => {
          setQuery(text);
          void load(text);
        }}
        placeholder={t('customers.searchPlaceholder')}
        autoCorrect={false}
      />
      <ErrorText message={error} />
      <PrimaryButton
        label={t('customers.add')}
        onPress={() => navigation.navigate('CustomerForm')}
      />

      {loading && customers.length === 0 ? (
        <LoadingState />
      ) : (
        <FlatList
          style={styles.list}
          data={customers}
          keyExtractor={item => item.id}
          contentContainerStyle={customers.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={<EmptyState message={t('customers.empty')} />}
          renderItem={({ item }) => (
            <Card
              onPress={() =>
                navigation.navigate('CustomerDetail', { customerId: item.id })
              }>
              <View style={styles.row}>
                <CustomerAvatar photoKey={item.photoKey} name={item.name} />
                <View style={styles.meta}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.markCode}>
                    {t('orders.fabricMark', { code: customerMarkCode(item.id) })}
                  </Text>
                  <Subtitle>{item.phone || item.whatsapp || 'No phone'}</Subtitle>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: spacing.md, flex: 1 },
  emptyList: { flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7E5E4',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#44403C' },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  markCode: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 2,
  },
});
