import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, Heading, Text, VStack } from 'native-base';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { GradientPrimaryButton } from '../components/GradientPrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * 首页：MeetWe 品牌叙事 + 进入设置页
 */
export function HomeScreen({ navigation }: Props) {
  return (
    <Box flex={1}>
      <VStack flex={1} px={8} justifyContent="flex-start" alignItems="center" pt={180}>
        <VStack w="270px" alignItems="center">
        <Box
          w={85}
          h={85}
          bg="white"
          borderRadius={24}
          alignItems="center"
          justifyContent="center"
          shadow={2}
          mb={7}
          style={styles.logoWrap}
        >
          <View style={styles.logoInner}>
            <View style={[styles.blob, styles.blobPurple]} />
            <View style={[styles.blob, styles.blobBlue]} />
            <View style={[styles.blob, styles.blobPink]} />
            <View style={[styles.blob, styles.blobWhite]} />
          </View>
        </Box>

        <VStack space={4} alignItems="center" w="100%">
          <Heading
            size="2xl"
            numberOfLines={1}
            style={{
              fontSize: 54,
              lineHeight: 56,
              fontWeight: '700',
              letterSpacing: -1.5,
              color: '#1A1A1A',
            }}
          >
            MeetWe
          </Heading>

          <Text
            fontSize={12}
            color="#666666"
            textAlign="center"
            lineHeight={19}
            maxW="300px"
          >
            告别单向奔波，让每一次约会都轻松抵达
          </Text>

          <Box mt={12} w="100%" alignItems="center">
            <GradientPrimaryButton
              label="开始创建聚会"
              onPress={() => navigation.navigate('GroupSetup')}
            />
          </Box>
        </VStack>
        </VStack>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    transform: [{ rotate: '4deg' }],
  },
  logoInner: {
    width: 48,
    height: 48,
    transform: [{ rotate: '-4deg' }],
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobPurple: {
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#E5DAF1',
  },
  blobBlue: {
    top: 3,
    left: 0,
    width: 36,
    height: 30,
    backgroundColor: '#A2D5FA',
  },
  blobPink: {
    bottom: 0,
    left: 4,
    width: 28,
    height: 28,
    backgroundColor: '#FCDDE9',
  },
  blobWhite: {
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
});
