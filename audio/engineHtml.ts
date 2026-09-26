export function createEngineHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <script>
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const masterGain = audioCtx.createGain();

      masterGain.gain.value = 1;
      masterGain.connect(audioCtx.destination);

      window.resumeAudio = function () {
        audioCtx.resume();
      };
    </script>
  </body>
</html>`;
}
