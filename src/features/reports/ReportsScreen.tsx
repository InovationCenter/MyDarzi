import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import { colors, spacing } from '../../app/theme';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../../domain/constants';
import type { Expense, ProfitReport } from '../../domain/types/models';
import { useI18n } from '../../i18n';
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

type Period = 'today' | 'month';

export function ReportsScreen() {
  const { t } = useI18n();
  const { reportRepository, expenseRepository, businessRepository } = useDependencies();
  const [period, setPeriod] = useState<Period>('today');
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState('PKR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('supplies');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [profit, list, profile] = await Promise.all([
        period === 'today' ? reportRepository.todayProfit() : reportRepository.monthProfit(),
        period === 'today'
          ? reportRepository.listTodayExpenses()
          : reportRepository.listMonthExpenses(),
        businessRepository.get(),
      ]);
      setReport(profit);
      setExpenses(list);
      setCurrency(profile?.currency || 'PKR');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('reports.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [businessRepository, period, reportRepository, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const categoryLabel = useMemo(
    () =>
      ({
        rent: t('expense.category.rent'),
        utilities: t('expense.category.utilities'),
        supplies: t('expense.category.supplies'),
        salary: t('expense.category.salary'),
        transport: t('expense.category.transport'),
        other: t('expense.category.other'),
      }) as Record<ExpenseCategory, string>,
    [t],
  );

  const addExpense = async () => {
    setSaving(true);
    setError(null);
    try {
      await expenseRepository.create({
        title,
        category,
        amount: Number(amount),
        notes: notes.trim() || null,
      });
      setTitle('');
      setAmount('');
      setNotes('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('reports.expenseSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await expenseRepository.remove(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('reports.expenseDeleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !report) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>{t('reports.title')}</Title>
        <Subtitle>{t('reports.subtitle')}</Subtitle>
        <ErrorText message={error} />

        <View style={styles.periodRow}>
          <Chip
            label={t('reports.today')}
            active={period === 'today'}
            onPress={() => setPeriod('today')}
          />
          <Chip
            label={t('reports.month')}
            active={period === 'month'}
            onPress={() => setPeriod('month')}
          />
        </View>

        {report ? (
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('reports.income')}</Text>
              <Money amount={report.income} currency={currency} />
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('reports.expenses')}</Text>
              <Money amount={report.expenses} currency={currency} />
            </View>
            <View style={styles.metricWide}>
              <Text style={styles.metricLabel}>{t('reports.profit')}</Text>
              <Money amount={report.profit} currency={currency} />
              <Subtitle>
                {report.profit >= 0
                  ? t('reports.profitPositive')
                  : t('reports.profitNegative')}
              </Subtitle>
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>{t('reports.addExpense')}</Text>
        <Field
          label={t('reports.expenseTitle')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('reports.expenseTitlePlaceholder')}
        />
        <Field
          label={`${t('reports.expenseAmount')} (${currency})`}
          value={amount}
          onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Text style={styles.chipLabel}>{t('reports.expenseCategory')}</Text>
        <View style={styles.periodRow}>
          {EXPENSE_CATEGORIES.map(item => (
            <Chip
              key={item}
              label={categoryLabel[item]}
              active={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>
        <Field label={t('common.notes')} value={notes} onChangeText={setNotes} multiline />
        <PrimaryButton
          label={saving ? t('common.saving') : t('reports.saveExpense')}
          onPress={() => void addExpense()}
          disabled={saving}
        />

        <Text style={styles.section}>
          {period === 'today' ? t('reports.expensesToday') : t('reports.expensesMonth')}
        </Text>
        {expenses.length === 0 ? (
          <EmptyState message={t('reports.noExpenses')} />
        ) : (
          expenses.map(item => (
            <Card key={item.id}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Subtitle>
                {categoryLabel[item.category]} · {item.spentAt.slice(0, 10)}
              </Subtitle>
              <Money amount={item.amount} currency={currency} />
              {item.notes ? <Subtitle>{item.notes}</Subtitle> : null}
              <SecondaryButton
                label={t('common.delete')}
                danger
                onPress={() => void removeExpense(item.id)}
              />
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
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metric: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  metricWide: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.textMuted,
    marginBottom: 4,
    fontSize: 13,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chipLabel: {
    marginBottom: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
});
