const MENU_READ = "vb-read-start"
const MENU_PAUSE = "vb-read-pause"
const MENU_RESUME = "vb-read-resume"
const MENU_NEXT = "vb-read-next"
const MENU_STOP = "vb-read-stop"

function createMenus() {
  browser.contextMenus.removeAll()
  browser.contextMenus.create({
    id: MENU_READ,
    title: "Iniciar lectura (F8)",
    contexts: ["page"],
    icons: {
      "48": "images/icon/play-button-green-icon.webp"
    },
    visible: false
  })
  browser.contextMenus.create({
    id: MENU_PAUSE,
    title: "Pausar lectura (F8)",
    contexts: ["page"],
    icons: {
      "48": "images/icon/pause-button-red-icon.png"
    },
    visible: false
  })
  browser.contextMenus.create({
    id: MENU_RESUME,
    title: "Reanudar lectura (F8)",
    contexts: ["page"],
    icons: {
      "48": "images/icon/play-button-green-icon.webp"
    },
    visible: false
  })
  browser.contextMenus.create({
    id: MENU_NEXT,
    title: "Saltar al siguiente post (F4)",
    contexts: ["page"],
    icons: {
      "48": "images/icon/music-player-play-next-square-icon.png"
    },
    visible: false
  })
  browser.contextMenus.create({
    id: MENU_STOP,
    title: "Detener lectura (mantener F8)",
    contexts: ["page"],
    icons: {
      "48": "images/icon/music-player-stop-square-icon.webp"
    },
    visible: false
  })
}

browser.runtime.onInstalled.addListener(() => {
  createMenus()
})

browser.runtime.onStartup.addListener(() => {
  createMenus()
})

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  let isThread = false
  try {
    const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-check" })
    isThread = Boolean(resp?.isThread)
  } catch {}
  if (!isThread) return
  if (info.menuItemId === MENU_READ) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-start" })
  }
  if (info.menuItemId === MENU_PAUSE) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-pause" })
  }
  if (info.menuItemId === MENU_RESUME) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-resume" })
  }
  if (info.menuItemId === MENU_NEXT) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-next" })
  }
  if (info.menuItemId === MENU_STOP) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-stop" })
  }
})

browser.contextMenus.onShown.addListener(async (info, tab) => {
  let isThread = false
  if (tab?.id) {
    try {
      const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-check" })
      isThread = Boolean(resp?.isThread)
    } catch {}
  }
  await browser.contextMenus.update(MENU_READ, { visible: isThread })
  await browser.contextMenus.update(MENU_PAUSE, { visible: isThread })
  await browser.contextMenus.update(MENU_RESUME, { visible: isThread })
  await browser.contextMenus.update(MENU_NEXT, { visible: isThread })
  await browser.contextMenus.update(MENU_STOP, { visible: isThread })
  browser.contextMenus.refresh()
})

browser.commands.onCommand.addListener(async command => {
  if (command !== "next-post") return
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]
  if (!tab?.id) return
  try {
    const resp = await browser.tabs.sendMessage(tab.id, { type: "vb-check" })
    if (!resp?.isThread) return
  } catch {
    return
  }
  if (command === "next-post") {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-next" })
  }
})
