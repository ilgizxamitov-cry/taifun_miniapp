import Phaser from 'phaser'

const SPEED = 260
const JUMP_VELOCITY = -470

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setCollideWorldBounds(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocity(SPEED + 40, 980)
    body.setSize(26, 42)
    body.setOffset(3, 6)
  }

  bindCursorKeys(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    this.cursors = cursors
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body

    if (this.cursors.left.isDown) {
      body.setVelocityX(-SPEED)
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(SPEED)
    } else {
      body.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && body.onFloor()) {
      body.setVelocityY(JUMP_VELOCITY)
    }
  }
}
