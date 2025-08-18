import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  style,
}: CardProps) {
  const cardStyle = [styles.base, styles[variant], styles[padding], style];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  default: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  outlined: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  sm: {
    padding: 12,
  },
  md: {
    padding: 16,
  },
  lg: {
    padding: 24,
  },
});
