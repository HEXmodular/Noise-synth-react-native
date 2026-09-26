import {
  EQ_BAND_HZ,
  EQ_MAX_DB,
  EQ_MIN_DB,
} from "@/components/graphic-equalizer/constants";

const NOISE_TRIM = 0.2;

export function createEngineScript() {
  return `
(function () {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    window.resumeAudio = function () {};
    window.setEngineState = function () {};
    return;
  }

  var BASE_HZ = ${JSON.stringify(EQ_BAND_HZ)};
  var MIN_DB = ${EQ_MIN_DB};
  var MAX_DB = ${EQ_MAX_DB};
  var OCTAVE_Q = Math.SQRT2;
  var audioCtx;
  try {
    audioCtx = new AudioCtx({ latencyHint: "interactive" });
  } catch (error) {
    audioCtx = new AudioCtx();
  }
  var monoGain = audioCtx.createGain();
  var stereoGain = audioCtx.createGain();
  var trim = audioCtx.createGain();
  var masterGain = audioCtx.createGain();

  monoGain.gain.value = 1;
  stereoGain.gain.value = 0;
  trim.gain.value = ${NOISE_TRIM};
  masterGain.gain.value = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function finite(value, fallback) {
    var next = Number(value);
    return Number.isFinite(next) ? next : fallback;
  }

  function approach(param, value, now, seconds) {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.setTargetAtTime(value, now, seconds);
  }

  function createNoiseBuffer(independent) {
    var length = Math.floor(audioCtx.sampleRate * 2);
    var buffer = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
    var left = buffer.getChannelData(0);
    var right = buffer.getChannelData(1);
    for (var i = 0; i < length; i += 1) {
      var sample = Math.random() * 2 - 1;
      left[i] = sample;
      right[i] = independent ? Math.random() * 2 - 1 : sample;
    }
    return buffer;
  }

  function startNoise(buffer, destination) {
    var source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(destination);
    source.start();
  }

  var filters = BASE_HZ.map(function (hz) {
    var filter = audioCtx.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = hz;
    filter.Q.value = OCTAVE_Q;
    filter.gain.value = 0;
    return filter;
  });

  monoGain.connect(filters[0]);
  stereoGain.connect(filters[0]);
  for (var band = 0; band < filters.length - 1; band += 1) {
    filters[band].connect(filters[band + 1]);
  }
  filters[filters.length - 1].connect(trim);
  trim.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  startNoise(createNoiseBuffer(false), monoGain);
  startNoise(createNoiseBuffer(true), stereoGain);

  function bandFrequency(baseHz, shift) {
    var nyquist = audioCtx.sampleRate * 0.5;
    return clamp(baseHz * Math.pow(2, shift), 1, nyquist - 1);
  }

  function resume() {
    var pending = audioCtx.resume();
    if (pending && pending.catch) {
      pending.catch(function () {});
    }
  }

  window.resumeAudio = resume;

  window.setEngineState = function (state) {
    if (!state) {
      resume();
      return;
    }

    var now = audioCtx.currentTime;
    var shift = clamp(finite(state.shift, 0), -1, 1);
    var bands = Array.isArray(state.bands) ? state.bands : [];

    for (var i = 0; i < filters.length; i += 1) {
      approach(
        filters[i].gain,
        clamp(finite(bands[i], 0), MIN_DB, MAX_DB),
        now,
        0.015,
      );
      approach(
        filters[i].frequency,
        bandFrequency(BASE_HZ[i], shift),
        now,
        0.02,
      );
    }

    var volume = clamp(finite(state.volume, 0), 0, 1);
    if (volume <= 0.0001) {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(0, now);
    } else {
      approach(masterGain.gain, volume, now, 0.015);
    }

    var stereo = !!state.stereo;
    approach(monoGain.gain, stereo ? 0 : 1, now, 0.03);
    approach(stereoGain.gain, stereo ? 1 : 0, now, 0.03);
    resume();
  };

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      resume();
    }
  });
})();
`;
}

export function createEngineHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <script>
      ${createEngineScript()}
    </script>
  </body>
</html>`;
}
