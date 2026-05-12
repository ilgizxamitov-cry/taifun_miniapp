import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { buildCityParallax } from './cityParallax'
import { MobileControls } from '../ui/MobileControls'

const WORLD_WIDTH = 4800
const WORLD_HEIGHT = 1400
const SKY_COLOR = 0x1a1f2e

/** Strike defeat radius — placeholder until hitboxes exist. */
const ATTACK_DEFEAT_RADIUS = 92

const HITSTOP_PHYS_SCALE = 0.26
const HITSTOP_TIME_SCALE = 0.26
const HITSTOP_REAL_MS = 52

const SHAKE_MS = 110
const SHAKE_INTENSITY = 0.0042

const SPARK_COUNT = 9
const SPARK_TEX_KEY = 'hit_spark_dot'

export class CityScene extends Phaser.Scene {
  private player!: Player
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private platforms!: Phaser.Physics.Arcade.StaticGroup

  private enemies: Enemy[] = []
  private defeatedCount = 0
  private counterText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'CityScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SKY_COLOR)

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    buildCityParallax(this, WORLD_WIDTH, WORLD_HEIGHT)

    this.ensureCombatFxTextures()
    this.buildPlaceholderTextures()
    this.buildGround()

    this.player = new Player(this, 320, 860, 'player_placeholder')
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.player.bindCursorKeys(this.cursors)
    this.player.bindMobileControls(new MobileControls(this))

    this.physics.add.collider(this.player, this.platforms)

    this.spawnEnemies()
    this.buildHud()

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(80, 48)
  }

  private ensureCombatFxTextures(): void {
    if (this.textures.exists(SPARK_TEX_KEY)) {
      return
    }
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff)
    g.fillCircle(3, 3, 3)
    g.generateTexture(SPARK_TEX_KEY, 6, 6)
    g.destroy()
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

  private spawnEnemies(): void {
    const placements: [number, number, number, number][] = [
      [950, 1295, 620, 1180],
      [2150, 1295, 1780, 2480],
      [3550, 1295, 3050, 3920],
    ]

    for (const [x, y, minX, maxX] of placements) {
      const enemy = new Enemy(this, x, y, minX, maxX)
      this.enemies.push(enemy)
      this.physics.add.collider(enemy, this.platforms)
    }
  }

  private buildHud(): void {
    this.counterText = this.add.text(14, 12, 'Defeated: 0', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#e8f0ff',
    })
    this.counterText.setScrollFactor(0)
    this.counterText.setDepth(1000)
    this.counterText.setStroke('#0a0c12', 5)
  }

  private refreshDefeatCounter(): void {
    this.counterText.setText(`Defeated: ${this.defeatedCount}`)
  }

  private triggerCombatImpact(worldX: number, worldY: number): void {
    this.cameras.main.shake(SHAKE_MS, SHAKE_INTENSITY)
    this.spawnHitSparks(worldX, worldY)
    this.applyBriefHitstop()
  }

  /** Tiny additive sparks — tweens only, no heavy emitter graph. */
  private spawnHitSparks(wx: number, wy: number): void {
    const tintChoices = [0xffffff, 0xfff2bb, 0xffa8d8, 0xb8fff6]

    for (let i = 0; i < SPARK_COUNT; i++) {
      const spark = this.add.image(wx, wy, SPARK_TEX_KEY)
      spark.setDepth(900)
      spark.setBlendMode(Phaser.BlendModes.ADD)
      spark.setTint(Phaser.Math.RND.pick(tintChoices))

      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const dist = Phaser.Math.FloatBetween(28, 78)
      const tx = wx + Math.cos(ang) * dist
      const ty = wy + Math.sin(ang) * dist - Phaser.Math.FloatBetween(0, 22)

      this.tweens.add({
        targets: spark,
        x: tx,
        y: ty,
        alpha: 0,
        scaleX: 0.25,
        scaleY: 0.25,
        duration: Phaser.Math.Between(125, 205),
        ease: Phaser.Math.Easing.Cubic.Out,
        onComplete: () => spark.destroy(),
      })
    }
  }

  /** Real-time restore so hitstop ends cleanly even when scene timeScale dips. */
  private applyBriefHitstop(): void {
    this.physics.world.timeScale = HITSTOP_PHYS_SCALE
    this.time.timeScale = HITSTOP_TIME_SCALE

    window.setTimeout(() => {
      if (!this.sys.isActive()) {
        return
      }
      this.physics.world.timeScale = 1
      this.time.timeScale = 1
    }, HITSTOP_REAL_MS)
  }

  private resolveAttackDefeats(): void {
    if (!this.player.isAttackActive()) {
      return
    }

    const px = this.player.x
    const py = this.player.y
    const r = ATTACK_DEFEAT_RADIUS * ATTACK_DEFEAT_RADIUS

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]
      if (!enemy.active) {
        this.enemies.splice(i, 1)
        continue
      }

      const dx = px - enemy.x
      const dy = py - enemy.y
      if (dx * dx + dy * dy <= r) {
        this.enemies.splice(i, 1)
        this.defeatedCount++
        this.refreshDefeatCounter()

        this.triggerCombatImpact(enemy.x, enemy.y)
        enemy.playDefeatFeedback(this)
      }
    }
  }

  update(): void {
    this.player.update()

    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.updatePatrol()
      }
    }

    this.resolveAttackDefeats()
  }
}
