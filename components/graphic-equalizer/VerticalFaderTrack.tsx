import { View } from "react-native";

import { clamp } from "@/components/graphic-equalizer/constants";

type VerticalFaderTrackProps = {
  level: number;
  bipolar?: boolean;
};

export default function VerticalFaderTrack({
  level,
  bipolar = false,
}: VerticalFaderTrackProps) {
  const clamped = clamp(level, 0, 1);

  return (
    <View className="relative h-full w-full overflow-hidden rounded-2xl bg-track">
      {bipolar ? (
        <View
          className="absolute left-0 right-0 bg-accent"
          style={{
            top: `${(1 - Math.max(clamped, 0.5)) * 100}%`,
            bottom: `${Math.min(clamped, 0.5) * 100}%`,
          }}
        />
      ) : (
        <View
          className="absolute bottom-0 left-0 right-0 bg-accent"
          style={{ height: `${clamped * 100}%` }}
        />
      )}
      {bipolar ? (
        <View
          className="absolute left-0 right-0 bg-primary"
          style={{ top: "50%", height: 1 }}
        />
      ) : null}
    </View>
  );
}
