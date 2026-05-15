import Phaser from 'phaser'
import { Civilian } from '../entities/Civilian'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { clampToStreetNavigation } from '../systems/streetNavigation'
import { MobileControls } from '../ui/MobileControls'
import { CENTER_TEXTURES, buildCityParallax } from './cityParallax'

const HERO_TEXTURE_KEY = 'hero'
const HERO_TEXTURE_URL = new URL(
  '../../assets/characters/hero/concept/hero.png',
  import.meta.url,
).href

const CENTER_ASSETS = [
  [CENTER_TEXTURES.skyDay, new URL('../../assets/backgrounds/center/sky_day.png', import.meta.url).href],
  [CENTER_TEXTURES.farCity, new URL('../../assets/backgrounds/center/mid_city.png', import.meta.url).href],
  [CENTER_TEXTURES.midCity, new URL('../../assets/backgrounds/center/mid_city.png', import.meta.url).href],
  [CENTER_TEXTURES.street, new URL('../../assets/backgrounds/center/street.png', import.meta.url).href],
  [CENTER_TEXTURES.kurultai, new URL('../../assets/backgrounds/center/buildings/kurultai.png', import.meta.url).href],
  [CENTER_TEXTURES.administration, new URL('../../assets/backgrounds/center/buildings/administration.png', import.meta.url).href],
  [CENTER_TEXTURES.prop1, new URL('../../assets/backgrounds/center/props/1.png', import.meta.url).href],
  [CENTER_TEXTURES.prop2, new URL('../../assets/backgrounds/center/props/2.png', import.meta.url).href],
  [CENTER_TEXTURES.prop3, new URL('../../assets/backgrounds/center/props/3.png', import.meta.url).href],
] as const

