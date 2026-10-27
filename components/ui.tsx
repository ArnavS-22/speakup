import { APP_NAME } from '@/config';
import { getAiSource } from '@/lib/ai';
import { AuthorityLevel } from '@/lib/types';
import { motionMs, radius, screenPad, space, tapTarget, type as typeScale } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';
import React from 'react';
import {
  AccessibilityRole,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type Variant = 'title' | 'body' | 'label' | 'display';

export function AppText({
  variant = 'body',
  color,
  style,
  uppercase,
  ...rest
}: TextProps & { variant?: Variant; color?: string; uppercase?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      allowFontScaling
      style={[
        typeScale[variant],
        { color: color ?? (variant === 'label' ? colors.secondary : colors.text) },
        uppercase && { textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}

export function Screen({ children, style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      {...rest}
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingLeft: screenPad,
          paddingRight: screenPad,
          paddingTop: Math.max(insets.top, space),
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Hairline({ style }: { style?: ViewProps['style'] }) {
  const { colors } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline }, style]} />;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: tapTarget,
        justifyContent: 'center',
        paddingHorizontal: space * 2,
        backgroundColor: colors.text,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <AppText variant="body" color={colors.inverted} style={{ fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: tapTarget,
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <AppText color={colors.text}>{label}</AppText>
    </Pressable>
  );
}

export function OutlinedButton({
  label,
  onPress,
  selected,
  accessibilityRole = 'button',
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: tapTarget,
        paddingHorizontal: space * 1.5,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: selected ? colors.text : colors.hairline,
        borderRadius: 999,
        marginRight: space,
        marginBottom: space,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppText variant="label" color={selected ? colors.text : colors.secondary} uppercase>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline,
  focused,
  onFocus,
  onBlur,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.secondary}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      onFocus={onFocus}
      onBlur={onBlur}
      accessibilityLabel={accessibilityLabel}
      allowFontScaling
      style={[
        typeScale.body,
        {
          color: colors.text,
          borderWidth: 1,
          borderColor: focused ? colors.text : colors.hairline,
          padding: space * 1.5,
          minHeight: multiline ? 160 : tapTarget,
          borderRadius: radius,
        },
      ]}
    />
  );
}

export function AuthorityBadge({ level }: { level: AuthorityLevel }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dot =
    level === 'can_act' ? colors.canAct : level === 'can_listen' ? colors.canListen : colors.betterContact;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space }}>
      <View
        accessibilityLabel={t(`authority.${level}`)}
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }}
      />
      <AppText variant="label" uppercase>
        {t(`authority.${level}`)}
      </AppText>
    </View>
  );
}

export function DemoPill() {
  const { t } = useTranslation();
  const source = getAiSource();
  if (source !== 'demo') return null;
  return (
    <AppText variant="label" uppercase>
      {t('common.demoMode')}
    </AppText>
  );
}

export function FlowProgress({ step }: { step: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const steps = ['understand', 'questions', 'route', 'draft', 'practice', 'meeting'] as const;
  return (
    <View style={{ marginBottom: space * 2 }}>
      <AppText variant="label" uppercase>
        {`${APP_NAME}  ${step + 1}/6  ${t(`flow.${steps[step]}`)}`}
      </AppText>
      <View style={{ flexDirection: 'row', marginTop: space, gap: 4 }}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 1,
              backgroundColor: i <= step ? colors.text : colors.hairline,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function Row({
  onPress,
  children,
  accessibilityLabel,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const Inner = (
    <View style={{ paddingVertical: space * 2 }}>{children}</View>
  );
  if (!onPress) return Inner;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {Inner}
    </Pressable>
  );
}

export const fade = { duration: motionMs };
