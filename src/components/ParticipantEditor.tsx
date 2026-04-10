import React from 'react';
import { Alert, Platform, StyleSheet, TextInput } from 'react-native';
import { Box, Button, FormControl, HStack, Text, VStack } from 'native-base';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMeetWe } from '../context/MeetWeContext';
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from '../state/meetweSession';
import { TransportPicker, transportDisplayIcon } from './TransportPicker';
import { GlassCard } from './GlassCard';
import { searchPoiByText } from '../services/amapClient';

type InputSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  coordinate: { lat: number; lng: number };
  cityCode?: string;
  adCode?: string;
};

function formatSuggestionSubtitle(cityName?: string, districtName?: string, address?: string) {
  const city = (cityName ?? '').trim();
  const district = (districtName ?? '').trim();
  const detail = (address ?? '').trim();
  const region = `${city}${district}`.trim();
  if (region && detail) return `${region}·${detail}`;
  if (region) return region;
  if (detail) return detail;
  return '地址信息暂缺';
}

function alertLocationRequired() {
  const message = '位置为必填项，请先填写位置。';
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert(message);
  }
}

/** Native Base `variant="outline"` 默认 hover/pressed 会叠半透明灰底；参与者卡片按钮保持透明 */
const PARTICIPANT_OUTLINE_BTN_NO_GREY = {
  bg: 'transparent',
  _hover: { bg: 'transparent' },
  _pressed: { bg: 'transparent' },
  _focus: { bg: 'transparent' },
} as const;

/** 折叠卡片展示用：仅保留「·」前的简短名称（与完整地址区分） */
function collapsedLocationTitle(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  const dot = t.indexOf('·');
  if (dot === -1) return t;
  return t.slice(0, dot).trim();
}

function parseLocationToLatLng(location?: string): { lat: number; lng: number } | null {
  if (!location) return null;
  const [lonS, latS] = location.split(',');
  const lon = Number.parseFloat((lonS ?? '').trim());
  const lat = Number.parseFloat((latS ?? '').trim());
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return { lat, lng: lon };
}

/**
 * 参与者编辑器：2~6 人；确认后折叠为「编号 + 昵称 + 交通图标」
 */
