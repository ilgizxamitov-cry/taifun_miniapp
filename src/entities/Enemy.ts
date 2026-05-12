import Phaser from 'phaser'

const TEX_KEY = 'enemy_placeholder'
const TEX_W = 28
const TEX_H = 36

const PATROL_SPEED = 88

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private readonly patrolMinX: number
  private readonly patrolMaxX: number
  private direction = 1
  private defeatPending = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolMinX: number,
    patrolMaxX: number,
  ) {
    Enemy.ensureTexture(scene)
    super(scene, x, y, TEX_KEY)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.patrolMinX = patrolMinX
    this.patrolMaxX = patrolMaxX

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    body.setSize(22, 28)
    body.setOffset(3, 4)

    this.applyFacingFlip()
  }

  updatePatrol(): void {
    if (this.defeatPending) {
      return
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(PATROL_SPEED * this.direction)

    if (this.x >= this.patrolMaxX) {
      this.setX(this.patrolMaxX)
      this.direction = -1
      this.applyFacingFlip()
    } else if (this.x <= this.patrolMinX) {
      this.setX(this.patrolMinX)
      this.direction = 1
      this.applyFacingFlip()
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

  private applyFacingFlip(): void {
    this.setFlipX(this.direction < 0)
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
