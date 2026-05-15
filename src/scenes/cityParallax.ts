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
  const farCity = scene.add.image(cx, 338, CENTER_TEXTURES.farCity)
  farCity.setDepth(DEPTH.farCity)
  farCity.setScrollFactor(SCROLL.farCity, 1)
  farCity.setDisplaySize(fullW + 110, 360)
  farCity.setAlpha(0.52)
  farCity.setTint(0x8fa7c4)

  const midCity = scene.add.image(cx, 414, CENTER_TEXTURES.midCity)
  midCity.setDepth(DEPTH.midCity)
  midCity.setScrollFactor(SCROLL.midCity, 1)
  midCity.setDisplaySize(fullW + 70, 420)
  midCity.setAlpha(0.94)

  addLandmark(scene, CENTER_TEXTURES.administration, 150, 514, 385, SCROLL.landmarks)
  addLandmark(scene, CENTER_TEXTURES.kurultai, 470, 498, 350, SCROLL.landmarks)

  const street = scene.add.image(cx, worldHeight - 242, CENTER_TEXTURES.street)
  street.setDepth(DEPTH.street)
  street.setScrollFactor(SCROLL.street, 1)
  street.setDisplaySize(worldWidth + 92, 560)

  addProp(scene, CENTER_TEXTURES.prop3, 110, 416, 94, 0.5)
  addProp(scene, CENTER_TEXTURES.prop1, 80, worldHeight - 136, 172, 0.95)
  addProp(scene, CENTER_TEXTURES.prop2, worldWidth - 98, worldHeight - 120, 208, 0.9)
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
