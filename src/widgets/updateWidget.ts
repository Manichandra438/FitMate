import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { FitMateWidget } from './FitMateWidget';
import { readWidgetData } from './widgetData';

let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced refresh of the home-screen widget while the app is alive. */
export function scheduleWidgetRefresh() {
  if (Platform.OS !== 'android') return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const data = await readWidgetData();
      await requestWidgetUpdate({
        widgetName: 'FitMateDaily',
        renderWidget: () => React.createElement(FitMateWidget, { data }),
        widgetNotFound: () => {
          // No widget on the home screen — nothing to update.
        },
      });
    } catch {
      // Widget module unavailable (e.g. Expo Go) — ignore.
    }
  }, 1500);
}
