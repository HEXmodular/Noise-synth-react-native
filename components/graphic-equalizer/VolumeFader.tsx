import { useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { clamp } from "@/components/graphic-equalizer/constants";
import VerticalFaderTrack from "@/components/graphic-equalizer/VerticalFaderTrack";

type VolumeFaderProps = {
  value: number;
  onChange: (value: number) => void;
};

export default function VolumeFader({ value, onChange }: VolumeFaderProps) {
  const onChangeRef = useRef(onChange);
  const heightRef = useRef(0);

  onChangeRef.current = onChange;

  const applyY = (y: number) => {
    const height = heightRef.current;
    if (height <= 0) {
      return;
    }

    const level = clamp(1 - y / height, 0, 1);
    onChangeRef.current(Math.round(level * 1000) / 1000);
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          applyY(event.y);
        })
        .onUpdate((event) => {
          applyY(event.y);
        }),
    [],
  );

  return (
    <View className="h-full">
      <Text className="mb-2 h-5 text-center text-xs leading-5 text-primary/70">
        VOL
      </Text>
      <GestureDetector gesture={gesture}>
        <View
          accessibilityLabel="Volume"
          accessibilityRole="adjustable"
          className="min-h-0 flex-1 touch-none items-center"
          collapsable={false}
          onLayout={(event) => {
            heightRef.current = event.nativeEvent.layout.height;
          }}
        >
          <View className="h-full w-full px-1" pointerEvents="none">
            <VerticalFaderTrack level={value} />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}
