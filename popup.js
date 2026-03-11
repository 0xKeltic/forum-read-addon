const statusEl = document.getElementById("status")
const playBtn = document.getElementById("play")
const stopBtn = document.getElementById("stop")

function setStatus(text) {
  statusEl.textContent = text
}

async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
}

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
