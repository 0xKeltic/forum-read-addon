const MENU_READ = "vb-read-start"
const MENU_STOP = "vb-read-stop"

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkThreadForTab(tabId) {
  for (let i = 0; i < 2; i += 1) {
    try {
      const resp = await browser.tabs.sendMessage(tabId, { type: "vb-check" })
      return Boolean(resp?.isThread)
    } catch {
      await delay(200)
    }
  }
  return false
}

function createMenus() {
  browser.contextMenus.removeAll()
  browser.contextMenus.create({
    id: MENU_READ,
    title: "Leer posts del hilo (F8)",
    contexts: ["page"],
    icons: {
      "48": "images/icon/play-button-green-icon.webp"
    },
    visible: false
  })
  browser.contextMenus.create({
    id: MENU_STOP,
    title: "Detener lectura (F8)",
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
  const isThread = await checkThreadForTab(tab.id)
  if (!isThread) return
  if (info.menuItemId === MENU_READ) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-start" })
  }
  if (info.menuItemId === MENU_STOP) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-stop" })
  }
})

browser.contextMenus.onShown.addListener(async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]
  let isThread = false
  if (tab?.id) {
    isThread = await checkThreadForTab(tab.id)
  }
  await browser.contextMenus.update(MENU_READ, { visible: isThread })
  await browser.contextMenus.update(MENU_STOP, { visible: isThread })
  browser.contextMenus.refresh()
})

browser.commands.onCommand.addListener(async command => {
  if (command !== "toggle-read") return
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]
  if (!tab?.id) return
  const isThread = await checkThreadForTab(tab.id)
  if (!isThread) return
  await browser.tabs.sendMessage(tab.id, { type: "vb-read-toggle" })
})
