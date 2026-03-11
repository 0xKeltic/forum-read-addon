const statusEl = document.getElementById("status")
const playBtn = document.getElementById("play")
const pauseBtn = document.getElementById("pause")
const resumeBtn = document.getElementById("resume")
const nextBtn = document.getElementById("next")
const stopBtn = document.getElementById("stop")
const autoNextEl = document.getElementById("autoNext")
const omitDescriptorsEl = document.getElementById("omitDescriptors")

function setStatus(text, isError = false) {
  statusEl.textContent = text
  statusEl.classList.toggle("error", Boolean(isError))
}

function setDisabled(disabled) {
  playBtn.disabled = disabled
  pauseBtn.disabled = disabled
  resumeBtn.disabled = disabled
  nextBtn.disabled = disabled
  stopBtn.disabled = disabled
  autoNextEl.disabled = disabled
  omitDescriptorsEl.disabled = disabled
}

async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
}

async function loadSettings() {
  const data = await browser.storage.local.get(["autoNext", "omitDescriptors"])
  autoNextEl.checked = Boolean(data?.autoNext)
  omitDescriptorsEl.checked = Boolean(data?.omitDescriptors)
}

autoNextEl.addEventListener("change", async () => {
  await browser.storage.local.set({ autoNext: autoNextEl.checked })
})

omitDescriptorsEl.addEventListener("change", async () => {
  await browser.storage.local.set({ omitDescriptors: omitDescriptorsEl.checked })
})

loadSettings()

async function updateAvailability() {
  setDisabled(true)
  setStatus("Comprobando hilo...")
  const tab = await getActiveTab()
  if (!tab?.id) {
    setDisabled(true)
    setStatus("No hay pestaña activa", true)
    return
  }
  let isThread = false
  try {
    const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-check" })
    isThread = Boolean(resp?.isThread)
  } catch {}
  if (!isThread) {
    await new Promise(resolve => setTimeout(resolve, 250))
    try {
      const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-check" })
      isThread = Boolean(resp?.isThread)
    } catch {}
  }
  if (isThread) {
    setDisabled(false)
    setStatus("")
    return
  }
  setDisabled(true)
  setStatus("No es un hilo vBulletin", true)
}

updateAvailability()

playBtn.addEventListener("click", async () => {
  const tab = await getActiveTab()
  if (!tab?.id) return setStatus("No hay pestaña activa")
  const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-read-start" })
  if (resp?.ok) {
    setStatus("Reproduciendo")
  }
  else setStatus(resp?.error || "No se pudo iniciar")
})

pauseBtn.addEventListener("click", async () => {
  const tab = await getActiveTab()
  if (!tab?.id) return setStatus("No hay pestaña activa")
  const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-read-pause" })
  if (resp?.ok) setStatus("Pausado")
  else setStatus(resp?.error || "No se pudo pausar")
})

resumeBtn.addEventListener("click", async () => {
  const tab = await getActiveTab()
  if (!tab?.id) return setStatus("No hay pestaña activa")
  const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-read-resume" })
  if (resp?.ok) setStatus("Reanudado")
  else setStatus(resp?.error || "No se pudo reanudar")
})

stopBtn.addEventListener("click", async () => {
  const tab = await getActiveTab()
  if (!tab?.id) return setStatus("No hay pestaña activa")
  await browser.tabs.sendMessage(tab.id, { type: "vb-read-stop" })
  setStatus("Detenido")
})

nextBtn.addEventListener("click", async () => {
  const tab = await getActiveTab()
  if (!tab?.id) return setStatus("No hay pestaña activa")
  const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-read-next" })
  if (resp?.ok) setStatus("Saltado")
  else setStatus("No hay siguiente post")
})
