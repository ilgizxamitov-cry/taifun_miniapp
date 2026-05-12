import Phaser from 'phaser'

/** Scroll factor X only — Y stays 1 so vertical camera motion stays stable with gameplay. */
const SCROLL = {
  skyTop: 0.05,
  skyHorizon: 0.08,
  distant: 0.16,
  mid: 0.36,
  foreground: 0.68,
} as const

const DEPTH = {
  skyTop: -60,
  skyHorizon: -58,
  distant: -48,
  mid: -38,
  foreground: -12,
} as const

const TEX_DISTANT = 'parallax_distant_skyline'
const TEX_MID = 'parallax_mid_blocks'
const W_TEX = 640
const H_DISTANT = 220
const H_MID = 180

/**
 * Static parallax planes (scrollFactor only — no per-frame updates).
 * Depths stay below the player/enemies (default depth 0).
 */
export function buildCityParallax(
  scene: Phaser.Scene,
  worldWidth: number,
  worldHeight: number,
): void {
  ensureTextures(scene)

  const pad = 240
  const fullW = worldWidth + pad * 2
  const cx = worldWidth / 2

  // --- Sky (cool, light) ---
  const skyTop = scene.add.rectangle(cx, 220, fullW, 520, 0x1a2234)
  skyTop.setDepth(DEPTH.skyTop)
  skyTop.setScrollFactor(SCROLL.skyTop, 1)
  skyTop.setAlpha(1)

  const skyBand = scene.add.rectangle(cx, 480, fullW, 420, 0x242a3d)
  skyBand.setDepth(DEPTH.skyHorizon)
  skyBand.setScrollFactor(SCROLL.skyHorizon, 1)
  skyBand.setAlpha(0.95)

  // --- Distant skyline (silhouette tile) ---
  const distantY = worldHeight - 780
  const distant = scene.add.tileSprite(cx, distantY, fullW, H_DISTANT, TEX_DISTANT)
  distant.setDepth(DEPTH.distant)
  distant.setScrollFactor(SCROLL.distant, 1)
  distant.setAlpha(0.92)
  distant.setTint(0x5c6b88)

  // --- Midground (warmer accents, still “far”) ---
  const midY = worldHeight - 620
  const mid = scene.add.tileSprite(cx, midY, fullW, H_MID, TEX_MID)
  mid.setDepth(DEPTH.mid)
  mid.setScrollFactor(SCROLL.mid, 1)
  mid.setAlpha(0.88)

  // --- Foreground (dark — silhouettes, frames play space) ---
  const fgStripH = 200
  const fgY = worldHeight - 120 - fgStripH / 2
  const fg = scene.add.rectangle(cx, fgY, fullW, fgStripH, 0x080a10)
  fg.setDepth(DEPTH.foreground)
  fg.setScrollFactor(SCROLL.foreground, 1)
  fg.setAlpha(0.55)

  let x = -pad
  while (x < worldWidth + pad) {
    const w = Phaser.Math.Between(28, 90)
    const h = Phaser.Math.Between(72, 160)
    const bx = x + w / 2
    const bar = scene.add.rectangle(bx, fgY - h / 2 + 20, w, h, 0x0c1018)
    bar.setDepth(DEPTH.foreground)
    bar.setScrollFactor(SCROLL.foreground, 1)
    bar.setAlpha(0.65)
    x += w + Phaser.Math.Between(14, 52)
  }
}

function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(TEX_DISTANT)) {
    const g = scene.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x1c2436)
    g.fillRect(0, 80, W_TEX, H_DISTANT - 80)
    let sx = 0
    while (sx < W_TEX) {
      const bw = Phaser.Math.Between(36, 96)
      const bh = Phaser.Math.Between(90, H_DISTANT - 20)
      const bx = sx + Phaser.Math.Between(0, 12)
      g.fillStyle(0x151c2c)
      g.fillRect(bx, H_DISTANT - bh, bw, bh)
      g.fillStyle(0x253048)
      g.fillRect(bx + 4, H_DISTANT - bh + 10, Math.min(bw - 8, 22), Math.min(bh * 0.35, 48))
      sx += bw + Phaser.Math.Between(4, 18)
    }
    g.generateTexture(TEX_DISTANT, W_TEX, H_DISTANT)
    g.destroy()
  }

  if (!scene.textures.exists(TEX_MID)) {
    const g = scene.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x2a3348)
    g.fillRect(0, 60, W_TEX, H_MID - 40)
    let mx = 40
    while (mx < W_TEX - 40) {
      const w = Phaser.Math.Between(44, 100)
      const h = Phaser.Math.Between(70, H_MID - 30)
      g.fillStyle(0x343f56)
      g.fillRect(mx, H_MID - h, w, h)
      g.fillStyle(0xe8c48a)
      g.fillRect(mx + 8, H_MID - h + 14, 10, 12)
      g.fillRect(mx + w - 22, H_MID - h + 34, 8, 10)
      mx += w + Phaser.Math.Between(16, 40)
    }
    g.generateTexture(TEX_MID, W_TEX, H_MID)
    g.destroy()
  }
}
