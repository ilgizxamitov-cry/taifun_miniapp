import Phaser from 'phaser'
import { Player } from '../entities/Player'

const WORLD_WIDTH = 4800
const WORLD_HEIGHT = 1400
const SKY_COLOR = 0x1a1f2e

export class CityScene extends Phaser.Scene {
  private player!: Player
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private platforms!: Phaser.Physics.Arcade.StaticGroup

  constructor() {
    super({ key: 'CityScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SKY_COLOR)

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.buildPlaceholderTextures()
    this.buildGround()

    this.player = new Player(this, 320, 860, 'player_placeholder')
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.player.bindCursorKeys(this.cursors)

    this.physics.add.collider(this.player, this.platforms)

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(80, 48)
  }

  private buildPlaceholderTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xff5c6c)
    g.fillRect(0, 0, 32, 48)
    g.fillStyle(0xffe08a)
    g.fillRect(10, 12, 12, 10)
    g.generateTexture('player_placeholder', 32, 48)
    g.destroy()
  }

  private buildGround(): void {
    this.platforms = this.physics.add.staticGroup()

    const ground = this.add.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT - 40,
      WORLD_WIDTH,
      80,
      0x3a4258,
    )
    ground.setStrokeStyle(2, 0x2a3144)
    this.physics.add.existing(ground, true)

    this.platforms.add(ground)

    const ledge = this.add.rectangle(1400, 920, 280, 24, 0x4b5568)
    ledge.setStrokeStyle(2, 0x343c4f)
    this.physics.add.existing(ledge, true)
    this.platforms.add(ledge)

    const ledge2 = this.add.rectangle(2600, 780, 220, 24, 0x4b5568)
    ledge2.setStrokeStyle(2, 0x343c4f)
    this.physics.add.existing(ledge2, true)
    this.platforms.add(ledge2)
  }

  update(): void {
    this.player.update()
  }
}
