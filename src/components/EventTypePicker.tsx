import React from 'react';
import { Button, HStack } from 'native-base';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { EventType } from '../types';

/**
 * 约会类型：仅展示选项按钮（无说明文案），图标 + 文字同一行
 */
export function EventTypePicker(props: { value: EventType; onChange: (next: EventType) => void }) {
  const items: { key: EventType; label: string; icon: React.ReactNode }[] = [
    {
      key: 'food',
      label: '美食',
      icon: <MaterialCommunityIcons name="silverware-fork-knife" size={17} color="#F97316" />,
    },
    {
      key: 'shopping',
      label: '商城购物',
      icon: <MaterialCommunityIcons name="shopping-outline" size={17} color="#EC4899" />,
    },
    {
      key: 'movie',
      label: '电影',
      icon: <MaterialCommunityIcons name="filmstrip-box-multiple" size={17} color="#A855F7" />,
    },
    {
      key: 'leisure',
      label: '休闲玩乐',
      icon: <Ionicons name="game-controller-outline" size={17} color="#3B82F6" />,
    },
    {
      key: 'sightseeing',
      label: '景点',
      icon: <Ionicons name="location-outline" size={17} color="#22C55E" />,
    },
  ];

  const firstRow = items.slice(0, 3);
  const secondRow = items.slice(3);

  const renderItem = (it: { key: EventType; label: string; icon: React.ReactNode }) => {
        const selected = props.value === it.key;
        return (
          <Button
            key={it.key}
            size="sm"
            borderRadius="2xl"
            variant={selected ? 'solid' : 'unstyled'}
            bg={selected ? '#2A2A2A' : 'white'}
            borderWidth={selected ? 1 : 0}
            borderColor={selected ? '#2A2A2A' : undefined}
            _text={{
              color: selected ? '#FFFFFF' : '#4A4A4A',
              fontSize: 14,
              fontWeight: '500',
            }}
            shadow={selected ? 0 : 1}
            onPress={() => props.onChange(it.key)}
            leftIcon={it.icon}
          >
            {it.label}
          </Button>
        );
      };

  return (
    <>
      <HStack space={2} flexWrap="nowrap">
        {firstRow.map(renderItem)}
      </HStack>
      <HStack space={2} mt={2} flexWrap="nowrap">
        {secondRow.map(renderItem)}
      </HStack>
    </>
  );
}
