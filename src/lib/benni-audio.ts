/** Increase the loudness of Benni-TV clips without modifying uploaded videos. */
export const BENNI_VIDEO_GAIN = 1.3;

interface VideoAudioGraph {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  connected: boolean;
}

let sharedContext: AudioContext | null = null;
const graphs = new WeakMap<HTMLVideoElement, VideoAudioGraph>();

function contextForBenni(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) return null;
  sharedContext ??= new AudioContext();
  return sharedContext;
}

/**
 * Called from the quiz's first local user interaction.
 * Remote phone taps cannot unlock autoplay permissions on the TV browser.
 */
export function unlockBenniAudio() {
  const context = contextForBenni();
  if (context && context.state === "suspended") {
    void context.resume().catch(error => console.warn("Benni-TV Audiofreigabe:", error));
  }
}

/** Attach a single 130% gain stage to a clip's video element. */
export function connectBenniAudio(video: HTMLVideoElement): AudioContext | null {
  const context = contextForBenni();
  if (!context) return null;

  try {
    let graph = graphs.get(video);
    if (!graph) {
      graph = {
        context,
        source: context.createMediaElementSource(video),
        gain: context.createGain(),
        connected: false,
      };
      graph.gain.gain.value = BENNI_VIDEO_GAIN;
      graphs.set(video, graph);
    }
    if (!graph.connected) {
      graph.source.connect(graph.gain);
      graph.gain.connect(graph.context.destination);
      graph.connected = true;
    }
    return graph.context;
  } catch (error) {
    // Still allow ordinary video playback if this browser cannot process audio.
    console.warn("Benni-TV Lautstärkeverstärkung nicht verfügbar:", error);
    return null;
  }
}

/** Disconnect when the overlay closes; React can reattach the same video element. */
export function disconnectBenniAudio(video: HTMLVideoElement) {
  const graph = graphs.get(video);
  if (!graph?.connected) return;
  graph.source.disconnect();
  graph.gain.disconnect();
  graph.connected = false;
}
