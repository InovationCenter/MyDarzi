import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useDependencies } from '../../app/DependenciesContext';
import type { OrdersStackParamList } from '../../app/navigation/types';
import { colors, spacing } from '../../app/theme';
import { useI18n, paymentKey } from '../../i18n';
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from '../../domain/constants';
import type { Customer } from '../../domain/types/customer';
import type { Garment, MeasurementProfile } from '../../domain/types/models';
import { customerMarkCode } from '../../shared/customerMark';
import { DateField } from '../../shared/DateField';
import {
  speakMeasurements,
  stopSpeaking,
  subscribeSpeechEnd,
} from '../../services/speech/measurementSpeech';
import {
  Card,
  Chip,
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

type Nav = NativeStackNavigationProp<OrdersStackParamList, 'NewOrder'>;
type Route = RouteProp<OrdersStackParamList, 'NewOrder'>;

type LineDraft = {
  garmentId: string;
  garmentName: string;
  quantity: string;
  unitPrice: string;
};

function priceToInput(value: number | null | undefined): string {
  const n = Number(value) || 0;
  if (!n) {
    return '0';
  }
  return Number.isInteger(n) ? String(n) : String(n);
}

export function NewOrderScreen() {
  const deps = useDependencies();
  const { t, language } = useI18n();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const presetCustomerId = route.params?.customerId;
  const [speaking, setSpeaking] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(presetCustomerId ?? null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [measurementProfileId, setMeasurementProfileId] = useState<string | null>(null);
  const [fabric, setFabric] = useState('');
  const [color, setColor] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [advance, setAdvance] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [fabricPhotos, setFabricPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    setError(null);
    try {
      const [customerList, garmentList] = await Promise.all([
        deps.customerRepository.list({ query: customerQuery || undefined }),
        deps.catalogRepository.listGarments(),
      ]);
      setCustomers(customerList);
      setGarments(garmentList);
      if (presetCustomerId && !customerId) {
        setCustomerId(presetCustomerId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  }, [customerId, customerQuery, deps, presetCustomerId]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!presetCustomerId) {
      return;
    }
    void (async () => {
      const customer = await deps.customerRepository.getById(presetCustomerId);
      if (customer) {
        setCustomers(prev =>
          prev.some(item => item.id === customer.id) ? prev : [customer, ...prev],
        );
        setCustomerId(customer.id);
      }
    })();
  }, [deps.customerRepository, presetCustomerId]);

  useEffect(() => {
    if (!customerId) {
      setProfiles([]);
      setMeasurementProfileId(null);
      return;
    }
    void (async () => {
      try {
        const list = await deps.measurementRepository.listProfiles(customerId);
        setProfiles(list);
        setMeasurementProfileId(prev =>
          prev && list.some(profile => profile.id === prev) ? prev : list[0]?.id ?? null,
        );
      } catch {
        setProfiles([]);
        setMeasurementProfileId(null);
      }
    })();
  }, [customerId, deps.measurementRepository]);

  const selectedCustomer = customers.find(customer => customer.id === customerId) ?? null;
  const selectedProfile = profiles.find(profile => profile.id === measurementProfileId) ?? null;
  const markCode = selectedCustomer ? customerMarkCode(selectedCustomer.id) : null;

  useEffect(() => {
    const unsubscribe = subscribeSpeechEnd(() => setSpeaking(false));
    return () => {
      unsubscribe();
      void stopSpeaking();
    };
  }, []);

  const listenToMeasurements = async () => {
    if (!selectedProfile) {
      return;
    }
    if (selectedProfile.values.every(v => v.value == null)) {
      setError(t('speech.noSizes'));
      return;
    }
    try {
      if (speaking) {
        await stopSpeaking();
        setSpeaking(false);
        return;
      }
      setSpeaking(true);
      await speakMeasurements(selectedProfile, language, selectedCustomer?.name);
    } catch {
      setSpeaking(false);
      setError(t('speech.unavailable'));
    }
  };

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const quantity = Number(line.quantity) || 0;
        const price = Number(line.unitPrice) || 0;
        return sum + quantity * price;
      }, 0),
    [lines],
  );
  const discountNum = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountNum);

  const toggleGarment = (garment: Garment) => {
    setLines(prev => {
      const exists = prev.find(line => line.garmentId === garment.id);
      if (exists) {
        return prev.filter(line => line.garmentId !== garment.id);
      }
      return [
        ...prev,
        {
          garmentId: garment.id,
          garmentName: garment.name,
          quantity: '1',
          unitPrice: priceToInput(garment.defaultPrice),
        },
      ];
    });
  };

  const updateLine = (garmentId: string, patch: Partial<LineDraft>) => {
    setLines(prev =>
      prev.map(line => (line.garmentId === garmentId ? { ...line, ...patch } : line)),
    );
  };

  const addFabricPhoto = async (fromCamera: boolean) => {
    setError(null);
    try {
      const result = fromCamera
        ? await launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false })
        : await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      const uri = result.assets?.[0]?.uri;
      if (result.didCancel || !uri) {
        return;
      }
      setFabricPhotos(prev => [...prev, uri]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('orders.captureFailed'));
    }
  };

  const confirm = async () => {
    if (!customerId) {
      setError(t('orders.selectCustomerError'));
      return;
    }
    if (lines.length === 0) {
      setError(t('orders.addGarmentError'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const advanceAmount = Number(advance) || 0;
      const mark = customerMarkCode(customerId);
      const fabricNote = [fabric.trim(), `Fabric mark #${mark}`].filter(Boolean).join(' · ');

      const order = await deps.orderRepository.create({
        customerId,
        dueDate: String(dueDate ?? '').trim() || null,
        fabricInfo: fabricNote || null,
        color: color.trim() || null,
        instructions: instructions.trim() || null,
        notes: notes.trim() || null,
        discount: discountNum,
        measurementProfileId,
        items: lines.map(line => ({
          garmentId: line.garmentId,
          garmentName: line.garmentName,
          quantity: Math.max(1, Number(line.quantity) || 1),
          unitPrice: Math.max(0, Number(line.unitPrice) || 0),
        })),
        advancePayment:
          advanceAmount > 0
            ? { amount: advanceAmount, method, note: 'Advance' }
            : null,
      });

      for (const uri of fabricPhotos) {
        await deps.designRepository.add({
          orderId: order.id,
          mediaKey: uri,
          caption: `Fabric with mark #${mark}`,
          kind: 'fabric',
        });
      }

      const names: string[] =
        (navigation as { getState?: () => { routeNames?: string[] } }).getState?.()?.routeNames ??
        [];
      if (names.includes('OrderDetail') && typeof navigation.replace === 'function') {
        navigation.replace('OrderDetail', { orderId: order.id });
      } else if (typeof navigation.navigate === 'function') {
        const parent = navigation.getParent?.();
        if (parent && typeof parent.navigate === 'function') {
          parent.navigate('Orders', {
            screen: 'OrderDetail',
            params: { orderId: order.id },
          });
        } else {
          (navigation as { navigate: (name: string, params: object) => void }).navigate(
            'OrderDetail',
            { orderId: order.id },
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('orders.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>{t('orders.new')}</Title>
        <ErrorText message={error} />

        <Text style={styles.section}>{t('orders.selectCustomer')}</Text>
        {!presetCustomerId ? (
          <Field
            label={t('orders.searchList')}
            value={customerQuery}
            onChangeText={setCustomerQuery}
            placeholder={t('orders.searchPlaceholder')}
          />
        ) : null}

        {!presetCustomerId ? (
          <View style={styles.customerList}>
            {customers.length === 0 ? (
              <Subtitle>{t('orders.noCustomersMatch')}</Subtitle>
            ) : (
              customers.slice(0, 20).map(customer => {
                const active = customer.id === customerId;
                const code = customerMarkCode(customer.id);
                return (
                  <Card key={customer.id} onPress={() => setCustomerId(customer.id)}>
                    <View style={styles.customerRow}>
                      {customer.photoKey ? (
                        <Image
                          source={{ uri: customer.photoKey }}
                          style={styles.customerAvatar}
                        />
                      ) : (
                        <View style={styles.customerAvatarFallback}>
                          <Text style={styles.customerAvatarInitial}>
                            {customer.name.trim().charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.customerMeta}>
                        <Text style={[styles.rowTitle, active && styles.activeText]}>
                          {customer.name}
                        </Text>
                        <Subtitle>{customer.phone || 'No phone'}</Subtitle>
                      </View>
                      <View style={[styles.markBadge, active && styles.markBadgeActive]}>
                        <Text style={[styles.markCode, active && styles.markCodeActive]}>
                          #{code}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        ) : null}

        {selectedCustomer ? (
          <Card>
            <View style={styles.customerRow}>
              {selectedCustomer.photoKey ? (
                <Image
                  source={{ uri: selectedCustomer.photoKey }}
                  style={styles.customerAvatar}
                />
              ) : null}
              <View style={styles.customerMeta}>
                <Text style={styles.rowTitle}>{selectedCustomer.name}</Text>
                <Subtitle>{selectedCustomer.phone || 'Selected customer'}</Subtitle>
                <Text style={styles.markHint}>
                  {t('orders.writeOnFabric', { code: markCode ?? '......' })}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <Text style={styles.section}>{t('orders.garments')}</Text>
        <View style={styles.chips}>
          {garments.map(garment => (
            <Chip
              key={garment.id}
              label={garment.name}
              active={lines.some(line => line.garmentId === garment.id)}
              onPress={() => toggleGarment(garment)}
            />
          ))}
        </View>
        {lines.map(line => (
          <Card key={line.garmentId}>
            <Text style={styles.rowTitle}>{line.garmentName}</Text>
            <Field
              label={t('common.quantity')}
              value={line.quantity}
              onChangeText={text => updateLine(line.garmentId, { quantity: text })}
              keyboardType="number-pad"
            />
            <Field
              label={t('orders.unitPrice')}
              value={line.unitPrice}
              onChangeText={text => updateLine(line.garmentId, { unitPrice: text })}
              keyboardType="decimal-pad"
            />
          </Card>
        ))}

        {customerId ? (
          <>
            <Text style={styles.section}>{t('orders.measurementsVerify')}</Text>
            {profiles.length === 0 ? (
              <Subtitle>{t('orders.noProfiles')}</Subtitle>
            ) : (
              <View style={styles.chips}>
                {profiles.map(profile => (
                  <Chip
                    key={profile.id}
                    label={profile.name}
                    active={measurementProfileId === profile.id}
                    onPress={() => setMeasurementProfileId(profile.id)}
                  />
                ))}
              </View>
            )}
            {selectedProfile ? (
              <Card>
                <Text style={styles.rowTitle}>{selectedProfile.name}</Text>
                <Subtitle>
                  {t('orders.unitLabel', { unit: selectedProfile.unit })}
                </Subtitle>
                {selectedProfile.values.length === 0 ? (
                  <Subtitle>{t('orders.noSizeValues')}</Subtitle>
                ) : (
                  selectedProfile.values.map(value => (
                    <View key={value.id} style={styles.sizeRow}>
                      <Text style={styles.sizeLabel}>{value.fieldLabel}</Text>
                      <Text style={styles.sizeValue}>
                        {value.value == null ? '—' : `${value.value} ${value.unit}`}
                      </Text>
                    </View>
                  ))
                )}
                <SecondaryButton
                  label={
                    speaking ? t('speech.stop') : t('speech.listenMeasurements')
                  }
                  onPress={() => void listenToMeasurements()}
                />
              </Card>
            ) : null}
          </>
        ) : null}

        <Text style={styles.section}>{t('orders.fabricPhoto')}</Text>
        <Subtitle>
          {t('orders.fabricPhotoHint', { code: markCode ?? '......' })}
        </Subtitle>
        <SecondaryButton label={t('orders.takeFabricPhoto')} onPress={() => void addFabricPhoto(true)} />
        <SecondaryButton label={t('orders.pickGallery')} onPress={() => void addFabricPhoto(false)} />
        {fabricPhotos.length > 0 ? (
          <ScrollView horizontal style={styles.photoRow} showsHorizontalScrollIndicator={false}>
            {fabricPhotos.map(uri => (
              <Image key={uri} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        ) : null}
        {fabricPhotos.length > 0 ? (
          <SecondaryButton label={t('orders.clearPhotos')} onPress={() => setFabricPhotos([])} />
        ) : null}

        <Field label={t('orders.fabricNotes')} value={fabric} onChangeText={setFabric} />
        <Field label={t('common.color')} value={color} onChangeText={setColor} />
        <Field
          label={t('orders.instructions')}
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />
        <Field label={t('common.notes')} value={notes} onChangeText={setNotes} multiline />
        <Field
          label={t('orders.discount')}
          value={discount}
          onChangeText={setDiscount}
          keyboardType="decimal-pad"
        />
        <DateField
          label={t('orders.dueDate')}
          value={dueDate}
          onChange={setDueDate}
          placeholder={t('orders.dueDatePlaceholder')}
          clearLabel={t('common.clear')}
          doneLabel={t('common.done')}
        />

        <Text style={styles.section}>{t('orders.advance')}</Text>
        <Field
          label={t('common.amount')}
          value={advance}
          onChangeText={setAdvance}
          keyboardType="decimal-pad"
        />
        <View style={styles.chips}>
          {PAYMENT_METHODS.map(paymentMethod => (
            <Chip
              key={paymentMethod}
              label={t(paymentKey(paymentMethod))}
              active={method === paymentMethod}
              onPress={() => setMethod(paymentMethod)}
            />
          ))}
        </View>

        <Card>
          <Subtitle>{t('orders.subtotal')}</Subtitle>
          <Money amount={subtotal} />
          <Subtitle>{t('orders.total')}</Subtitle>
          <Money amount={total} />
        </Card>

        <PrimaryButton
          label={saving ? 'Creating…' : 'Confirm order'}
          onPress={() => void confirm()}
          disabled={saving}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4, color: colors.text },
  activeText: { color: colors.primary },
  customerList: { marginBottom: spacing.sm },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
  },
  customerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  customerMeta: { flex: 1 },
  markBadge: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  markBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  markCode: { fontWeight: '800', letterSpacing: 1, color: colors.text },
  markCodeActive: { color: colors.primaryText },
  markHint: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sizeLabel: { color: colors.text, flex: 1 },
  sizeValue: { fontWeight: '700', color: colors.text },
  photoRow: { marginVertical: spacing.sm },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 10,
    marginRight: spacing.sm,
    backgroundColor: colors.border,
  },
});
