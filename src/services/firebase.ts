import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

/**
 * Firebase 最小接入（匿名登录）
 *
 * 说明（给产品/非研发同学）：
 * - 这一步是为了给未来“云端保存历史/偏好”留接口
 * - 如果你还没在 Firebase 控制台创建项目，这里会优雅失败，不影响 MeetWe 的本地模拟计算
 *
 * Expo 环境变量约定：使用 EXPO_PUBLIC_* 前缀，构建时会注入到代码中。
 */

export type FirebaseAnonymousResult =
  | { ok: true; uid: string }
  | { ok: false; reason: string };

let cachedApp: FirebaseApp | null = null;

function readFirebaseConfig() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  const cfg = readFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

/**
 * 初始化 Firebase App（幂等）并尝试匿名登录
 */
export async function initFirebaseAnonymous(): Promise<FirebaseAnonymousResult> {
  const cfg = readFirebaseConfig();
  if (!cfg.apiKey || !cfg.projectId) {
    return { ok: false, reason: '未配置 EXPO_PUBLIC_FIREBASE_*（可在项目根目录创建 .env）' };
  }

  try {
    if (!cachedApp) {
      cachedApp = getApps().length ? getApps()[0]! : initializeApp(cfg);
    }
    const auth = getAuth(cachedApp);
    const cred = await signInAnonymously(auth);
    return { ok: true, uid: cred.user.uid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg };
  }
}
