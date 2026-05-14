import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { MobileControls } from '../ui/MobileControls'
import { buildCityParallax } from './cityParallax'

const WORLD_WIDTH = 640
const WORLD_HEIGHT = 960
const ARENA_CENTER_X = WORLD_WIDTH / 2
const ARENA_CENTER_Y = WORLD_HEIGHT / 2
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
  private mobileControls!: MobileControls

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
    this.buildArena()

    this.player = new Player(this, ARENA_CENTER_X, ARENA_CENTER_Y, 'player_placeholder')
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.mobileControls = new MobileControls(this)
    this.player.bindCursorKeys(this.cursors)
    this.player.bindMobileControls(this.mobileControls)

    this.spawnEnemies()
    this.buildHud()

    this.cameras.main.startFollow(this.player, true, 0.06, 0.06)
    this.cameras.main.setDeadzone(64, 96)
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

  private buildArena(): void {
    const floor = this.add.rectangle(
      ARENA_CENTER_X,
      ARENA_CENTER_Y,
      WORLD_WIDTH - 48,
      WORLD_HEIGHT - 96,
      0x232b3d,
    )
    floor.setDepth(-20)
    floor.setStrokeStyle(3, 0x60708f, 0.52)

    const inner = this.add.rectangle(
      ARENA_CENTER_X,
      ARENA_CENTER_Y,
      WORLD_WIDTH - 128,
      WORLD_HEIGHT - 220,
      0x2a3348,
    )
    inner.setDepth(-19)
    inner.setAlpha(0.42)
    inner.setStrokeStyle(2, 0x9fb5da, 0.18)

    const ring = this.add.ellipse(
      ARENA_CENTER_X,
      ARENA_CENTER_Y,
      330,
      430,
      0x101824,
      0.16,
    )
    ring.setDepth(-18)
    ring.setStrokeStyle(2, 0xffd166, 0.26)

    const vignetteTop = this.add.rectangle(ARENA_CENTER_X, 46, WORLD_WIDTH, 92, 0x070a11)
    vignetteTop.setDepth(-10)
    vignetteTop.setAlpha(0.24)

    const vignetteBottom = this.add.rectangle(ARENA_CENTER_X, WORLD_HEIGHT - 46, WORLD_WIDTH, 92, 0x070a11)
    vignetteBottom.setDepth(-10)
    vignetteBottom.setAlpha(0.3)
  }

  private spawnEnemies(): void {
    const placements: [number, number][] = [
      [ARENA_CENTER_X - 120, ARENA_CENTER_Y - 120],
      [ARENA_CENTER_X + 135, ARENA_CENTER_Y - 82],
      [ARENA_CENTER_X - 92, ARENA_CENTER_Y + 138],
      [ARENA_CENTER_X + 118, ARENA_CENTER_Y + 116],
    ]

    for (const [x, y] of placements) {
      const enemy = new Enemy(this, x, y)
      this.enemies.push(enemy)
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
        enemy.updateChase(this.player)
      }
    }

    this.resolveAttackDefeats()
  }
}
