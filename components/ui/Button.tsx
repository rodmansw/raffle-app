import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[size],
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const textStyleArray = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [buttonStyle, pressed && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator
          color={styles[`${variant}Text`]?.color || "#ffffff"}
          size="small"
        />
      ) : (
        <Text style={textStyleArray}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  primary: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  secondary: {
    backgroundColor: "#0284c7",
    borderColor: "#0284c7",
  },
  destructive: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: "#d1d5db",
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontWeight: "600",
  },
  smText: {
    fontSize: 14,
    fontWeight: "500",
  },
  mdText: {
    fontSize: 16,
    fontWeight: "600",
  },
  lgText: {
    fontSize: 18,
    fontWeight: "600",
  },
  primaryText: {
    color: "#ffffff",
  },
  secondaryText: {
    color: "#ffffff",
  },
  destructiveText: {
    color: "#ffffff",
  },
  outlineText: {
    color: "#374151",
  },
  ghostText: {
    color: "#16a34a",
  },
  disabledText: {
    color: "#9ca3af",
  },
});
