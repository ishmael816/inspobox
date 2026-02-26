// Capacitor 移动端原生功能封装
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

// 检测是否在原生应用中运行
export const isNativePlatform = () => Capacitor.isNativePlatform();

// 检测平台
export const getPlatform = () => Capacitor.getPlatform();

// 初始化移动端功能
export async function initializeMobileApp() {
  if (!isNativePlatform()) {
    console.log('Running in web browser, skipping native initialization');
    return;
  }

  console.log('Initializing mobile app...');

  try {
    // 设置状态栏
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#fafafa' });

    // 隐藏启动屏
    await SplashScreen.hide();

    // 监听返回按钮
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      }
    });

    // 监听应用状态
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed:', isActive ? 'active' : 'inactive');
    });

    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.error('Failed to initialize mobile app:', error);
  }
}

// 移动端存储封装 (替代 localStorage)
export const mobileStorage = {
  async get(key: string): Promise<string | null> {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async remove(key: string): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  },
};

// 隐藏键盘
export async function hideKeyboard() {
  if (isNativePlatform()) {
    await Keyboard.hide();
  }
}

// 显示键盘
export async function showKeyboard() {
  if (isNativePlatform()) {
    await Keyboard.show();
  }
}
