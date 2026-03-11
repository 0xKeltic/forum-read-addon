let isReading = false
let utterQueue = []
let currentIndex = 0
let autoNextEnabled = false

function detectLanguageFromDom() {
  const htmlLang = document.documentElement?.lang?.trim()
  if (htmlLang) return htmlLang
  const meta = document.querySelector(
    'meta[http-equiv="Content-Language"], meta[name="content-language"], meta[name="language"]'
  )
  const metaLang = meta?.getAttribute("content")?.trim()
  if (metaLang) return metaLang
  return navigator.language || "en"
}

function detectLanguageFromText(text) {
  const sample = text.slice(0, 5000).toLowerCase()
  const scores = {
    es: [" el ", " la ", " que ", " de ", " y ", " los ", " las ", " por ", " para "],
    en: [" the ", " and ", " to ", " of ", " in ", " is ", " that ", " for "],
    pt: [" que ", " de ", " e ", " o ", " os ", " as ", " por ", " para "]
  }
  let bestLang = ""
  let bestScore = 0
  for (const [lang, tokens] of Object.entries(scores)) {
    let score = 0
    for (const token of tokens) {
      if (sample.includes(token)) score += 1
    }
    if (score > bestScore) {
      bestLang = lang
      bestScore = score
    }
  }
  return bestScore > 0 ? bestLang : ""
}

function pickVoiceForLang(lang, voices) {
  const norm = (lang || "").toLowerCase()
  const exact = voices.find(v => v.lang && v.lang.toLowerCase() === norm)
  if (exact) return exact
  const prefix = norm.split("-")[0]
  const byPrefix = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix))
  if (byPrefix) return byPrefix
  return voices[0] || null
}

function getVoicesAsync() {
  return new Promise(resolve => {
    const voices = speechSynthesis.getVoices()
    if (voices.length) return resolve(voices)
    const handler = () => {
      const updated = speechSynthesis.getVoices()
      speechSynthesis.removeEventListener("voiceschanged", handler)
      resolve(updated)
    }
    speechSynthesis.addEventListener("voiceschanged", handler)
  })
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim()
}

function removeUnwantedNodes(root) {
  const selectors = [
    "blockquote",
    ".quote",
    ".bbcode_quote",
    ".signature",
    ".postsignature",
    ".sig"
  ]
  for (const sel of selectors) {
    root.querySelectorAll(sel).forEach(n => n.remove())
  }
}

function extractPostText(post) {
  const clone = post.cloneNode(true)
  removeUnwantedNodes(clone)
  const byId = clone.querySelector('[id^="post_message_"]')
  if (byId) return normalizeText(byId.innerText || "")
  const contentSelectors = [
    ".postcontent",
    ".post_message",
    ".postbody",
    ".postbitmessage",
    ".postcontent .content",
    ".message"
  ]
  for (const sel of contentSelectors) {
    const node = clone.querySelector(sel)
    if (node) return normalizeText(node.innerText || "")
  }
  return normalizeText(clone.innerText || "")
}

function extractAuthor(post) {
  const messageRoot =
    post?.id && post.id.startsWith("post_message_")
      ? post.closest(".postbit_wrapper, [id^='post']")
      : null
  const candidates = [
    post,
    messageRoot,
    post.closest(".postbit_wrapper"),
    post.closest(".postbit"),
    post.closest(".postbitlegacy"),
    post.closest(".postcontainer"),
    post.closest("table"),
    post.closest("tbody"),
    post.closest("tr")
  ].filter(Boolean)

  for (const container of candidates) {
    const author = findAuthorInContainer(container)
    if (author) return author
  }
  return ""
}

function findAuthorInContainer(container) {
  const byPostMenu = container.querySelector('[id^="postmenu_"] a')
  if (byPostMenu) {
    const name = normalizeUserText(byPostMenu.textContent || byPostMenu.getAttribute("title"))
    if (isLikelyUsername(name)) return name
  }
  const profileLink = container.querySelector(
    'a[href*="member.php?u="], a[href*="member.php?username="], a[href*="member.php"]'
  )
  if (profileLink) {
    const name = normalizeUserText(profileLink.textContent || profileLink.getAttribute("title"))
    if (isLikelyUsername(name)) return name
  }
  const selectors = [
    "a.bigusername",
    ".bigusername",
    ".username_container a",
    ".username_container strong",
    ".postusername",
    ".postbitusername",
    ".userinfo .username",
    ".postdetails .bigusername",
    ".postdetails .username",
    ".username"
  ]
  for (const sel of selectors) {
    const node = container.querySelector(sel)
    const name = normalizeUserText(node?.textContent || node?.getAttribute("title"))
    if (isLikelyUsername(name)) return name
  }
  return ""
}

