import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

registerRootComponent(App);

// Widget handler is Android-only; crashes on web.
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
