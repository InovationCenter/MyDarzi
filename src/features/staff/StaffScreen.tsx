import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import { spacing } from '../../app/theme';
import { STAFF_ROLES, type StaffRole } from '../../domain/constants';
import type { StaffMember } from '../../domain/types/models';
import {
  Card,
  Chip,
  EmptyState,
  ErrorText,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '../../shared/ui';

export function StaffScreen() {
  const { staffRepository } = useDependencies();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('stitcher');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStaff(await staffRepository.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [staffRepository]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      await staffRepository.create({
        name,
        role,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      setName('');
      setPhone('');
      setNotes('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add staff');
    } finally {
      setBusy(false);
    }
  };

  const archive = (id: string, memberName: string) => {
    Alert.alert('Archive staff?', `Remove ${memberName} from the active list.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await staffRepository.archive(id);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Archive failed');
            }
          })();
        },
      },
    ]);
  };

  if (loading && staff.length === 0) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>Staff</Title>
        <ErrorText message={error} />

        <Text style={styles.section}>Add staff</Text>
        <Field label="Name" value={name} onChangeText={setName} />
        <View style={styles.chips}>
          {STAFF_ROLES.map(r => (
            <Chip key={r} label={r} active={role === r} onPress={() => setRole(r)} />
          ))}
        </View>
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Notes" value={notes} onChangeText={setNotes} />
        <PrimaryButton
          label={busy ? 'Working…' : 'Add staff'}
          onPress={() => void add()}
          disabled={busy}
        />

        <Text style={styles.section}>Team</Text>
        {staff.length === 0 ? <EmptyState message="No staff records." /> : null}
        {staff.map(member => (
          <Card key={member.id}>
            <Text style={styles.rowTitle}>{member.name}</Text>
            <Subtitle>
              {member.role}
              {member.phone ? ` · ${member.phone}` : ''}
            </Subtitle>
            <SecondaryButton
              label="Archive"
              danger
              onPress={() => archive(member.id, member.name)}
            />
          </Card>
        ))}
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
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
});
