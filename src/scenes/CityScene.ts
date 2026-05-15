import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
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

const WORLD_WIDTH = 2700
const WORLD_HEIGHT = 960
const START_X = 280
const STREET_CENTER_Y = 580
const STREET_TOP_Y = 270
const STREET_BOTTOM_Y = 850
const DISTRICT_LANDMARKS = {
  kurultaiX: 360,
  administrationX: 2240,
} as const
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
  private defeatedCount = 0
  private counterText!: Phaser.GameObjects.Text

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
    this.buildPlaceholderTextures()
    this.buildArena()

    this.player = new Player(this, ARENA_CENTER_X, ARENA_CENTER_Y, HERO_TEXTURE_KEY)
    this.player.setDepth(35)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.mobileControls = new MobileControls(this)
    this.player.bindCursorKeys(this.cursors)
    this.player.bindMobileControls(this.mobileControls)

    this.spawnEnemies()
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

  private buildPlaceholderTextures(): void {
    this.buildOfficeWorkerEnemyTexture()
  }

  private buildArena(): void {
    const streetW = WORLD_WIDTH - 110
    const streetH = STREET_BOTTOM_Y - STREET_TOP_Y
    const streetCenterX = WORLD_WIDTH / 2
    const streetCenterY = STREET_TOP_Y + streetH / 2

    const floor = this.add.rectangle(
      streetCenterX,
      streetCenterY,
      streetW,
      streetH,
      0xf1d59b,
      0.18,
    )
    floor.setDepth(-22)
    floor.setStrokeStyle(5, 0xffffff, 0.9)

    const curb = this.add.rectangle(
      streetCenterX,
      streetCenterY,
      streetW - 64,
      streetH - 54,
      0xf7e6bd,
      0.24,
    )
    curb.setDepth(-21)
    curb.setStrokeStyle(3, 0x5bb3ce, 0.62)

    const tileColor = 0xcfaa70
    for (let x = 96; x < WORLD_WIDTH - 96; x += 72) {
      const line = this.add.rectangle(x, streetCenterY, 2, streetH - 70, tileColor)
      line.setDepth(-20)
      line.setAlpha(0.24)
    }
    for (let y = STREET_TOP_Y + 52; y < STREET_BOTTOM_Y - 44; y += 58) {
      const line = this.add.rectangle(streetCenterX, y, streetW - 84, 2, tileColor)
      line.setDepth(-20)
      line.setAlpha(0.2)
    }

    for (const x of [
      DISTRICT_LANDMARKS.kurultaiX,
      940,
      1580,
      DISTRICT_LANDMARKS.administrationX,
    ]) {
      const combatRead = this.add.ellipse(
        x,
        STREET_CENTER_Y + 20,
        392,
        418,
        0xfff4cb,
        0.22,
      )
      combatRead.setDepth(-19)
      combatRead.setStrokeStyle(4, 0x32a1c8, 0.24)
    }

    const queueRing = this.add.ellipse(
      START_X,
      STREET_CENTER_Y + 20,
      318,
      398,
      0xffffff,
      0.035,
    )
    queueRing.setDepth(-18)
    queueRing.setStrokeStyle(3, 0xe65353, 0.34)

    for (const [x, y] of [
      [180, 360],
      [520, 360],
      [180, 748],
      [520, 748],
      [850, 512],
      [1280, 700],
      [1700, 510],
      [2140, 738],
      [2460, 390],
    ] as [number, number][]) {
      this.addQueuePost(x, y)
    }

    for (const x of [START_X, 1040, 1780, DISTRICT_LANDMARKS.administrationX]) {
      this.addCrosswalk(x, STREET_BOTTOM_Y - 28)
    }
    this.addFloorSticker(START_X - 116, STREET_CENTER_Y - 154, 'FORM\nA-38')
    this.addFloorSticker(START_X + 132, STREET_CENTER_Y + 156, 'APPROVED?')
    this.addFloorSticker(1420, STREET_CENTER_Y - 144, 'CITY\nCENTER')
    this.addFloorSticker(
      DISTRICT_LANDMARKS.administrationX - 112,
      STREET_CENTER_Y + 142,
      'QUEUE\nHERE',
    )

    const topShade = this.add.rectangle(streetCenterX, 40, WORLD_WIDTH, 80, 0xffffff)
    topShade.setDepth(-9)
    topShade.setAlpha(0.16)

    const bottomShade = this.add.rectangle(
      streetCenterX,
      WORLD_HEIGHT - 36,
      WORLD_WIDTH,
      72,
      0xf07167,
    )
    bottomShade.setDepth(-9)
    bottomShade.setAlpha(0.12)
  }

  private addQueuePost(x: number, y: number): void {
    const shadow = this.add.ellipse(x + 3, y + 14, 34, 12, 0x6a4a2d, 0.16)
    shadow.setDepth(-17)

    const post = this.add.rectangle(x, y, 12, 42, 0x2f7fb8)
    post.setDepth(-16)
    post.setStrokeStyle(2, 0xffffff, 0.72)

    const cap = this.add.circle(x, y - 24, 10, 0xffdf62)
    cap.setDepth(-15)
    cap.setStrokeStyle(2, 0x9b5b00, 0.42)
  }

  private addCrosswalk(x: number, y: number): void {
    const base = this.add.rectangle(x, y, 376, 64, 0x6cc7df, 0.22)
    base.setDepth(-16)
    base.setStrokeStyle(2, 0xffffff, 0.44)

    for (let i = -3; i <= 3; i++) {
      const stripe = this.add.rectangle(x + i * 48, y, 28, 58, 0xffffff, 0.66)
      stripe.setDepth(-15)
      stripe.setAngle(-6)
    }
  }

  private addFloorSticker(x: number, y: number, copy: string): void {
    const sticker = this.add.rectangle(x, y, 92, 48, 0xffffff, 0.62)
    sticker.setDepth(-14)
    sticker.setAngle(-8)
    sticker.setStrokeStyle(2, 0xf05a28, 0.34)

    const text = this.add.text(x, y, copy, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#b3311b',
      align: 'center',
    })
    text.setOrigin(0.5)
    text.setDepth(-13)
    text.setAngle(-8)
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
      [START_X - 115, STREET_CENTER_Y - 112],
      [START_X + 136, STREET_CENTER_Y - 78],
      [START_X - 82, STREET_CENTER_Y + 132],
      [START_X + 128, STREET_CENTER_Y + 110],
    ]

    for (const [x, y] of placements) {
      const enemy = new Enemy(this, x, y)
      enemy.setDepth(30)
      this.enemies.push(enemy)
    }
  }

  private buildHud(): void {
    const panel = this.add.rectangle(102, 31, 182, 42, 0xffffff, 0.86)
    panel.setScrollFactor(0)
    panel.setDepth(999)
    panel.setStrokeStyle(3, 0x2f7fb8, 0.72)

    const stamp = this.add.rectangle(28, 31, 34, 24, 0xffdf62, 0.96)
    stamp.setScrollFactor(0)
    stamp.setDepth(1000)
    stamp.setAngle(-8)
    stamp.setStrokeStyle(2, 0xf05a28, 0.65)

    this.counterText = this.add.text(52, 18, 'Stamped: 0', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#17324d',
    })
    this.counterText.setScrollFactor(0)
    this.counterText.setDepth(1001)
    this.counterText.setStroke('#ffffff', 4)
  }

  private refreshDefeatCounter(): void {
    this.counterText.setText(`Stamped: ${this.defeatedCount}`)
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
        enemy.updateChase(this.player)
      }
    }

    this.resolveAttackDefeats()
  }
}
