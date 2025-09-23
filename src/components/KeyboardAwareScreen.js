import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KeyboardAwareScreen({
  children,
  contentContainerStyle,
  style,
  keyboardVerticalOffset,
  scroll = true,
}) {
  const insets = useSafeAreaInsets();
  const behavior = Platform.OS === 'ios' ? 'padding' : 'height';

  const Container = (
    <View
      style={[
        styles.wrapper,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset || 0}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {Container}
        </ScrollView>
      ) : (
        Container
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrapper: { flex: 1 },
  contentContainer: { flexGrow: 1 },
});
