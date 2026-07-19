import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, type Theme } from '../../lib/theme/theme';

export function Screen({
  children,
  scroll = false,
  refreshControl,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement;
  padded?: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  const style: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: padded ? theme.spacing(4) : 0,
  };
  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ padding: padded ? theme.spacing(4) : 0, gap: theme.spacing(3) }}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={style} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

export function AppText({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  variant?: 'title' | 'heading' | 'subtitle' | 'body' | 'caption' | 'label';
  color?: string;
  style?: object;
  numberOfLines?: number;
}): React.JSX.Element {
  const theme = useTheme();
  const variants: Record<string, object> = {
    title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
    heading: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    subtitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    body: { fontSize: 15, fontWeight: '400', color: theme.colors.text },
    caption: { fontSize: 13, fontWeight: '400', color: theme.colors.textMuted },
    label: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  };
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[variants[variant], color ? { color } : null, style]}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}): React.JSX.Element {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing(4),
    gap: theme.spacing(2),
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, pressed ? { opacity: 0.7 } : null, style]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  const bg: Record<string, string> = {
    primary: theme.colors.primary,
    secondary: theme.colors.surfaceAlt,
    ghost: 'transparent',
    danger: theme.colors.danger,
  };
  const fg: Record<string, string> = {
    primary: theme.colors.primaryText,
    secondary: theme.colors.text,
    ghost: theme.colors.primary,
    danger: '#FFFFFF',
  };
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg[variant],
          paddingVertical: theme.spacing(3.5),
          paddingHorizontal: theme.spacing(4),
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.border,
          minHeight: 48,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <Text style={{ color: fg[variant], fontWeight: '700', fontSize: 15 }}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing(1.5) }}>
      <Text style={{ color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing(3.5),
          paddingVertical: theme.spacing(3),
          color: theme.colors.text,
          fontSize: 15,
          minHeight: 48,
        }}
        {...props}
      />
      {error ? (
        <Text style={{ color: theme.colors.danger, fontSize: 12 }}>{error}</Text>
      ) : null}
    </View>
  );
}

export function Badge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}): React.JSX.Element {
  const theme = useTheme();
  const tones: Record<string, string> = {
    default: theme.colors.textMuted,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    primary: theme.colors.primary,
  };
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: `${tones[tone]}22`,
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing(2),
        paddingVertical: theme.spacing(1),
      }}
    >
      <Text style={{ color: tones[tone], fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <AppText variant="caption" style={{ marginTop: theme.spacing(3) }}>
        {label}
      </AppText>
    </View>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <AppText variant="subtitle">{title}</AppText>
      {message ? (
        <AppText variant="caption" style={{ marginTop: theme.spacing(2), textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <AppText variant="subtitle" color={theme.colors.danger}>
        Something went wrong
      </AppText>
      <AppText variant="caption" style={{ marginTop: theme.spacing(2), textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? (
        <View style={{ marginTop: theme.spacing(4), alignSelf: 'stretch' }}>
          <Button title="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function Row({
  children,
  gap = 2,
  align = 'center',
  justify = 'flex-start',
}: {
  children: React.ReactNode;
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: align,
        justifyContent: justify,
        gap: theme.spacing(gap),
      }}
    >
      {children}
    </View>
  );
}

export function StatTile({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}): React.JSX.Element {
  const theme = useTheme();
  const tones: Record<string, string> = {
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  };
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <AppText variant="label">{label}</AppText>
      <Text style={{ fontSize: 26, fontWeight: '800', color: tones[tone] }}>{value}</Text>
    </Card>
  );
}

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(6),
    },
  });
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
