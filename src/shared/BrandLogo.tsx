import React from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

const logo = require('../assets/branding/logo-256.png');

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function BrandLogo({ size = 88, style, imageStyle }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.22 }, style]}>
      <Image
        source={logo}
        style={[{ width: size, height: size, borderRadius: size * 0.22 }, imageStyle]}
        resizeMode="cover"
        accessibilityLabel="MyDarzi"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignSelf: 'flex-start',
    backgroundColor: '#0F766E',
  },
});
