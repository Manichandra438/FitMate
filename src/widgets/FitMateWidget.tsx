import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetData } from './widgetData';

const BG = '#FFF8F2';
const GREEN = '#FF7A59';
const TEAL = '#34C79A';
const BLUE = '#58B9F4';
const YELLOW = '#D98E00';
const TEXT = '#2E2A26';
const MUTED = '#7D746B';

export function FitMateWidget({ data }: { data: WidgetData }) {
  if (!data.onboarded) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: BG,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <TextWidget
          text="FitMate"
          style={{ fontSize: 18, fontWeight: '700', color: GREEN }}
        />
        <TextWidget
          text="Open FitMate to set up your plan"
          style={{ fontSize: 13, color: MUTED, marginTop: 6 }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: BG,
        borderRadius: 24,
        flexDirection: 'column',
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="FitMate"
          style={{ fontSize: 13, fontWeight: '700', color: GREEN }}
        />
        <TextWidget
          text={`🔥 ${data.streak} day streak`}
          style={{ fontSize: 12, fontWeight: '600', color: YELLOW }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={`${data.kcalRemaining}`}
            style={{ fontSize: 32, fontWeight: '800', color: TEXT }}
          />
          <TextWidget
            text="kcal left"
            style={{ fontSize: 12, color: MUTED }}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <TextWidget
            text={`🍽 ${data.kcalEaten} / ${data.kcalGoal} kcal`}
            style={{ fontSize: 13, fontWeight: '600', color: TEAL, marginBottom: 4 }}
          />
          <TextWidget
            text={`💧 ${data.water} / ${data.waterGoal} glasses`}
            style={{ fontSize: 13, fontWeight: '600', color: BLUE }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
