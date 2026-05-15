import Phaser from 'phaser'

/** Scroll factor X only — Y stays 1 so vertical camera motion stays stable with gameplay. */
const SCROLL = {
  sky: 0.02,
  farCity: 0.12,
  midCity: 0.26,
  landmarks: 0.38,
  street: 0.82,
  props: 0.92,
} as const

const DEPTH = {
  sky: -96,
  farCity: -84,
  midCity: -70,
  landmarks: -54,
  street: -28,
  props: -11,
} as const

export const CENTER_TEXTURES = {
  skyDay: 'center_sky_day',
  farCity: 'center_far_city',
  midCity: 'center_mid_city',
  street: 'center_street',
  kurultai: 'center_kurultai',
  administration: 'center_administration',
  prop1: 'center_prop_1',
  prop2: 'center_prop_2',
  prop3: 'center_prop_3',
} as const

/**
 * Static Center district composition using pre-rendered image planes.
 * Layering is scrollFactor-only, so it adds depth without update-loop cost.
 */
export function buildCityParallax(
  scene: Phaser.Scene,
  worldWidth: number,
  worldHeight: number,
): void {
  const cx = worldWidth / 2
  const fullW = worldWidth + 220

  const sky = scene.add.image(cx, 270, CENTER_TEXTURES.skyDay)
  sky.setDepth(DEPTH.sky)
  sky.setScrollFactor(SCROLL.sky, 1)
  sky.setDisplaySize(fullW, 540)

  // Far city uses the same source asset as a softened duplicate: there is no
  // separate far_city file in the delivered pack, but this still creates a real
  // far-city render layer with its own depth, scale, tint and parallax.
  addCityStrip(
    scene,
    CENTER_TEXTURES.farCity,
    338,
    720,
    360,
    DEPTH.farCity,
    SCROLL.farCity,
    0.52,
    0x8fa7c4,
  )
  addCityStrip(
    scene,
    CENTER_TEXTURES.midCity,
    414,
    650,
    420,
    DEPTH.midCity,
    SCROLL.midCity,
    0.94,
  )

  addLandmark(scene, CENTER_TEXTURES.kurultai, 390, 484, 270, 1)
  addLandmark(scene, CENTER_TEXTURES.administration, 2260, 510, 300, 1)

  const street = scene.add.image(cx, worldHeight - 242, CENTER_TEXTURES.street)
  street.setDepth(DEPTH.street)
  street.setScrollFactor(SCROLL.street, 1)
  street.setDisplaySize(worldWidth + 92, 560)

  for (const x of [190, 760, 1330, 1900, 2470]) {
    addProp(scene, CENTER_TEXTURES.prop3, x, 416, 78, 0.46)
  }
  addProp(scene, CENTER_TEXTURES.prop1, 120, worldHeight - 136, 138, 0.95)
  addProp(scene, CENTER_TEXTURES.prop2, 705, worldHeight - 120, 156, 0.86)
  addProp(scene, CENTER_TEXTURES.prop1, 1370, worldHeight - 132, 130, 0.9)
  addProp(scene, CENTER_TEXTURES.prop2, 1990, worldHeight - 124, 164, 0.86)
  addProp(scene, CENTER_TEXTURES.prop1, worldWidth - 132, worldHeight - 136, 142, 0.92)
}

function addCityStrip(
  scene: Phaser.Scene,
  texture: string,
  y: number,
  tileWidth: number,
  displayHeight: number,
  depth: number,
  scrollX: number,
  alpha: number,
  tint?: number,
): void {
  for (
    let x = tileWidth / 2;
    x < scene.physics.world.bounds.width + tileWidth;
    x += tileWidth
  ) {
    const strip = scene.add.image(x, y, texture)
    strip.setDepth(depth)
    strip.setScrollFactor(scrollX, 1)
    strip.setDisplaySize(tileWidth + 8, displayHeight)
    strip.setAlpha(alpha)
    if (tint !== undefined) {
      strip.setTint(tint)
    }
  }
}

function addLandmark(
  scene: Phaser.Scene,
  texture: string,
  x: number,
  bottomY: number,
  displayHeight: number,
  scrollX: number,
): void {
  const landmark = scene.add.image(x, bottomY, texture)
  landmark.setOrigin(0.5, 1)
  landmark.setDepth(DEPTH.landmarks)
  landmark.setScrollFactor(scrollX, 1)
  landmark.setDisplaySize(
    displayHeight * (landmark.width / landmark.height),
    displayHeight,
  )
}

function addProp(
  scene: Phaser.Scene,
  texture: string,
  x: number,
  bottomY: number,
  displayWidth: number,
  alpha: number,
): void {
  const prop = scene.add.image(x, bottomY, texture)
  prop.setOrigin(0.5, 1)
  prop.setDepth(DEPTH.props)
  prop.setScrollFactor(SCROLL.props, 1)
  prop.setDisplaySize(displayWidth, displayWidth * (prop.height / prop.width))
  prop.setAlpha(alpha)
}
