import Phaser from 'phaser'

const TEX_KEY = 'civilian_npc'
const TEX_W = 24
const TEX_H = 34

const WALK_SPEED = 54
const TURN_ACCELERATION = 0.08
const ARRIVE_RADIUS = 24
const STREET_MARGIN_X = 90
const STREET_TOP_Y = 315
const STREET_BOTTOM_Y = 820

const COLORS = [0x3b82f6, 0xf97316, 0x8b5cf6, 0x10b981] as const

export class Civilian extends Phaser.Physics.Arcade.Sprite {
  private nextDecisionAt = 0
  private targetX: number
  private targetY: number
  private paletteIndex: number

  constructor(scene: Phaser.Scene, x: number, y: number, paletteIndex: number) {
    Civilian.ensureTexture(scene)
    super(scene, x, y, TEX_KEY)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.paletteIndex = paletteIndex % COLORS.length
    this.targetX = x
    this.targetY = y

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    body.setAllowGravity(false)
    body.setDamping(true)
    body.setDrag(540, 540)
    body.setMaxVelocity(WALK_SPEED, WALK_SPEED)
    body.setSize(15, 23)
    body.setOffset(5, 8)

    this.setTint(COLORS[this.paletteIndex])
    this.setScale(1.05)
    this.pickNewTarget(scene.time.now)
  }

  updateWander(): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    const now = this.scene.time.now
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const dist = Math.hypot(dx, dy)

    if (now >= this.nextDecisionAt || dist < ARRIVE_RADIUS) {
      this.pickNewTarget(now)
      return
    }

    const tx = (dx / dist) * WALK_SPEED
    const ty = (dy / dist) * WALK_SPEED
    body.setVelocity(
      Phaser.Math.Linear(body.velocity.x, tx, TURN_ACCELERATION),
      Phaser.Math.Linear(body.velocity.y, ty, TURN_ACCELERATION),
    )

    if (Math.abs(dx) > 3) {
      this.setFlipX(dx < 0)
    }
  }

  private pickNewTarget(now: number): void {
    const worldWidth = this.scene.physics.world.bounds.width
    this.targetX = Phaser.Math.Clamp(
      this.x + Phaser.Math.Between(-380, 380),
      STREET_MARGIN_X,
      worldWidth - STREET_MARGIN_X,
    )
    this.targetY = Phaser.Math.Between(STREET_TOP_Y, STREET_BOTTOM_Y)
    this.nextDecisionAt = now + Phaser.Math.Between(1700, 3600)
  }

  private static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(TEX_KEY)) {
      return
    }

    const g = scene.make.graphics({ x: 0, y: 0 })

    g.fillStyle(0x3c2f2a)
    g.fillEllipse(12, 31, 18, 6)

    g.fillStyle(0xffffff)
    g.fillRoundedRect(7, 13, 11, 15, 3)

    g.fillStyle(0xffd3ad)
    g.fillEllipse(12, 8, 12, 12)

    g.fillStyle(0x2b211c)
    g.fillRect(7, 3, 10, 4)

    g.fillStyle(0x171717)
    g.fillRect(9, 8, 2, 2)
    g.fillRect(14, 8, 2, 2)

    g.fillStyle(0x2d3748)
    g.fillRect(8, 27, 4, 5)
    g.fillRect(14, 27, 4, 5)

    g.lineStyle(2, 0x1f2937, 1)
    g.strokeRoundedRect(7, 13, 11, 15, 3)

    g.generateTexture(TEX_KEY, TEX_W, TEX_H)
    g.destroy()
  }
}
