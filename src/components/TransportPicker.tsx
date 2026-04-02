import React from 'react';
import { Box, Button, HStack, Text, VStack } from 'native-base';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TransportMode } from '../types';

/**
 * 交通：驾车 / 公共交通 / 步行 + 骑车（电动车 / 自行车）
 */
export function TransportPicker(props: {
  value: TransportMode;
  onChange: (next: TransportMode) => void;
}) {
  const isBike = props.value === 'ebike' || props.value === 'bike';
  const [bikeExpanded, setBikeExpanded] = React.useState(isBike);

  React.useEffect(() => {
    if (isBike) setBikeExpanded(true);
  }, [isBike]);

  const selectStyle = (selected: boolean) =>
    selected
      ? {
          bg: '#2A2A2A',
          borderColor: '#2A2A2A',
          _text: { color: '#FFFFFF', fontWeight: '500' as const },
        }
      : {
          bg: '#FFFFFF',
          borderWidth: 0,
          _text: { color: '#4A4A4A' },
        };

  return (
    <VStack space={2} alignItems="stretch">
      <HStack space={2} flexWrap="wrap">
        <Button
          size="sm"
          borderRadius="2xl"
          variant={props.value === 'car' ? 'solid' : 'outline'}
          shadow={props.value === 'car' ? 0 : 1}
          {...selectStyle(props.value === 'car')}
          onPress={() => props.onChange('car')}
          leftIcon={modeIcon('car', '#FFFFFF', props.value !== 'car')}
        >
          驾车
        </Button>
        <Button
          size="sm"
          borderRadius="2xl"
          variant={props.value === 'bus' ? 'solid' : 'outline'}
          shadow={props.value === 'bus' ? 0 : 1}
          {...selectStyle(props.value === 'bus')}
          onPress={() => props.onChange('bus')}
          leftIcon={modeIcon('bus', '#FFFFFF', props.value !== 'bus')}
        >
          公共交通
        </Button>
        <Button
          size="sm"
          borderRadius="2xl"
          variant={props.value === 'walk' ? 'solid' : 'outline'}
          shadow={props.value === 'walk' ? 0 : 1}
          {...selectStyle(props.value === 'walk')}
          onPress={() => props.onChange('walk')}
          leftIcon={modeIcon('walk', '#FFFFFF', props.value !== 'walk')}
        >
          步行
        </Button>
      </HStack>

      <HStack alignItems="center" space={2}>
        <Button
          size="sm"
          borderRadius="2xl"
          variant={isBike ? 'solid' : 'outline'}
          shadow={isBike ? 0 : 1}
          {...selectStyle(isBike)}
          onPress={() => {
            setBikeExpanded((v) => !v);
            if (!isBike) props.onChange('bike');
          }}
          leftIcon={modeIcon('bike', '#FFFFFF', !isBike)}
        >
          {bikeExpanded ? '骑车 <' : '骑车 >'}
        </Button>
        {bikeExpanded ? (
          <HStack alignItems="center" space={2}>
            <Box w="1px" h={6} bg="rgba(0,0,0,0.1)" />
            <Button
              size="sm"
              borderRadius="2xl"
              variant={props.value === 'bike' ? 'solid' : 'outline'}
              shadow={props.value === 'bike' ? 0 : 1}
              {...selectStyle(props.value === 'bike')}
              onPress={() => props.onChange('bike')}
              leftIcon={modeIcon('bike', '#FFFFFF', props.value !== 'bike')}
            >
              自行车
            </Button>
            <Button
              size="sm"
              borderRadius="2xl"
              variant={props.value === 'ebike' ? 'solid' : 'outline'}
              shadow={props.value === 'ebike' ? 0 : 1}
              {...selectStyle(props.value === 'ebike')}
              onPress={() => props.onChange('ebike')}
              leftIcon={modeIcon('ebike', '#FFFFFF', props.value !== 'ebike')}
            >
              电动车
            </Button>
          </HStack>
        ) : null}
      </HStack>
    </VStack>
  );
}

function modeIcon(mode: TransportMode, activeColor = '#FFFFFF', normal = false) {
  const c = normal ? '#4A4A4A' : activeColor;
  if (mode === 'car') return <Ionicons name="car-outline" size={16} color={c} />;
  if (mode === 'bus') return <Ionicons name="bus-outline" size={16} color={c} />;
  if (mode === 'walk') return <MaterialCommunityIcons name="shoe-print" size={16} color={c} />;
  if (mode === 'bike') return <Ionicons name="bicycle-outline" size={16} color={c} />;
  return <MaterialCommunityIcons name="lightning-bolt-outline" size={16} color={c} />;
}

/** 折叠态展示用 */
export function transportDisplayIcon(mode: TransportMode): React.ReactNode {
  switch (mode) {
    case 'car':
      return modeIcon('car', '#3B82F6');
    case 'bus':
      return modeIcon('bus', '#23C552');
    case 'walk':
      return modeIcon('walk', '#A855F7');
    case 'ebike':
      return modeIcon('ebike', '#EAB308');
    case 'bike':
      return modeIcon('bike', '#EAB308');
    default: {
      const _e: never = mode;
      return _e;
    }
  }
}
