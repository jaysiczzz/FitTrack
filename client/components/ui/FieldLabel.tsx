import React from 'react';
import { Text, TextProps } from 'react-native';

export interface FieldLabelProps extends TextProps {
  children?: React.ReactNode;
  className?: string;
}

export default function FieldLabel({
  children,
  className = '',
  ...props
}: FieldLabelProps) {
  if (!children) return null;

  return (
    <Text
      className={`text-text-muted dark:text-text-muted-dark mb-1.5 text-[11px] tracking-wider uppercase font-bold ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}
