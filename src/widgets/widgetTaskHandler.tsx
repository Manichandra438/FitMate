import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { FitMateWidget } from './FitMateWidget';
import { readWidgetData } from './widgetData';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await readWidgetData();
      props.renderWidget(<FitMateWidget data={data} />);
      break;
    }
    case 'WIDGET_CLICK':
      // clickAction OPEN_APP is handled natively; nothing to do here.
      break;
    default:
      break;
  }
}
