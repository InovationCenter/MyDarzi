import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../app/AuthContext';
import { useDependencies } from '../../app/DependenciesContext';
import type { MoreStackParamList } from '../../app/navigation/types';
import { appConfig } from '../../config/appConfig';
import { colors, spacing } from '../../app/theme';
import { useI18n } from '../../i18n';
import {
  Card,
  Chip,
  ErrorText,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '../../shared/ui';
import { FadeInView } from '../../shared/motion';
import { AppIcon, type AppIconName } from '../../shared/icons';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const { businessRepository } = useDependencies();
  const { t, language, setLanguage } = useI18n();
  const [shopName, setShopName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [languageNote, setLanguageNote] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      void (async () => {
        try {
          const profile = await businessRepository.get();
          setShopName(profile?.name ?? null);
        } catch {
          setShopName(null);
        }
      })();
    }, [businessRepository]),
  );

  const links: {
    title: string;
    subtitle: string;
    route: keyof MoreStackParamList;
    icon: AppIconName;
  }[] = [
    {
      title: t('more.businessProfile'),
      subtitle: t('more.businessProfileSub'),
      route: 'BusinessProfile',
      icon: 'business',
    },
    {
      title: t('more.garmentPrices'),
      subtitle: t('more.garmentPricesSub'),
      route: 'GarmentPrices',
      icon: 'tag',
    },
    {
      title: t('more.reports'),
      subtitle: t('more.reportsSub'),
      route: 'Reports',
      icon: 'chart',
    },
    {
      title: t('more.templates'),
      subtitle: t('more.templatesSub'),
      route: 'Templates',
      icon: 'ruler',
    },
    {
      title: t('more.inventory'),
      subtitle: t('more.inventorySub'),
      route: 'Inventory',
      icon: 'inventory',
    },
    {
      title: t('more.staff'),
      subtitle: t('more.staffSub'),
      route: 'Staff',
      icon: 'staff',
    },
    {
      title: t('more.search'),
      subtitle: t('more.searchSub'),
      route: 'Search',
      icon: 'search',
    },
  ];

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Title>{t('more.title')}</Title>
          <Subtitle>{shopName || t('more.subtitle')}</Subtitle>
        </FadeInView>

        <FadeInView delay={60}>
          <Card>
            <Text style={styles.linkTitle}>
              {shopName || user?.displayName || t('common.signedIn')}
            </Text>
            <Subtitle>{user?.email}</Subtitle>
            {shopName ? <Subtitle>{t('more.brand', { name: shopName })}</Subtitle> : null}
            <Subtitle>
              Auth: {user?.provider}
              {appConfig.authProvider === 'local' ? t('more.authLocal') : ''}
              {' · '}
              Analytics:{' '}
              {appConfig.analyticsEnabled ? t('more.analyticsOn') : t('more.analyticsOff')}
            </Subtitle>
          </Card>
        </FadeInView>

        <FadeInView delay={90}>
          <Card>
            <Text style={styles.linkTitle}>{t('language.title')}</Text>
            <Subtitle>{t('language.subtitle')}</Subtitle>
            <View style={styles.langRow}>
              <Chip
                label={t('language.english')}
                active={language === 'en'}
                onPress={() => {
                  void (async () => {
                    setLanguageNote(t('language.changed'));
                    await setLanguage('en');
                  })();
                }}
              />
              <Chip
                label={t('language.urdu')}
                active={language === 'ur'}
                onPress={() => {
                  void (async () => {
                    setLanguageNote(t('language.applyingRtl'));
                    await setLanguage('ur');
                  })();
                }}
              />
            </View>
            {languageNote ? <Subtitle>{languageNote}</Subtitle> : null}
          </Card>
        </FadeInView>

        {links.map((link, index) => (
          <FadeInView key={link.route} delay={120 + index * 40}>
            <Card onPress={() => navigation.navigate(link.route as never)}>
              <View style={styles.linkRow}>
                <View style={styles.iconWrap}>
                  <AppIcon name={link.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Subtitle>{link.subtitle}</Subtitle>
                </View>
              </View>
            </Card>
          </FadeInView>
        ))}

        <ErrorText message={error} />
        <FadeInView delay={360}>
          <SecondaryButton
            label={busy ? t('common.signingOut') : t('common.signOut')}
            danger
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                await signOut();
              } catch (e) {
                setError(e instanceof Error ? e.message : t('more.signOutFailed'));
              } finally {
                setBusy(false);
              }
            }}
          />
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
