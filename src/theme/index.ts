import { extendTheme } from 'native-base';

/**
 * MeetWe 视觉主题（社交向：温暖主色 + 清新辅色 + 大圆角）
 * - primary：日出橙（活力、亲和力）
 * - secondary：蓝绿色（清新、平衡）
 */
export const meetWeTheme = extendTheme({
  colors: {
    // Figma Make 主色：深灰主按钮 + 暖橙点缀
    primary: {
      50: '#F5F5F5',
      100: '#E5E5E5',
      200: '#D4D4D4',
      300: '#A3A3A3',
      400: '#737373',
      500: '#2A2A2A',
      600: '#242424',
      700: '#1E1E1E',
      800: '#171717',
      900: '#0F0F0F',
    },
    // 辅色：清亮蓝（用于进度条/地图点缀）
    secondary: {
      50: '#F2FAFF',
      100: '#E0F2FF',
      200: '#C7E6FF',
      300: '#A2D5FA',
      400: '#6FE0FF',
      500: '#87E1FF',
      600: '#5FC9EE',
      700: '#3EA7D2',
      800: '#2D86B0',
      900: '#1E5E7D',
    },
    accent: {
      500: '#E8672D',
    },
    // 背景：Figma Make 的浅米白底
    background: {
      50: '#F9F8F6',
    },
  },
  radii: {
    lg: '14px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
  },
  components: {
    Button: {
      defaultProps: {
        borderRadius: '2xl',
        _text: {
          fontWeight: 'medium',
        },
      },
    },
    Input: {
      defaultProps: {
        borderRadius: '2xl',
        backgroundColor: 'white',
      },
    },
    TextArea: {
      defaultProps: {
        borderRadius: '2xl',
        backgroundColor: 'white',
      },
    },
    Pressable: {
      defaultProps: {
        borderRadius: '2xl',
      },
    },
  },
});
