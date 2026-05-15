import Phaser from 'phaser'
import type { Player } from './Player'

const TEX_KEY = 'enemy_placeholder'
const TEX_W = 28
const TEX_H = 36

const CHASE_SPEED = 118
const PRESSURE_SPEED = 150
const STOP_RADIUS = 34
const ACCELERATION = 8

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private defeatPending = false

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
    body.setMaxVelocity(PRESSURE_SPEED, PRESSURE_SPEED)
    body.setSize(22, 28)
    body.setOffset(3, 4)

    this.applyFacingFlip(1)
  }

  updateChase(player: Player): void {
    if (this.defeatPending) {
      return
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.hypot(dx, dy)

    if (dist <= STOP_RADIUS) {
      body.setVelocity(body.velocity.x * 0.72, body.velocity.y * 0.72)
      return
    }

    const pressure = dist > 210 ? PRESSURE_SPEED : CHASE_SPEED
    const tx = (dx / dist) * pressure
    const ty = (dy / dist) * pressure

    body.setVelocity(
      Phaser.Math.Linear(body.velocity.x, tx, ACCELERATION / 60),
      Phaser.Math.Linear(body.velocity.y, ty, ACCELERATION / 60),
    )
    this.applyFacingFlip(dx)
  }

  /** Backwards-compatible scene hook name, now arena-chases instead of patrolling. */
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