function normalizeUserText(text) {
  if (!text) return ""
  return normalizeText(text.replace(/^@/, ""))
}

function isLikelyUsername(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  const bad = [
    "forocoches",
    "usuario",
    "miembro",
    "forero premium",
    "since",
    "no banear"
  ]
  if (bad.some(word => lower === word || lower.startsWith(word))) return false
  if (name.length < 2) return false
  return true
}

function extractDate(post) {
  const selectors = [
    ".postdate",
    ".postdetails .date",
    ".date",
    ".posthead",
    ".thead",
    ".time",
    "time",
    "span.date"
  ]
  for (const sel of selectors) {
    const node = post.querySelector(sel)
    if (node?.textContent) return normalizeText(node.textContent)
  }
  return ""
}

function cleanThreadTitle(text) {
  if (!text) return ""
  let title = normalizeText(text)
  const separators = [" - ", " | ", " — ", " – "]
  for (const sep of separators) {
    const idx = title.indexOf(sep)
    if (idx > 0) {
      title = title.slice(0, idx)
      break
    }
  }
  return title
}

function extractThreadTitle() {
  const selectors = [
    "h1.threadtitle",
    "#threadtitle",
    ".threadtitle",
    "h1"
  ]
  for (const sel of selectors) {
    const node = document.querySelector(sel)
    const title = cleanThreadTitle(node?.textContent || "")
    if (title) return title
  }
  const docTitle = cleanThreadTitle(document.title || "")
  if (docTitle) return docTitle
  return ""
}

function getCurrentPageNumber() {
  const url = new URL(window.location.href)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function getThreadIdFromUrl(url) {
  const parsed = new URL(url, window.location.href)
  return parsed.searchParams.get("t")
}

function findNextPageUrl() {
  const currentUrl = new URL(window.location.href)
  const currentPage = getCurrentPageNumber()
  const currentThread = currentUrl.searchParams.get("t")
  const links = Array.from(document.querySelectorAll('a[href*="page="]'))
  let bestUrl = ""
  let bestPage = Infinity
  for (const link of links) {
    const href = link.getAttribute("href")
    if (!href) continue
    const parsed = new URL(href, currentUrl)
    if (currentThread && parsed.searchParams.get("t") !== currentThread) continue
    if (!currentThread && parsed.pathname !== currentUrl.pathname) continue
    const pageValue = parseInt(parsed.searchParams.get("page") || "", 10)
    if (!Number.isFinite(pageValue)) continue
    if (pageValue > currentPage && pageValue < bestPage) {
      bestPage = pageValue
      bestUrl = parsed.href
    }
  }
  return bestUrl || ""
}

function setAutoNextActive(active) {
  if (active) sessionStorage.setItem("vbReadAutoNextActive", "1")
  else sessionStorage.removeItem("vbReadAutoNextActive")
}

function isAutoNextActive() {
  return sessionStorage.getItem("vbReadAutoNextActive") === "1"
}

async function loadAutoNextSetting() {
  try {
    const data = await browser.storage.local.get("autoNext")
    autoNextEnabled = Boolean(data?.autoNext)
  } catch {
    autoNextEnabled = false
  }
  if (!autoNextEnabled) setAutoNextActive(false)
}

function goToNextPageIfAvailable() {
  const nextUrl = findNextPageUrl()
  if (!nextUrl) {
    setAutoNextActive(false)
    return false
  }
  setAutoNextActive(true)
  window.location.href = nextUrl
  return true
}

function findPosts() {
  const roots = new Set()
  const messageNodes = Array.from(document.querySelectorAll('[id^="post_message_"]'))
  for (const node of messageNodes) {
    const root =
      node.closest(".postbit_wrapper") ||
      node.closest(".postbit, .postbitlegacy, .postcontainer, .post, [id^='post']") ||
      node.closest("table, li, div, article") ||
      node.parentElement
    if (root) roots.add(root)
  }
  if (roots.size > 0) return Array.from(roots)
  const selectors = [
    ".postbit_wrapper",
    ".postbit",
    ".postbitlegacy",
    ".postcontainer",
    ".post",
    "#posts .postbit",
    "#posts .post",
    "table[id^='post']",
    "li[id^='post']",
    "div[id^='post']"
  ]
  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel))
    if (nodes.length > 0) return nodes
  }
  return []
}

