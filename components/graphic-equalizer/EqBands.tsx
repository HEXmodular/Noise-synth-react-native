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

type TouchSample = {
  id: number;
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
  const pointersRef = useRef(new Map<number, Point>());

  onChangeRef.current = onChange;

  const applyTouches = (touches: TouchSample[]) => {
    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0 || touches.length === 0) {
      return;
    }

    const next = gainsRef.current.slice();

    for (const touch of touches) {
      const point = { x: touch.x, y: touch.y };
      const previous = pointersRef.current.get(touch.id) ?? point;
      writeStroke(
        next,
        previous,
        point,
        heldBands(pointersRef.current, touch.id, width),
        width,
        height,
      );
      pointersRef.current.set(touch.id, point);
    }

    gainsRef.current = next;
    onChangeRef.current(next);
  };

  const releaseTouches = (touches: TouchSample[]) => {
    for (const touch of touches) {
      pointersRef.current.delete(touch.id);
    }
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .maxPointers(EQ_BAND_COUNT)
        .onTouchesDown((event) => {
          applyTouches(event.changedTouches);
        })
        .onTouchesMove((event) => {
          applyTouches(event.changedTouches);
        })
        .onTouchesUp((event) => {
          applyTouches(event.changedTouches);
          releaseTouches(event.changedTouches);
        })
        .onTouchesCancelled(() => {
          pointersRef.current.clear();
        })
        .onFinalize(() => {
          pointersRef.current.clear();
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

function heldBands(
  pointers: Map<number, Point>,
  currentId: number,
  width: number,
) {
  const held = new Set<number>();
  const maxX = Math.max(width - 0.01, 0);

  for (const [id, point] of pointers) {
    if (id === currentId) {
      continue;
    }

    held.add(xToBandIndex(clamp(point.x, 0, maxX), width));
  }

  return held;
}

function writeStroke(
  gains: number[],
  from: Point,
  to: Point,
  held: Set<number>,
  width: number,
  height: number,
) {
  const start = clampPoint(from, width, height);
  const end = clampPoint(to, width, height);
  const startIndex = xToBandIndex(start.x, width);
  const endIndex = xToBandIndex(end.x, width);
  const fromIndex = Math.min(startIndex, endIndex);
  const toIndex = Math.max(startIndex, endIndex);

  for (let index = fromIndex; index <= toIndex; index += 1) {
    if (held.has(index) && index !== endIndex) {
      continue;
    }

    gains[index] = yToDb(
      yOnSegment(index, start, end, startIndex, endIndex, width),
      height,
    );
  }
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