export function ParticipantEditor() {
  const { session, updateParticipant, addParticipant, removeParticipant } = useMeetWe();
  const [suggestionsByParticipant, setSuggestionsByParticipant] = React.useState<Record<string, InputSuggestion[]>>({});
  const debounceTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setSuggestions = React.useCallback((participantId: string, list: InputSuggestion[]) => {
    setSuggestionsByParticipant((prev) => ({ ...prev, [participantId]: list }));
  }, []);

  const fetchSuggestions = React.useCallback(
    async (participantId: string, keyword: string) => {
      const text = keyword.trim();
      if (text.length < 2) {
        setSuggestions(participantId, []);
        return;
      }

      try {
        const resp = await searchPoiByText(text, undefined, undefined, {
          timeoutMs: 5000,
          retryTimes: 0,
        });
        const list: InputSuggestion[] = [];
        (resp.pois ?? [])
          .slice(0, 6)
          .forEach((p, idx) => {
            const coordinate = parseLocationToLatLng(p.location);
            if (!coordinate) return;
            const name = (p.name ?? '').trim();
            const addr = (p.address ?? '').trim();
            const title = name || text;
            const subtitle = formatSuggestionSubtitle(p.cityname, p.adname, addr);
            const label = [title, addr].filter(Boolean).join(' · ') || text;
            list.push({
              id: p.id ?? `${participantId}_${idx}_${name}`,
              title,
              subtitle,
              label,
              coordinate,
              cityCode: p.citycode,
              adCode: p.adcode,
            });
          });
        setSuggestions(participantId, list);
      } catch {
        setSuggestions(participantId, []);
      }
    },
    [setSuggestions]
  );

  const onAddressTextChange = React.useCallback(
    (participantId: string, value: string) => {
      updateParticipant(participantId, {
        addressText: value,
        selectedCoordinate: undefined,
        selectedCityCode: undefined,
        selectedAdCode: undefined,
      });

      const t = debounceTimers.current[participantId];
      if (t) clearTimeout(t);
      debounceTimers.current[participantId] = setTimeout(() => {
        void fetchSuggestions(participantId, value);
      }, 300);
    },
    [fetchSuggestions, updateParticipant]
  );

  return (
    <VStack space={4}>
      <Box>
        <Text fontSize="xl" fontWeight="bold" color="#1A1A1A">
          谁去
        </Text>
        <Text mt={1} color="#666666" fontSize="xs">
          最多可添加6人
        </Text>
      </Box>

      <VStack space={2.5}>
        {session.participants.map((p, idx) => (
          <GlassCard key={p.id} px={6} py={p.collapsed ? 3 : 6}>
          {p.collapsed ? (
            <HStack justifyContent="space-between" alignItems="flex-start">
              <HStack flex={1} minW={0} alignItems="stretch" pr={1} space={5}>
                <HStack space={5} alignItems="stretch">
                  <Text alignSelf="center" fontSize="xl" fontWeight="bold" color="#1A1A1A">
                    {idx + 1}
                  </Text>
                  <Box w="1px" bg="#E2E8F0" alignSelf="stretch" my={2} />
                </HStack>
                <VStack flex={1} minW={0} space={3} alignItems="stretch">
                  <HStack space={2} alignItems="center" flexShrink={1} flexWrap="wrap">
                    <Text fontSize="md" color="#1A1A1A" fontWeight="medium" numberOfLines={1} flexShrink={1}>
                      {p.displayName?.trim() || `参与者${idx + 1}`}
                    </Text>
                    <Box ml={0.5}>{transportDisplayIcon(p.transport)}</Box>
                  </HStack>
                  <HStack space={1} alignItems="flex-start" minW={0}>
                    <Box pt={0.5}>
                      <MaterialCommunityIcons name="map-marker" size={18} color="#2563EB" />
                    </Box>
                    <Text
                      flex={1}
                      flexShrink={1}
                      fontSize="sm"
                      color={collapsedLocationTitle(p.addressText ?? '') ? '#4B5563' : '#9CA3AF'}
                      numberOfLines={2}
                    >
                      {collapsedLocationTitle(p.addressText ?? '') || '未填写位置'}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>

              <HStack space={2} alignItems="center" alignSelf="flex-start" flexShrink={0}>
                <Button
                  {...PARTICIPANT_OUTLINE_BTN_NO_GREY}
                  size="sm"
                  variant="outline"
                  borderColor="#2A2A2A"
                  _text={{ color: '#2A2A2A', fontSize: 12 }}
                  borderRadius={999}
                  onPress={() => updateParticipant(p.id, { collapsed: false })}
                >
                  编辑
                </Button>
                <Button
                  {...PARTICIPANT_OUTLINE_BTN_NO_GREY}
                  size="sm"
                  variant="outline"
                  _text={{ color: '#FF5A5A', fontSize: 12 }}
                  borderColor="#FFB2B2"
                  borderRadius={999}
                  _disabled={{ opacity: 0.72, _text: { color: '#FF8D8D', fontSize: 12 } }}
                  onPress={() => removeParticipant(p.id)}
                  isDisabled={session.participants.length <= MIN_PARTICIPANTS}
                >
                  删除
                </Button>
              </HStack>
            </HStack>
          ) : (
            <>
              <HStack justifyContent="space-between" alignItems="center" mb={3}>
                <HStack space={2} alignItems="center">
                  <Text fontSize="xl" fontWeight="bold" color="#1A1A1A">
                    {idx + 1}
                  </Text>
                </HStack>
                <HStack space={2} alignItems="center">
                  <Button
                    {...PARTICIPANT_OUTLINE_BTN_NO_GREY}
                    size="sm"
                    variant="outline"
                    borderColor="#B7D4C2"
                    borderRadius={999}
                    accessibilityLabel="确认"
                    onPress={() => {
                      if (!p.addressText.trim()) {
                        alertLocationRequired();
                        return;
                      }
                      updateParticipant(p.id, { collapsed: true });
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#1B4332" />
                  </Button>
                  <Button
                    {...PARTICIPANT_OUTLINE_BTN_NO_GREY}
                    size="sm"
                    variant="outline"
                    _text={{ color: '#FF5A5A', fontSize: 12 }}
                    borderColor="#FFB2B2"
                    borderRadius={999}
                    _disabled={{ opacity: 0.72, _text: { color: '#FF8D8D', fontSize: 12 } }}
                    onPress={() => removeParticipant(p.id)}
                    isDisabled={session.participants.length <= MIN_PARTICIPANTS}
                  >
                    删除
                  </Button>
                </HStack>
              </HStack>

              <VStack space={3}>
                <FormControl>
                  <HStack alignItems="center" space={2}>
                    <Box style={[styles.labelColCompact, styles.labelColAlignStart]} justifyContent="center">
                      <Text style={styles.inlineLabelText} numberOfLines={1}>
                        昵称
                      </Text>
                    </Box>
                    <Box style={styles.fieldCol}>
                      <TextInput
                        value={p.displayName}
                        onChangeText={(t) => updateParticipant(p.id, { displayName: t })}
                        placeholder="例如：小王"
                        placeholderTextColor="#A0AEC0"
                        style={[styles.textField, styles.participantInput, styles.textFieldFill]}
                        editable
                        returnKeyType="next"
                      />
                    </Box>
                  </HStack>
                </FormControl>

                <FormControl>
                  <HStack alignItems="flex-start" space={2}>
                    <Box style={[styles.labelColCompact, styles.labelColAlignStart, styles.labelColWithField]} justifyContent="center">
                      <Text style={styles.inlineLabelText} numberOfLines={1}>
                        位置
                      </Text>
                    </Box>
                    <Box style={styles.fieldCol}>
                      <VStack w="100%" space={1.5}>
                      <TextInput
                        value={p.addressText}
                        onChangeText={(t) => onAddressTextChange(p.id, t)}
                        placeholder="例如：朝阳区三里屯附近 / 任意文本"
                        placeholderTextColor="#A0AEC0"
                        style={[styles.textField, styles.participantInput, styles.textFieldFill]}
                        editable
                        returnKeyType="done"
                      />
                      {(suggestionsByParticipant[p.id] ?? []).length > 0 ? (
                        <Box borderRadius={12} bg="#FFFFFF" borderWidth={1} borderColor="#E2E8F0" overflow="hidden">
                          {(suggestionsByParticipant[p.id] ?? []).map((s) => (
                            <Button
                              key={s.id}
                              variant="ghost"
                              justifyContent="flex-start"
                              px={4}
                              py={3}
                              _pressed={{ bg: 'rgba(59,130,246,0.06)' }}
                              onPress={() => {
                                updateParticipant(p.id, {
                                  addressText: s.label,
                                  selectedCoordinate: s.coordinate,
                                  selectedCityCode: s.cityCode,
                                  selectedAdCode: s.adCode,
                                });
                                setSuggestions(p.id, []);
                              }}
                            >
                              <VStack alignItems="flex-start" w="100%" space={0.5}>
                                <Text color="#1D4ED8" fontSize={16} fontWeight="medium" numberOfLines={1}>
                                  {s.title}
                                </Text>
                                <Text color="#4B5563" fontSize={16} numberOfLines={1}>
                                  {s.subtitle}
                                </Text>
                              </VStack>
                            </Button>
                          ))}
                        </Box>
                      ) : null}
                      </VStack>
                    </Box>
                  </HStack>
                </FormControl>

                <FormControl mb={4} mt={3}>
                  <Text style={styles.inlineLabelText} mb={2}>
                    交通方式
                  </Text>
                  <Box w="100%">
                    <TransportPicker value={p.transport} onChange={(v) => updateParticipant(p.id, { transport: v })} />
                  </Box>
                </FormControl>
              </VStack>
            </>
          )}
          </GlassCard>
        ))}
      </VStack>

      <Button
        h={10}
        px={8}
        borderRadius={22}
        bg="#2A2A2A"
        _text={{ color: '#FFFFFF', fontWeight: '500', fontSize: 14 }}
        alignSelf="flex-start"
        onPress={addParticipant}
        isDisabled={session.participants.length >= MAX_PARTICIPANTS}
      >
        添加
      </Button>
    </VStack>
  );
}

const styles = StyleSheet.create({
  /** 昵称/位置：两字标签用窄列 + 右对齐，输入框更宽且更贴近标题 */
  labelColCompact: {
    width: 52,
    flexShrink: 0,
  },
  /** 与「交通方式」等块级标题左缘对齐 */
  labelColAlignStart: {
    alignItems: 'flex-start',
  },
  /** 与多行/第一行输入垂直对齐：与 participantInput 的 paddingVertical 呼应 */
  labelColWithField: {
    paddingTop: 8,
  },
  inlineLabelText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  /** 与标签列并排时占满剩余宽度，避免 Web 上 flex 子项宽度不一致 */
  fieldCol: {
    flex: 1,
    minWidth: 0,
  },
  textField: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A202C',
  },
  /** 昵称/位置：略小的圆角与高度 */
  participantInput: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  textFieldFill: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
});
