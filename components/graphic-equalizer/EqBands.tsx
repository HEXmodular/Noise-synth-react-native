import { useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import {
  EQ_BAND_COUNT,
  EQ_FREQUENCIES,
  clamp,
  dbToLevel,
  xToBandIndex,
  yToDb,
} from "@/components/graphic-equalizer/constants";
import VerticalFaderTrack from "@/components/graphic-equalizer/VerticalFaderTrack";

type Point = {
  x: number;
  y: number;
};

type EqBandsProps = {
  values: number[];
  onChange: (values: number[]) => void;
};

export default function EqBands({ values, onChange }: EqBandsProps) {
  const gainsRef = useRef(values);
  const onChangeRef = useRef(onChange);
  const sizeRef = useRef({ width: 0, height: 0 });
  const lastPointRef = useRef<Point | null>(null);

  onChangeRef.current = onChange;

  const paint = (from: Point, to: Point) => {
    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0) {
      return;
    }

    const start = clampPoint(from, width, height);
    const end = clampPoint(to, width, height);
    const startIndex = xToBandIndex(start.x, width);
    const endIndex = xToBandIndex(end.x, width);
    const fromIndex = Math.min(startIndex, endIndex);
    const toIndex = Math.max(startIndex, endIndex);
    const next = gainsRef.current.slice();

    for (let index = fromIndex; index <= toIndex; index += 1) {
      next[index] = yToDb(
        yOnSegment(index, start, end, startIndex, endIndex, width),
        height,
      );
    }

    gainsRef.current = next;
    onChangeRef.current(next);
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          const point = { x: event.x, y: event.y };
          paint(point, point);
          lastPointRef.current = point;
        })
        .onUpdate((event) => {
          const point = { x: event.x, y: event.y };
          paint(lastPointRef.current ?? point, point);
          lastPointRef.current = point;
        })
        .onFinalize(() => {
          lastPointRef.current = null;
        }),
    [],
  );

  return (
    <View className="min-h-0 flex-1">
      <View className="mb-2 h-5 flex-row">
        {EQ_FREQUENCIES.map((label) => (
          <Text
            key={label}
            className="flex-1 text-center text-xs leading-5 text-primary/70"
          >
            {label}
          </Text>
        ))}
      </View>
      <GestureDetector gesture={gesture}>
        <View
          accessibilityLabel="Equalizer bands"
          accessibilityRole="adjustable"
          className="min-h-0 flex-1 flex-row touch-none"
          collapsable={false}
          onLayout={(event) => {
            sizeRef.current = {
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            };
          }}
        >
          {EQ_FREQUENCIES.map((label, index) => (
            <View
              key={label}
              className="h-full flex-1 px-1"
              pointerEvents="none"
            >
              <VerticalFaderTrack
                bipolar
                level={dbToLevel(values[index] ?? 0)}
              />
            </View>
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

function clampPoint(point: Point, width: number, height: number) {
  return {
    x: clamp(point.x, 0, Math.max(width - 0.01, 0)),
    y: clamp(point.y, 0, height),
  };
}

function yOnSegment(
  index: number,
  start: Point,
  end: Point,
  startIndex: number,
  endIndex: number,
  width: number,
) {
  if (index === endIndex || start.x === end.x) {
    return end.y;
  }

  if (index === startIndex) {
    return start.y;
  }

  const center = ((index + 0.5) / EQ_BAND_COUNT) * width;
  const t = clamp((center - start.x) / (end.x - start.x), 0, 1);
  return start.y + (end.y - start.y) * t;
}
