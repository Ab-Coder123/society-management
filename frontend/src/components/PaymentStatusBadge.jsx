import React from 'react';
import Badge from './Badge';

export default function PaymentStatusBadge({ status, style }) {
  return <Badge type="payment" status={status} style={style} />;
}
