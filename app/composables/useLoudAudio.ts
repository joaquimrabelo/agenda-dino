const GAIN = 1.5

let audioContext: AudioContext | null = null

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

export function useLoudAudio() {
  function play(src: string) {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const audio = new Audio(src)
    const source = ctx.createMediaElementSource(audio)
    const gainNode = ctx.createGain()
    gainNode.gain.value = GAIN
    source.connect(gainNode)
    gainNode.connect(ctx.destination)

    audio.play().catch(() => {})
  }

  return { play }
}
