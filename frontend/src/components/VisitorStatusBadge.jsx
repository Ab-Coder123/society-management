import React from 'react';
import Badge from './Badge';

export default function VisitorStatusBadge({ status, style }) {
  return <Badge type="visitor" status={status} style={style} />;
}
