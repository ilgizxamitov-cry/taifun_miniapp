import Phaser from 'phaser'
import type { Player } from './Player'

const TEX_KEY = 'enemy_placeholder'
const TEX_W = 28
const TEX_H = 36

const WANDER_SPEED = 66
const APPROACH_SPEED = 104
const ARRIVE_RADIUS = 32
const PLAYER_INTEREST_RADIUS = 560
const SEPARATION_RADIUS = 78
const SEPARATION_PUSH = 74
const ACCELERATION = 0.09
const STREET_MARGIN_X = 86
const STREET_TOP_Y = 315
const STREET_BOTTOM_Y = 820

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private defeatPending = false
  private nextDecisionAt = 0
  private targetX = 0
  private targetY = 0
  private approachingUntil = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    Enemy.ensureTexture(scene)
    super(scene, x, y, TEX_KEY)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    body.setAllowGravity(false)
    body.setDamping(true)
    body.setDrag(650, 650)
    body.setMaxVelocity(APPROACH_SPEED, APPROACH_SPEED)
    body.setSize(22, 28)
    body.setOffset(3, 4)

    this.pickWanderTarget(scene.time.now)
    this.applyFacingFlip(1)
  }

  updateChase(player: Player, neighbors: Enemy[] = []): void {
    if (this.defeatPending) {
      return
    }

    const now = this.scene.time.now
    const body = this.body as Phaser.Physics.Arcade.Body
    const playerDx = player.x - this.x
    const playerDy = player.y - this.y
    const playerDist = Math.hypot(playerDx, playerDy)
    const targetDx = this.targetX - this.x
    const targetDy = this.targetY - this.y
    const targetDist = Math.hypot(targetDx, targetDy)

    if (now >= this.nextDecisionAt || targetDist < ARRIVE_RADIUS) {
      this.pickNextTarget(now, player, playerDist)
    }

    const desiredSpeed = now < this.approachingUntil ? APPROACH_SPEED : WANDER_SPEED
    let moveX = this.targetX - this.x
    let moveY = this.targetY - this.y
    let moveLen = Math.hypot(moveX, moveY)

    if (moveLen > 0) {
      moveX = (moveX / moveLen) * desiredSpeed
      moveY = (moveY / moveLen) * desiredSpeed
    }

    const separation = this.getSeparation(neighbors)
    moveX += separation.x
    moveY += separation.y

    moveLen = Math.hypot(moveX, moveY)
    if (moveLen > APPROACH_SPEED) {
      moveX = (moveX / moveLen) * APPROACH_SPEED
      moveY = (moveY / moveLen) * APPROACH_SPEED
    }

    body.setVelocity(
      Phaser.Math.Linear(body.velocity.x, moveX, ACCELERATION),
      Phaser.Math.Linear(body.velocity.y, moveY, ACCELERATION),
    )
    this.applyFacingFlip(body.velocity.x)
  }

  /** Backwards-compatible scene hook name, now district-wanders instead of stacking. */
  updatePatrol(player?: Player): void {
    if (player) {
      this.updateChase(player)
    }
  }

  /** Hit-stop styling only — physics stays disabled until destroy. */
  playDefeatFeedback(scene: Phaser.Scene): void {
    if (this.defeatPending) {
      return
    }
    this.defeatPending = true

    const body = this.body as Phaser.Physics.Arcade.Body
    body.stop()
    body.enable = false

    this.setTint(0xffffff)
    this.setScale(1.08)

    scene.tweens.add({
      targets: this,
      scaleX: 1.22,
      scaleY: 0.82,
      duration: 65,
      yoyo: true,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onYoyo: () => {
        this.setTint(0xffee88)
      },
      onComplete: () => {
        scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 95,
          ease: Phaser.Math.Easing.Cubic.In,
          onComplete: () => {
            this.destroy()
          },
        })
      },
    })
  }

  private pickNextTarget(now: number, player: Player, playerDist: number): void {
    const shouldApproach =
      playerDist < PLAYER_INTEREST_RADIUS && Phaser.Math.FloatBetween(0, 1) < 0.32

    if (shouldApproach) {
      const offsetX = Phaser.Math.RND.pick([-1, 1]) * Phaser.Math.Between(95, 190)
      const offsetY = Phaser.Math.Between(-125, 125)
      this.setTarget(player.x + offsetX, player.y + offsetY)
      this.approachingUntil = now + Phaser.Math.Between(750, 1250)
      this.nextDecisionAt = now + Phaser.Math.Between(900, 1500)
      return
    }

    this.pickWanderTarget(now)
  }

  private pickWanderTarget(now: number): void {
    this.setTarget(
      this.x + Phaser.Math.Between(-440, 440),
      this.y + Phaser.Math.Between(-210, 210),
    )
    this.approachingUntil = 0
    this.nextDecisionAt = now + Phaser.Math.Between(1500, 3200)
  }

  private setTarget(x: number, y: number): void {
    const worldWidth = this.scene.physics.world.bounds.width
    this.targetX = Phaser.Math.Clamp(x, STREET_MARGIN_X, worldWidth - STREET_MARGIN_X)
    this.targetY = Phaser.Math.Clamp(y, STREET_TOP_Y, STREET_BOTTOM_Y)
  }

  private getSeparation(neighbors: Enemy[]): { x: number; y: number } {
    let pushX = 0
    let pushY = 0

    for (const other of neighbors) {
      if (other === this || !other.active) {
        continue
      }

      const dx = this.x - other.x
      const dy = this.y - other.y
      const distSq = dx * dx + dy * dy
      if (distSq <= 0 || distSq > SEPARATION_RADIUS * SEPARATION_RADIUS) {
        continue
      }

      const dist = Math.sqrt(distSq)
      const strength = (1 - dist / SEPARATION_RADIUS) * SEPARATION_PUSH
      pushX += (dx / dist) * strength
      pushY += (dy / dist) * strength
    }

    return { x: pushX, y: pushY }
  }

  private applyFacingFlip(directionX: number): void {
    if (Math.abs(directionX) < 0.01) {
      return
    }
    this.setFlipX(directionX < 0)
  }

  private static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(TEX_KEY)) {
      return
    }

    const g = scene.make.graphics({ x: 0, y: 0 })

    g.fillStyle(0x1f3d38)
    g.fillEllipse(TEX_W / 2, TEX_H / 2 + 2, TEX_W - 4, TEX_H - 6)

    g.fillStyle(0x48ffc8)
    g.fillEllipse(TEX_W / 2, TEX_H / 2, TEX_W - 8, TEX_H - 10)

    g.fillStyle(0x102820)
    g.fillEllipse(TEX_W / 2 + 5, TEX_H / 2 - 2, 6, 7)

    g.fillStyle(0xff6b8a)
    g.fillRect(TEX_W / 2 + 2, TEX_H / 2 + 4, 8, 3)

    g.lineStyle(2, 0x0e1815, 1)
    g.strokeEllipse(TEX_W / 2, TEX_H / 2, TEX_W - 8, TEX_H - 10)

    g.generateTexture(TEX_KEY, TEX_W, TEX_H)
    g.destroy()
  }
}
