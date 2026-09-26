import { Pressable, Text } from "react-native";

type ChannelModeButtonProps = {
  stereo: boolean;
  onChange: (stereo: boolean) => void;
};

export default function ChannelModeButton({
  stereo,
  onChange,
}: ChannelModeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={stereo ? "Stereo mode" : "Mono mode"}
      onPress={() => onChange(!stereo)}
      className={
        stereo
          ? "h-12 items-center justify-center rounded-xl border border-accent bg-accent"
          : "h-12 items-center justify-center rounded-xl border border-border bg-white/5"
      }
    >
      <Text className="text-xs text-primary">{stereo ? "STEREO" : "MONO"}</Text>
    </Pressable>
  );
}
