import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import { spacing } from '../../app/theme';
import type { SearchResult } from '../../domain/types/models';
import {
  Card,
  EmptyState,
  ErrorText,
  Field,
  Screen,
  Subtitle,
  Title,
} from '../../shared/ui';

export function SearchScreen() {
  const { searchRepository } = useDependencies();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      setError(null);
      if (!text.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      try {
        const list = await searchRepository.search(text);
        setResults(list);
        setSearched(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
      }
    },
    [searchRepository],
  );

  const openResult = (item: SearchResult) => {
    if (item.type === 'customer') {
      navigation.navigate('CustomerDetail', { customerId: item.id });
    } else if (item.type === 'order') {
      navigation.navigate('OrderDetail', { orderId: item.id });
    }
  };

  return (
    <Screen>
      <Title>Search</Title>
      <Field
        label="Query"
        value={query}
        onChangeText={text => void runSearch(text)}
        placeholder="Customers, phones, order numbers…"
        autoCorrect={false}
        autoFocus
      />
      <ErrorText message={error} />

      <FlatList
        style={styles.list}
        data={results}
        keyExtractor={item => `${item.type}-${item.id}`}
        contentContainerStyle={results.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <EmptyState
            message={
              searched ? 'No matches.' : 'Type to search customers and orders.'
            }
          />
        }
        renderItem={({ item }) => (
          <Card onPress={() => openResult(item)}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle ? <Subtitle>{item.subtitle}</Subtitle> : null}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: spacing.sm, flex: 1 },
  emptyList: { flexGrow: 1 },
  type: {
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    opacity: 0.6,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
});
