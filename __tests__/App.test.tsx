/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-get-random-values', () => ({}));
jest.mock('uuid', () => ({ v4: () => '00000000-0000-4000-8000-000000000001' }));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});
jest.mock('react-native-reanimated', () => {
  const ReactActual = require('react');
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (c: unknown) => c,
    },
    View,
    FadeInDown: { delay: () => ({ duration: () => ({ springify: () => ({}) }) }) },
    FadeInUp: { delay: () => ({ duration: () => ({}) }) },
    Easing: { out: () => undefined, cubic: undefined },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withSpring: (v: number) => v,
    withTiming: (v: number) => v,
    FadeIn: {},
  };
});

jest.mock('@op-engineering/op-sqlite', () => ({
  open: () => ({
    execute: jest.fn(async (sql: string) => {
      if (String(sql).includes('COUNT(*)')) {
        return { rows: [{ c: 0 }], rowsAffected: 0 };
      }
      return { rows: [], rowsAffected: 0 };
    }),
    transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) =>
      fn({
        execute: jest.fn(async () => ({ rows: [], rowsAffected: 0 })),
        commit: jest.fn(async () => ({ rows: [], rowsAffected: 0 })),
        rollback: jest.fn(() => ({ rows: [], rowsAffected: 0 })),
      }),
    ),
  }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(ReactActual.Fragment, null, children),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactActual.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const ReactActual = require('react');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        ReactActual.createElement(ReactActual.Fragment, null, children),
      Screen: () => null,
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const ReactActual = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        ReactActual.createElement(ReactActual.Fragment, null, children),
      Screen: () => null,
    }),
  };
});

import App from '../App';

test('renders login gate when signed out', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
