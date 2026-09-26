import { useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { clamp } from "@/components/graphic-equalizer/constants";

type FrequencyShiftProps = {
  value: number;
  onChange: (value: number) => void;
};

export default function FrequencyShift({
  value,
  onChange,
}: FrequencyShiftProps) {
  const onChangeRef = useRef(onChange);
  const widthRef = useRef(0);

  onChangeRef.current = onChange;

  const applyX = (x: number) => {
    const width = widthRef.current;
    if (width <= 0) {
      return;
    }

    const ratio = clamp(x / width, 0, 1);
    const shift = ratio * 2 - 1;
    onChangeRef.current(Math.round(shift * 1000) / 1000);
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          applyX(event.x);
        })
        .onUpdate((event) => {
          applyX(event.x);
        }),
    [],
  );

  const position = (clamp(value, -1, 1) + 1) / 2;

  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2">
      <Text className="w-12 text-xs text-primary/60">-100%</Text>
      <GestureDetector gesture={gesture}>
        <View
          accessibilityLabel="Center frequency shift"
          accessibilityRole="adjustable"
          className="h-10 flex-1 justify-center touch-none"
          collapsable={false}
          onLayout={(event) => {
            widthRef.current = event.nativeEvent.layout.width;
          }}
        >
          <View
            className="relative h-5 overflow-hidden rounded-full bg-white/10"
            pointerEvents="none"
          >
            <View
              className="absolute bottom-0 top-0 bg-accent"
              style={
                value >= 0
                  ? {
                      left: "50%",
                      right: `${(1 - position) * 100}%`,
                    }
                  : {
                      left: `${position * 100}%`,
                      right: "50%",
                    }
              }
            />
            <View
              className="absolute bottom-0 top-0 bg-primary/40"
              style={{ left: "50%", width: 1 }}
            />
          </View>
        </View>
      </GestureDetector>
      <Text className="w-12 text-right text-xs text-primary/60">+100%</Text>
    </View>
  );
}
