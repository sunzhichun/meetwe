import React from 'react';
import { Alert } from 'react-native';
import { Box, Button, Pressable, ScrollView, Text, VStack } from 'native-base';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList } from '../navigation/types';
import { ParticipantEditor } from '../components/ParticipantEditor';
import { EventTypePicker } from '../components/EventTypePicker';
import { useMeetWe } from '../context/MeetWeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupSetup'>;

/**
 * 聚会设置页：输入参与者 + 选择约会类型 + 生成推荐
 */
export function GroupSetupScreen({ navigation }: Props) {
  const { session, setEventType, computeRecommendations, isComputing, computeError } = useMeetWe();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '聚会设置',
      headerBackVisible: false,
      headerBackButtonDisplayMode: 'minimal',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} px={2} py={1} accessibilityLabel="返回">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onGenerate = async () => {
    try {
      await computeRecommendations(session);
      navigation.navigate('Results');
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : computeError || '请检查网络、API Key、地址输入是否有效';
      Alert.alert('生成推荐失败', msg);
    }
  };

  return (
    <Box flex={1} position="relative">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 220, paddingTop: 98 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <VStack space={6} pt={0}>
          <Text fontSize="xl" fontWeight="bold" color="#1A1A1A" style={{ transform: [{ translateY: 16 }] }}>
            去哪
          </Text>
          <Box borderRadius={20} overflow="hidden">
            <LinearGradient
              colors={['rgba(181,222,255,0.40)', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 20, paddingVertical: 20 }}
            >
              <EventTypePicker value={session.eventType} onChange={setEventType} />
            </LinearGradient>
          </Box>

          <ParticipantEditor />
        </VStack>
      </ScrollView>

      <Box
        position="absolute"
        bottom={12}
        left={0}
        right={0}
        px={5}
        pt={6}
        pb={2}
        bg="transparent"
      >
        <Button
          h="52px"
          borderRadius={26}
          bg="#2A2A2A"
          alignSelf="center"
          w="90%"
          maxW="353px"
          shadow={3}
          _text={{ color: '#FFFFFF', fontWeight: 'medium', fontSize: 16 }}
          onPress={onGenerate}
          isDisabled={isComputing}
        >
          生成推荐地
        </Button>
      </Box>
    </Box>
  );
}
