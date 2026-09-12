import React, { useRef } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useI18n } from '../../i18n';
import { useDependencies } from '../DependenciesContext';
import type {
  CustomersStackParamList,
  DashboardStackParamList,
  MoreStackParamList,
  OrdersStackParamList,
  RootTabParamList,
} from './types';
import { DashboardScreen } from '../../features/dashboard/DashboardScreen';
import { CustomersScreen } from '../../features/customers/CustomersScreen';
import { CustomerFormScreen } from '../../features/customers/CustomerFormScreen';
import { CustomerDetailScreen } from '../../features/customers/CustomerDetailScreen';
import { MeasurementFormScreen } from '../../features/customers/MeasurementFormScreen';
import { OrdersScreen } from '../../features/orders/OrdersScreen';
import { NewOrderScreen } from '../../features/orders/NewOrderScreen';
import { OrderDetailScreen } from '../../features/orders/OrderDetailScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';
import { BusinessProfileScreen } from '../../features/settings/BusinessProfileScreen';
import { InventoryScreen } from '../../features/inventory/InventoryScreen';
import { StaffScreen } from '../../features/staff/StaffScreen';
import { SearchScreen } from '../../features/search/SearchScreen';
import { TemplatesScreen } from '../../features/catalog/TemplatesScreen';
import { GarmentPricesScreen } from '../../features/catalog/GarmentPricesScreen';
import { ReportsScreen } from '../../features/reports/ReportsScreen';
import { AppIcon, type AppIconName } from '../../shared/icons';

const Tab = createBottomTabNavigator<RootTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const CustomersStack = createNativeStackNavigator<CustomersStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

const stackScreenOptions = {
  animation: 'slide_from_right' as const,
  animationDuration: 280,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  contentStyle: { backgroundColor: colors.background },
};

function DashboardStackNavigator() {
  const { t } = useI18n();
  return (
    <DashboardStack.Navigator screenOptions={stackScreenOptions}>
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: t('nav.home') }}
      />
      <DashboardStack.Screen name="Search" component={SearchScreen} options={{ title: t('nav.search') }} />
      <DashboardStack.Screen
        name="NewOrder"
        component={NewOrderScreen}
        options={{ title: t('nav.newOrder') }}
      />
      <DashboardStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: t('nav.order') }}
      />
      <DashboardStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ title: t('nav.customer') }}
      />
      <DashboardStack.Screen
        name="CustomerForm"
        component={CustomerFormScreen}
        options={{ title: t('nav.customer') }}
      />
    </DashboardStack.Navigator>
  );
}

function CustomersStackNavigator() {
  const { t } = useI18n();
  return (
    <CustomersStack.Navigator screenOptions={stackScreenOptions}>
      <CustomersStack.Screen
        name="CustomersList"
        component={CustomersScreen}
        options={{ title: t('nav.customers') }}
      />
      <CustomersStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ title: t('nav.customer') }}
      />
      <CustomersStack.Screen
        name="CustomerForm"
        component={CustomerFormScreen}
        options={{ title: t('nav.customer') }}
      />
      <CustomersStack.Screen
        name="MeasurementForm"
        component={MeasurementFormScreen}
        options={{ title: t('nav.measurement') }}
      />
      <CustomersStack.Screen
        name="NewOrder"
        component={NewOrderScreen}
        options={{ title: t('nav.newOrder') }}
      />
      <CustomersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: t('nav.order') }}
      />
    </CustomersStack.Navigator>
  );
}

function OrdersStackNavigator() {
  const { t } = useI18n();
  return (
    <OrdersStack.Navigator screenOptions={stackScreenOptions}>
      <OrdersStack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: t('nav.orders') }}
      />
      <OrdersStack.Screen
        name="NewOrder"
        component={NewOrderScreen}
        options={{ title: t('nav.newOrder') }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: t('nav.order') }}
      />
    </OrdersStack.Navigator>
  );
}

function MoreStackNavigator() {
  const { t } = useI18n();
  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions}>
      <MoreStack.Screen
        name="MoreHome"
        component={SettingsScreen}
        options={{ title: t('nav.more') }}
      />
      <MoreStack.Screen
        name="BusinessProfile"
        component={BusinessProfileScreen}
        options={{ title: t('nav.businessProfile') }}
      />
      <MoreStack.Screen
        name="GarmentPrices"
        component={GarmentPricesScreen}
        options={{ title: t('nav.garmentPrices') }}
      />
      <MoreStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: t('nav.reports') }}
      />
      <MoreStack.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{ title: t('nav.templates') }}
      />
      <MoreStack.Screen name="Inventory" component={InventoryScreen} options={{ title: t('nav.inventory') }} />
      <MoreStack.Screen name="Staff" component={StaffScreen} options={{ title: t('nav.staff') }} />
      <MoreStack.Screen name="Search" component={SearchScreen} options={{ title: t('nav.search') }} />
      <MoreStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ title: t('nav.customer') }}
      />
      <MoreStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: t('nav.order') }}
      />
    </MoreStack.Navigator>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 12 }}>
      {label}
    </Text>
  );
}

function tabIcon(name: AppIconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <AppIcon name={name} color={color} size={size} />
  );
}

export function RootNavigator() {
  const { analytics } = useDependencies();
  const { t, isRTL } = useI18n();
  const routeNameRef = useRef<string | undefined>(undefined);

  return (
    <NavigationContainer
      direction={isRTL ? 'rtl' : 'ltr'}
      onReady={() => {
        // first screen logged on state change
      }}
      onStateChange={async state => {
        const getActive = (s?: typeof state): string | undefined => {
          if (!s) return undefined;
          const route = s.routes[s.index ?? 0];
          if (route.state) {
            return getActive(route.state as typeof state);
          }
          return route.name;
        };
        const current = getActive(state);
        if (current && current !== routeNameRef.current) {
          routeNameRef.current = current;
          await analytics.screenView(current);
        }
      }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}>
        <Tab.Screen
          name="Home"
          component={DashboardStackNavigator}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label={t('nav.home')} focused={focused} />,
            tabBarIcon: tabIcon('home'),
          }}
        />
        <Tab.Screen
          name="Customers"
          component={CustomersStackNavigator}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label={t('nav.customers')} focused={focused} />,
            tabBarIcon: tabIcon('customers'),
          }}
        />
        <Tab.Screen
          name="Orders"
          component={OrdersStackNavigator}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label={t('nav.orders')} focused={focused} />,
            tabBarIcon: tabIcon('orders'),
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreStackNavigator}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label={t('nav.more')} focused={focused} />,
            tabBarIcon: tabIcon('more'),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
