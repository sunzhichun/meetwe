import React from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { Box, Button, FormControl, HStack, Text, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
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
          谁来
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
              <HStack space={2} alignItems="center" flexShrink={1}>
                <Text fontSize="xl" fontWeight="bold" color="#1A1A1A">
                  {idx + 1}
                </Text>
                <Text fontSize="md" color="#1A1A1A" fontWeight="medium" numberOfLines={1}>
                  {p.displayName?.trim() || `参与者${idx + 1}`}
                </Text>
                <Box ml={0.5}>{transportDisplayIcon(p.transport)}</Box>
              </HStack>

              <VStack alignItems="flex-end" space={3} ml={3}>
                <Button
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
              </VStack>
            </HStack>
          ) : (
            <>
              <HStack justifyContent="space-between" alignItems="center" mb={3}>
                <HStack space={2} alignItems="center">
                  <Text fontSize="xl" fontWeight="bold" color="#1A1A1A">
                    {idx + 1}
                  </Text>
                </HStack>
                <Button
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

              <VStack space={3}>
                <FormControl>
                  <HStack alignItems="center" space={3}>
                    <Text style={styles.inlineLabel}>昵称</Text>
                    <TextInput
                      value={p.displayName}
                      onChangeText={(t) => updateParticipant(p.id, { displayName: t })}
                      placeholder="例如：小王"
                      placeholderTextColor="#A0AEC0"
                      style={[styles.textField, styles.inlineInput]}
                      editable
                      returnKeyType="next"
                    />
                  </HStack>
                </FormControl>

                <FormControl>
                  <HStack alignItems="center" space={3}>
                    <Text style={styles.inlineLabel}>位置</Text>
                    <VStack flex={1} space={1.5}>
                      <TextInput
                        value={p.addressText}
                        onChangeText={(t) => onAddressTextChange(p.id, t)}
                        placeholder="例如：朝阳区三里屯附近 / 任意文本"
                        placeholderTextColor="#A0AEC0"
                        style={[styles.textField, styles.inlineInput]}
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
                                <Text color="#1D4ED8" fontSize={12} fontWeight="medium" numberOfLines={1}>
                                  {s.title}
                                </Text>
                                <Text color="#4B5563" fontSize={12} numberOfLines={1}>
                                  {s.subtitle}
                                </Text>
                              </VStack>
                            </Button>
                          ))}
                        </Box>
                      ) : null}
                    </VStack>
                  </HStack>
                </FormControl>

                <FormControl mb={4}>
                  <Text style={styles.inlineLabel}>交通方式</Text>
                  <Box mt={4}>
                    <TransportPicker value={p.transport} onChange={(v) => updateParticipant(p.id, { transport: v })} />
                  </Box>
                </FormControl>

                <Button
                  h="38px"
                  borderRadius={15}
                  bg="#2A2A2A"
                  alignSelf="center"
                  w="70%"
                  _text={{ color: '#FFFFFF', fontWeight: 'medium' }}
                  onPress={() => {
                    if (!p.addressText.trim()) {
                      Alert.alert('提示', '请填写位置');
                      return;
                    }
                    updateParticipant(p.id, { collapsed: true });
                  }}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </Button>
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
  inlineLabel: {
    width: 56,
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  textField: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    color: '#1A202C',
  },
  inlineInput: {
    flex: 1,
  },
});
