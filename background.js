const MENU_READ = "vb-read-start"
const MENU_STOP = "vb-read-stop"

function createMenus() {
  browser.contextMenus.removeAll()
  browser.contextMenus.create({
    id: MENU_READ,
    title: "Leer posts del hilo",
    contexts: ["page"],
    icons: {
      "48": "images/icon/play-button-green-icon.webp"
    }
  })
  browser.contextMenus.create({
    id: MENU_STOP,
    title: "Detener lectura",
    contexts: ["page"],
    icons: {
      "48": "images/icon/music-player-stop-square-icon.webp"
    }
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
  if (info.menuItemId === MENU_READ) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-start" })
  }
  if (info.menuItemId === MENU_STOP) {
    await browser.tabs.sendMessage(tab.id, { type: "vb-read-stop" })
  }
})
