import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useWakeLock() {
  const active = ref(false)
  let sentinel: WakeLockSentinel | null = null
  let requested = false

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return
    requested = true
    try {
      sentinel = await navigator.wakeLock.request('screen')
      active.value = true
      sentinel.addEventListener('release', () => {
        active.value = false
        sentinel = null
      })
    } catch {
      active.value = false
    }
  }

  function handleVisibilityChange() {
    if (requested && document.visibilityState === 'visible' && sentinel === null) {
      requestWakeLock()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    sentinel?.release()
  })

  return { active, requestWakeLock }
}