function isVBulletinThread() {
  if (document.querySelector('meta[name="generator"][content*="vBulletin"]')) return true
  if (document.querySelector("#posts")) return true
  return findPosts().length > 1
}

function buildPostTexts(posts) {
  const list = []
  const threadTitle = extractThreadTitle()
  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i]
    const author = extractAuthor(post)
    const date = extractDate(post)
    const body = extractPostText(post)
    if (!body) continue
    const header = [author, date].filter(Boolean).join(" - ")
    const parts = []
    const isFirst = i === 0
    if (isFirst && threadTitle) list.push({ text: `Título del hilo: ${threadTitle}`, pauseMs: 500 })
    if (author) {
      if (isFirst) list.push({ text: `Creador del hilo, ${author}`, pauseMs: 250 })
      else list.push({ text: `Usuario ${author}`, pauseMs: 250 })
    }
    if (header && !author) parts.push(header)
    parts.push(body)
    const postText = parts.join("\n")
    if (postText) list.push({ text: postText, pauseMs: 500 })
  }
  return list
}

function splitIntoChunks(text, maxLength = 1500) {
  const chunks = []
  let buffer = ""
  const paragraphs = text.split(/\n+/)
  for (const p of paragraphs) {
    const part = p.trim()
    if (!part) continue
    if ((buffer + " " + part).length > maxLength) {
      if (buffer) chunks.push(buffer.trim())
      buffer = part
    } else {
      buffer = buffer ? `${buffer} ${part}` : part
    }
  }
  if (buffer) chunks.push(buffer.trim())
  return chunks
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function findPostsWithRetry(tries = 3, delayMs = 500) {
  for (let i = 0; i < tries; i += 1) {
    const posts = findPosts()
    if (posts.length) return posts
    await delay(delayMs)
  }
  return []
}

async function startReadingThread() {
  if (isReading) return { ok: true }
  if (!isVBulletinThread()) return { ok: false, error: "No parece un hilo vBulletin" }
  await loadAutoNextSetting()
  const posts = await findPostsWithRetry()
  if (!posts.length) return { ok: false, error: "No se encontraron posts" }
  const postTexts = buildPostTexts(posts)
  if (!postTexts.length) return { ok: false, error: "No hay texto para leer" }
  const fullText = postTexts.map(item => item.text).join("\n")
  const voices = await getVoicesAsync()
  const lang = detectLanguageFromText(fullText) || detectLanguageFromDom()
  const voice = pickVoiceForLang(lang, voices)
  utterQueue = []
  for (const postItem of postTexts) {
    const chunks = splitIntoChunks(postItem.text)
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i]
      const utter = new SpeechSynthesisUtterance(chunk)
      if (voice) utter.voice = voice
      utter.lang = voice?.lang || lang
      utter.rate = 1
      utter.pitch = 1
      utter.volume = 1
      const pauseMs = i === chunks.length - 1 ? postItem.pauseMs || 0 : 0
      utterQueue.push({ utter, pauseMs })
    }
  }
  isReading = true
  currentIndex = 0
  playNext()
  return { ok: true }
}

function playNext() {
  if (!isReading) return
  const item = utterQueue[currentIndex]
  if (!item) {
    const shouldAutoNext = autoNextEnabled
    stopReading(!shouldAutoNext)
    if (shouldAutoNext) {
      setTimeout(() => {
        goToNextPageIfAvailable()
      }, 500)
    }
    return
  }
  const { utter, pauseMs } = item
  utter.onend = () => {
    currentIndex += 1
    if (pauseMs > 0) setTimeout(playNext, pauseMs)
    else playNext()
  }
  speechSynthesis.speak(utter)
}

function stopReading() {
  let clearAutoNext = true
  if (arguments.length > 0) clearAutoNext = Boolean(arguments[0])
  isReading = false
  currentIndex = 0
  utterQueue = []
  speechSynthesis.cancel()
  if (clearAutoNext) setAutoNextActive(false)
}

browser.runtime.onMessage.addListener(message => {
  if (message?.type === "vb-read-start") return startReadingThread()
  if (message?.type === "vb-read-stop") {
    stopReading()
    return { ok: true }
  }
})

if (isAutoNextActive()) {
  startReadingThread()
}

window.__vbReaderAutoStarted = true
