import React from 'react';
import Card, { CardProps } from './Card';

export type SurfaceCardProps = CardProps;

export default function SurfaceCard(props: SurfaceCardProps) {
  return <Card {...props} />;
}
