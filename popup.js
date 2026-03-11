const statusEl = document.getElementById("status")
const playBtn = document.getElementById("play")
const stopBtn = document.getElementById("stop")
const autoNextEl = document.getElementById("autoNext")

function setStatus(text) {
  statusEl.textContent = text
}

async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
}

async function loadSettings() {
  const data = await browser.storage.local.get("autoNext")
  autoNextEl.checked = Boolean(data?.autoNext)
}

autoNextEl.addEventListener("change", async () => {
  await browser.storage.local.set({ autoNext: autoNextEl.checked })
})

loadSettings()

playBtn.addEventListener("click", async () => {
  const tab = await getActiveTab()
  if (!tab?.id) return setStatus("No hay pestaña activa")
  const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-read-start" })
  if (resp?.ok) setStatus("Reproduciendo")
  else setStatus(resp?.error || "No se pudo iniciar")
})

stopBtn.addEventListener("click", async () => {
  const tab = await getActiveTab()
  if (!tab?.id) return setStatus("No hay pestaña activa")
  await browser.tabs.sendMessage(tab.id, { type: "vb-read-stop" })
  setStatus("Detenido")
})
