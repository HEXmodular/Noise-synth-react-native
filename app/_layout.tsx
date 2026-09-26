import "@/global.css";
import AudioEngineProvider from "@/audio/AudioEngineProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1 bg-background" style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AudioEngineProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AudioEngineProvider>
    </GestureHandlerRootView>
  );
}
