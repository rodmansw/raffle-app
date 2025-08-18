import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
}

export function Badge({ label, variant = "default", size = "md" }: BadgeProps) {
  const badgeStyle = [styles.base, styles[size], styles[variant]];

  const textStyle = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  default: {
    backgroundColor: "#f3f4f6",
  },
  success: {
    backgroundColor: "#dcfce7",
  },
  warning: {
    backgroundColor: "#fef3c7",
  },
  error: {
    backgroundColor: "#fee2e2",
  },
  info: {
    backgroundColor: "#dbeafe",
  },
  text: {
    fontWeight: "600",
  },
  smText: {
    fontSize: 12,
    fontWeight: "500",
  },
  mdText: {
    fontSize: 14,
    fontWeight: "600",
  },
  defaultText: {
    color: "#374151",
  },
  successText: {
    color: "#166534",
  },
  warningText: {
    color: "#92400e",
  },
  errorText: {
    color: "#991b1b",
  },
  infoText: {
    color: "#1e40af",
  },
});
