import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'native-base';

/**
 * 主按钮（Figma Make：深色胶囊按钮）
 */
export function GradientPrimaryButton(props: {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.isDisabled}
      style={({ pressed }) => [
        styles.wrap,
        props.isDisabled ? { opacity: 0.55 } : null,
        pressed && !props.isDisabled ? styles.pressed : null,
      ]}
    >
      <Text fontWeight="bold" color="white" fontSize={16}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 26,
    backgroundColor: '#2A2A2A',
    height: 52,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    width: 208,
    shadowColor: '#2A2A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});

