import React from 'react';
import { Badge, Text } from 'native-base';

/**
 * 指标徽章：用于突出展示“方差/均值/评分”等关键数字
 *
 * 设计意图：
 * - 活泼但不喧闹：用浅色底 + 深色字，保证信息层级清晰
 */
export function MetricBadge(props: { label: string; value: string; tone?: 'primary' | 'secondary' | 'neutral' }) {
  const scheme = props.tone ?? 'neutral';
  return (
    <Badge
      borderRadius="2xl"
      px={3}
      py={1}
      bg={
        scheme === 'primary'
          ? 'primary.100'
          : scheme === 'secondary'
            ? 'secondary.100'
            : 'gray.100'
      }
    >
      <Text fontWeight="bold" color={scheme === 'primary' ? 'primary.800' : scheme === 'secondary' ? 'secondary.800' : 'gray.800'}>
        {props.label}{' '}
        <Text fontWeight="semibold">{props.value}</Text>
      </Text>
    </Badge>
  );
}
