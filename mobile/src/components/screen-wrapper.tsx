/**
 * ScreenWrapper
 *
 * Wraps every tab screen's root element to:
 *  - Add paddingTop equal to the navbar height on web (NativeTabs renders a
 *    fixed top bar on web that otherwise overlaps content)
 *  - Cap content width at MaxContentWidth and center it for wide desktop viewports
 *  - Fill the available height
 *
 * Usage:
 *   Replace the root <ScrollView> or <View> style prop with:
 *     style={[styles.root, screenWrapperStyle]}
 *   Or wrap the whole screen:
 *     <ScreenWrapper><ScrollView>...</ScrollView></ScreenWrapper>
 */

import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { MaxContentWidth, NAV_HEIGHT } from '@/constants/theme';

export function ScreenWrapper({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[s.outer, style]} {...rest}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    flex: 1,
    paddingTop: NAV_HEIGHT,
    // Center content on wide desktop screens
    ...(Platform.OS === 'web'
      ? {
          alignSelf: 'center' as const,
          width: '100%',
          maxWidth: MaxContentWidth,
        }
      : {}),
  },
});