const WORLD_WIDTH = 3200
const WORLD_HEIGHT = 960
const START_X = 280
const STREET_CENTER_Y = 650
const ARENA_CENTER_X = START_X
const ARENA_CENTER_Y = STREET_CENTER_Y
const SKY_COLOR = 0xbcecff

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
  private civilians: Civilian[] = []
  private defeatedCount = 0
  private counterText!: Phaser.GameObjects.Text
  private reputationFill!: Phaser.GameObjects.Rectangle

  constructor() {
    super({ key: 'CityScene' })
  }

  preload(): void {
    this.load.image(HERO_TEXTURE_KEY, HERO_TEXTURE_URL)
    for (const [key, url] of CENTER_ASSETS) {
      this.load.image(key, url)
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(SKY_COLOR)

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    buildCityParallax(this, WORLD_WIDTH, WORLD_HEIGHT)

    this.ensureCombatFxTextures()
    this.buildOfficeWorkerEnemyTexture()

    this.player = new Player(this, ARENA_CENTER_X, ARENA_CENTER_Y, HERO_TEXTURE_KEY)
    this.player.setDepth(35)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.mobileControls = new MobileControls(this)
    this.player.bindCursorKeys(this.cursors)
    this.player.bindMobileControls(this.mobileControls)

    this.spawnEnemies()
    this.spawnCivilians()
    this.buildHud()

    this.cameras.main.startFollow(this.player, true, 0.085, 0.045)
    this.cameras.main.setDeadzone(96, 260)
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

  private buildOfficeWorkerEnemyTexture(): void {
    const key = 'enemy_placeholder'
    if (this.textures.exists(key)) {
      this.textures.remove(key)
    }

    const g = this.make.graphics({ x: 0, y: 0 })

    g.fillStyle(0x42251a)
    g.fillEllipse(14, 34, 24, 8)

    g.fillStyle(0x2e6fb8)
    g.fillRoundedRect(6, 13, 17, 20, 3)

    g.fillStyle(0xffffff)
    g.fillTriangle(10, 14, 19, 14, 15, 23)
    g.fillStyle(0xe65353)
    g.fillRect(14, 19, 3, 10)

    g.fillStyle(0xffd6b0)
    g.fillEllipse(14, 8, 14, 12)

    g.fillStyle(0x3a2a22)
    g.fillRect(7, 3, 14, 4)
    g.fillRect(6, 6, 5, 5)

    g.fillStyle(0x111827)
    g.fillRect(11, 8, 2, 2)
    g.fillRect(17, 8, 2, 2)

    g.fillStyle(0xfff3a6)
    g.fillRoundedRect(19, 17, 9, 13, 2)
    g.lineStyle(1, 0x9b5b00, 1)
    g.strokeRoundedRect(19, 17, 9, 13, 2)
    g.lineBetween(21, 21, 26, 21)
    g.lineBetween(21, 24, 26, 24)

    g.fillStyle(0x1d4f8c)
    g.fillRect(8, 31, 5, 5)
    g.fillRect(17, 31, 5, 5)

    g.lineStyle(2, 0x18324f, 1)
    g.strokeRoundedRect(6, 13, 17, 20, 3)

    g.generateTexture(key, 28, 36)
    g.destroy()
  }

  private spawnEnemies(): void {
    const placements: [number, number][] = [
      [START_X - 80, STREET_CENTER_Y - 90],
      [760, STREET_CENTER_Y + 120],
      [1460, STREET_CENTER_Y - 70],
      [2320, STREET_CENTER_Y + 110],
      [WORLD_WIDTH - 270, STREET_CENTER_Y - 35],
    ]

    for (const [rawX, rawY] of placements) {
      const { x, y } = clampToStreetNavigation(rawX, rawY, WORLD_WIDTH)
      const enemy = new Enemy(this, x, y)
      enemy.setDepth(30)
      this.enemies.push(enemy)
    }
  }

  private spawnCivilians(): void {
    const placements: [number, number, number][] = [
      [430, STREET_CENTER_Y + 150, 0],
      [690, STREET_CENTER_Y - 96, 1],
      [1080, STREET_CENTER_Y + 72, 2],
      [1390, STREET_CENTER_Y - 126, 3],
      [1780, STREET_CENTER_Y + 135, 0],
      [2080, STREET_CENTER_Y - 92, 1],
      [2480, STREET_CENTER_Y + 58, 2],
      [2860, STREET_CENTER_Y - 116, 3],
    ]

    for (const [rawX, rawY, palette] of placements) {
      const { x, y } = clampToStreetNavigation(rawX, rawY, WORLD_WIDTH)
      const civilian = new Civilian(this, x, y, palette)
      civilian.setDepth(24)
      this.civilians.push(civilian)
    }
  }

  private buildHud(): void {
    const panel = this.add.rectangle(148, 66, 276, 106, 0x132035, 0.9)
    panel.setScrollFactor(0)
    panel.setDepth(999)
    panel.setStrokeStyle(4, 0xf6d365, 0.95)

    const accent = this.add.rectangle(24, 27, 26, 22, 0xffdf62, 0.98)
    accent.setScrollFactor(0)
    accent.setDepth(1000)
    accent.setAngle(-8)
    accent.setStrokeStyle(2, 0xf05a28, 0.78)

    this.counterText = this.add.text(44, 17, 'Stamped: 0', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#fff3b0',
    })
    this.counterText.setScrollFactor(0)
    this.counterText.setDepth(1001)
    this.counterText.setStroke('#09111f', 4)

    this.addHudMeter(22, 48, 'HEALTH', 1, 0x42f56c)
    this.reputationFill = this.addHudMeter(22, 70, 'REP', 0, 0x45c7ff)
    this.addHudMeter(22, 92, 'SUPPORT', 0.68, 0xffdf62)
  }

  private addHudMeter(
    x: number,
    y: number,
    label: string,
    value: number,
    fillColor: number,
  ): Phaser.GameObjects.Rectangle {
    const labelText = this.add.text(x, y - 7, label, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f8fbff',
    })
    labelText.setScrollFactor(0)
    labelText.setDepth(1001)
    labelText.setStroke('#09111f', 3)

    const frame = this.add.rectangle(x + 76, y, 132, 12, 0x09111f, 0.92)
    frame.setOrigin(0, 0.5)
    frame.setScrollFactor(0)
    frame.setDepth(1000)
    frame.setStrokeStyle(2, 0xffffff, 0.72)

    const fill = this.add.rectangle(x + 78, y, 128 * value, 8, fillColor, 1)
    fill.setOrigin(0, 0.5)
    fill.setScrollFactor(0)
    fill.setDepth(1001)

    return fill
  }

  private refreshDefeatCounter(): void {
    this.counterText.setText(`Stamped: ${this.defeatedCount}`)
    this.reputationFill.width = 128 * Phaser.Math.Clamp(
      this.defeatedCount / 5,
      0,
      1,
    )
  }

  private triggerCombatImpact(worldX: number, worldY: number): void {
    this.cameras.main.shake(SHAKE_MS, SHAKE_INTENSITY)
    this.spawnHitSparks(worldX, worldY)
    this.applyBriefHitstop()
  }

  /** Tiny additive sparks — tweens only, no heavy emitter graph. */
  private spawnHitSparks(wx: number, wy: number): void {
    const tintChoices = [0xffffff, 0xfff2bb, 0xff7d62, 0x66d9ef]

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
        enemy.updateChase(this.player, this.enemies)
      }
    }

    for (const civilian of this.civilians) {
      if (civilian.active) {
        civilian.updateWander()
      }
    }

    this.resolveAttackDefeats()
  }
}
