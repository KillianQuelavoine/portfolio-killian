let sentinel: WakeLockSentinel | null = null

export async function requestWakeLock(): Promise<void> {
  try {
    if (document.visibilityState === 'visible' && 'wakeLock' in navigator && (!sentinel || sentinel.released)) {
      sentinel = await navigator.wakeLock.request('screen')
    }
  } catch {
    sentinel = null
  }
}

export async function releaseWakeLock(): Promise<void> {
  try { await sentinel?.release() } catch { /* non pris en charge */ }
  sentinel = null
}
