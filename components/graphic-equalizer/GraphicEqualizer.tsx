import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudioEngine } from "@/audio/AudioEngineProvider";
import ChannelModeButton from "@/components/graphic-equalizer/ChannelModeButton";
import { EQ_BAND_COUNT } from "@/components/graphic-equalizer/constants";
import EqBands from "@/components/graphic-equalizer/EqBands";
import FrequencyShift from "@/components/graphic-equalizer/FrequencyShift";
import VolumeFader from "@/components/graphic-equalizer/VolumeFader";

const INITIAL_BANDS = Array.from({ length: EQ_BAND_COUNT }, () => 0);

export default function GraphicEqualizer() {
  const insets = useSafeAreaInsets();
  const { setParams } = useAudioEngine();
  const [bands, setBands] = useState(INITIAL_BANDS);
  const [volume, setVolume] = useState(0.75);
  const [shift, setShift] = useState(0);
  const [stereo, setStereo] = useState(false);

  useEffect(() => {
    setParams({ bands, volume, shift, stereo });
  }, [bands, volume, shift, stereo, setParams]);

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 12),
        paddingLeft: Math.max(insets.left, 16),
        paddingRight: Math.max(insets.right, 16),
      }}
    >
      <View className="min-h-0 flex-1 flex-row gap-10">
        <EqBands values={bands} onChange={setBands} />
        <View className="w-24">
          <VolumeFader value={volume} onChange={setVolume} />
        </View>
      </View>
      <View className="mt-4 flex-row items-center gap-10">
        <FrequencyShift value={shift} onChange={setShift} />
        <View className="w-24">
          <ChannelModeButton stereo={stereo} onChange={setStereo} />
        </View>
      </View>
    </View>
  );
}
