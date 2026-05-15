import Phaser from 'phaser'

export const STREET_NAVIGATION = {
  edgeMarginX: 92,
  topY: 505,
  sidewalkBottomY: 620,
  roadTopY: 620,
  bottomY: 835,
  propBottomMinY: 570,
  propBottomMaxY: 835,
} as const

export function clampToStreetNavigation(
  x: number,
  y: number,
  worldWidth: number,
): { x: number; y: number } {
  return {
    x: Phaser.Math.Clamp(
      x,
      STREET_NAVIGATION.edgeMarginX,
      worldWidth - STREET_NAVIGATION.edgeMarginX,
    ),
    y: Phaser.Math.Clamp(y, STREET_NAVIGATION.topY, STREET_NAVIGATION.bottomY),
  }
}

export function clampStreetPropBottomY(y: number): number {
  return Phaser.Math.Clamp(
    y,
    STREET_NAVIGATION.propBottomMinY,
    STREET_NAVIGATION.propBottomMaxY,
  )
}

export function constrainArcadeSpriteToStreetNavigation(
  sprite: Phaser.Physics.Arcade.Sprite,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body
  const worldWidth = sprite.scene.physics.world.bounds.width
  const clamped = clampToStreetNavigation(sprite.x, sprite.y, worldWidth)

  sprite.x = clamped.x
  sprite.y = clamped.y

  if (
    (body.velocity.x < 0 && clamped.x <= STREET_NAVIGATION.edgeMarginX) ||
    (body.velocity.x > 0 && clamped.x >= worldWidth - STREET_NAVIGATION.edgeMarginX)
  ) {
    body.setVelocityX(0)
  }

  if (
    (body.velocity.y < 0 && clamped.y <= STREET_NAVIGATION.topY) ||
    (body.velocity.y > 0 && clamped.y >= STREET_NAVIGATION.bottomY)
  ) {
    body.setVelocityY(0)
  }
}
