const STORAGE_KEY = 'wizard-scorekeeper-v1'

export function emptyStore() {
  return { schemaVersion: 1, activeGameId: null, games: [] }
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw)
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.games)) return emptyStore()
    return parsed
  } catch (error) {
    console.warn('Could not load saved Wizard games.', error)
    return emptyStore()
  }
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function clearStore() {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportStore(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wizard-scores-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
