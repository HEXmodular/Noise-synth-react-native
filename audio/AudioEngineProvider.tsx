import { createEngineHtml, createEngineScript } from "@/audio/engineHtml";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";

const ENGINE_HTML = createEngineHtml();

export type AudioEngineParams = {
  bands: number[];
  volume: number;
  shift: number;
  stereo: boolean;
};

type EngineHost = Window & {
  resumeAudio?: () => void;
  setEngineState?: (params: AudioEngineParams) => void;
};

type AudioEngineValue = {
  resume: () => void;
  setParams: (params: AudioEngineParams) => void;
};

const AudioEngineContext = createContext<AudioEngineValue | null>(null);

let webEngineInstalled = false;

function webEngine() {
  return window as EngineHost;
}

function ensureWebEngine() {
  if (webEngineInstalled || typeof document === "undefined") {
    return;
  }

  webEngineInstalled = true;
  const script = document.createElement("script");
  script.textContent = createEngineScript();
  document.head.appendChild(script);
}

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
  const readyRef = useRef(false);
  const paramsRef = useRef<AudioEngineParams | null>(null);

  const publish = useCallback((params: AudioEngineParams) => {
    if (Platform.OS === "web") {
      webEngine().setEngineState?.(params);
      return;
    }

    webViewRef.current?.injectJavaScript(
      `window.setEngineState(${JSON.stringify(params)}); true;`,
    );
  }, []);

  const resume = useCallback(() => {
    if (Platform.OS === "web") {
      webEngine().resumeAudio?.();
      return;
    }

    webViewRef.current?.injectJavaScript("window.resumeAudio(); true;");
  }, []);

  const setParams = useCallback(
    (params: AudioEngineParams) => {
      paramsRef.current = params;
      if (!readyRef.current) {
        return;
      }

      publish(params);
    },
    [publish],
  );

  const handleLoadEnd = useCallback(() => {
    readyRef.current = true;
    const params = paramsRef.current;
    if (params) {
      publish(params);
      return;
    }

    resume();
  }, [publish, resume]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    ensureWebEngine();
    readyRef.current = true;
    const params = paramsRef.current;
    if (params) {
      publish(params);
    } else {
      resume();
    }

    const unlock = () => {
      webEngine().resumeAudio?.();
    };
    window.addEventListener("pointerdown", unlock, true);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
    };
  }, [publish, resume]);

  const value = useMemo(
    () => ({ resume, setParams }),
    [resume, setParams],
  );

  return (
    <AudioEngineContext.Provider value={value}>
      <View className="flex-1">
        {Platform.OS === "web" ? null : (
          <View
            className="absolute h-px w-px overflow-hidden opacity-0"
            collapsable={false}
            pointerEvents="none"
          >
            <WebView
              ref={webViewRef}
              style={{ width: 1, height: 1 }}
              originWhitelist={["*"]}
              source={{ html: ENGINE_HTML }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onLoadEnd={handleLoadEnd}
            />
          </View>
        )}
        {children}
      </View>
    </AudioEngineContext.Provider>
  );
}
