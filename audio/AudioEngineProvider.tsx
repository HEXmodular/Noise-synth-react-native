import { createEngineHtml } from "@/audio/engineHtml";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

const ENGINE_HTML = createEngineHtml();

type AudioEngineValue = {
  resume: () => void;
};

const AudioEngineContext = createContext<AudioEngineValue | null>(null);

export function useAudioEngine() {
  const value = useContext(AudioEngineContext);
  if (!value) {
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  }

  return value;
}

type AudioEngineProviderProps = {
  children: ReactNode;
};

export default function AudioEngineProvider({
  children,
}: AudioEngineProviderProps) {
  const webViewRef = useRef<WebView>(null);

  const resume = useCallback(() => {
    webViewRef.current?.injectJavaScript("window.resumeAudio(); true;");
  }, []);

  const value = useMemo(() => ({ resume }), [resume]);

  return (
    <AudioEngineContext.Provider value={value}>
      <View className="flex-1">
        <View
          className="absolute h-px w-px overflow-hidden opacity-0"
          pointerEvents="none"
        >
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: ENGINE_HTML }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={resume}
          />
        </View>
        {children}
      </View>
    </AudioEngineContext.Provider>
  );
}
