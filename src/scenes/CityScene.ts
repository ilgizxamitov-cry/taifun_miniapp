import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { MobileControls } from '../ui/MobileControls'
import { buildCityParallax } from './cityParallax'

const WORLD_WIDTH = 640
const WORLD_HEIGHT = 960
const ARENA_CENTER_X = WORLD_WIDTH / 2
const ARENA_CENTER_Y = WORLD_HEIGHT / 2
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

  create(): void {
    this.cameras.main.setBackgroundColor(SKY_COLOR)

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    buildCityParallax(this, WORLD_WIDTH, WORLD_HEIGHT)
    this.buildLevelOneBackdrop()

    this.ensureCombatFxTextures()
    this.buildPlaceholderTextures()
    this.buildArena()

    this.player = new Player(this, ARENA_CENTER_X, ARENA_CENTER_Y, 'player_placeholder')
    this.player.setDepth(35)
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

    this.buildOfficeWorkerEnemyTexture()
  }

  private buildLevelOneBackdrop(): void {
    const cx = ARENA_CENTER_X
    const fullW = WORLD_WIDTH + 260

    const skyTop = this.add.rectangle(cx, 180, fullW, 380, 0x93dcff)
    skyTop.setDepth(-95)
    skyTop.setScrollFactor(0.03, 1)

    const skyWarmth = this.add.rectangle(cx, 445, fullW, 360, 0xfff0b8)
    skyWarmth.setDepth(-94)
    skyWarmth.setScrollFactor(0.05, 1)
    skyWarmth.setAlpha(0.62)

    const sun = this.add.circle(92, 132, 42, 0xfff36f)
    sun.setDepth(-93)
    sun.setScrollFactor(0.02, 1)
    sun.setAlpha(0.9)

    this.addCloud(190, 126, 0.05, 0xffffff, 0.86)
    this.addCloud(500, 190, 0.07, 0xf7fbff, 0.74)

    this.addOfficeBlock(58, 156, 118, 330, 0xe6f4ff, 0x5aaed9, -82, 0.16)
    this.addOfficeBlock(518, 184, 150, 360, 0xd9eeff, 0x4d9fce, -82, 0.15)
    this.addOfficeBlock(188, 248, 138, 268, 0xffe7ba, 0xd89d4a, -78, 0.24)
    this.addOfficeBlock(424, 248, 132, 278, 0xf5d1df, 0xc45e81, -78, 0.24)

    const serviceCenter = this.add.rectangle(cx, 330, 360, 210, 0xfff8df)
    serviceCenter.setDepth(-70)
    serviceCenter.setStrokeStyle(5, 0x2f7fb8, 0.95)
    serviceCenter.setScrollFactor(0.34, 1)

    const roof = this.add.rectangle(cx, 214, 390, 42, 0x2f7fb8)
    roof.setDepth(-69)
    roof.setScrollFactor(0.34, 1)

    const sign = this.add.text(cx, 213, 'МФЦ  •  WINDOW 404', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff',
      align: 'center',
    })
    sign.setOrigin(0.5)
    sign.setDepth(-68)
    sign.setScrollFactor(0.34, 1)
    sign.setStroke('#1a5278', 4)

    const subtitle = this.add.text(cx, 258, 'PLEASE TAKE A TICKET AND WAIT FOREVER', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#734b00',
      align: 'center',
    })
    subtitle.setOrigin(0.5)
    subtitle.setDepth(-68)
    subtitle.setScrollFactor(0.34, 1)

    for (const x of [190, 255, 320, 385, 450]) {
      const window = this.add.rectangle(x, 306, 38, 54, 0x88d7ff)
      window.setDepth(-67)
      window.setScrollFactor(0.34, 1)
      window.setStrokeStyle(2, 0x2778ad, 0.72)

      const counter = this.add.rectangle(x, 353, 44, 10, 0xffc75f)
      counter.setDepth(-66)
      counter.setScrollFactor(0.34, 1)
    }

    this.addBureaucracyPoster(110, 392, 'NO\nSTAMP\nNO\nJOY')
    this.addBureaucracyPoster(530, 414, 'LUNCH\nBREAK\n09-18')
  }

  private addCloud(x: number, y: number, scrollX: number, color: number, alpha: number): void {
    const cloud = this.add.container(x, y)
    cloud.setDepth(-92)
    cloud.setScrollFactor(scrollX, 1)
    cloud.setAlpha(alpha)

    const puffs = [
      this.add.ellipse(0, 10, 92, 28, color),
      this.add.ellipse(-32, 8, 48, 28, color),
      this.add.ellipse(12, -2, 64, 36, color),
      this.add.ellipse(46, 8, 42, 24, color),
    ]
    cloud.add(puffs)
  }

  private addOfficeBlock(
    x: number,
    y: number,
    w: number,
    h: number,
    fill: number,
    trim: number,
    depth: number,
    scrollX: number,
  ): void {
    const block = this.add.rectangle(x, y + h / 2, w, h, fill)
    block.setDepth(depth)
    block.setScrollFactor(scrollX, 1)
    block.setStrokeStyle(3, trim, 0.58)

    const startX = x - w / 2 + 18
    const endX = x + w / 2 - 16
    const startY = y + 32
    const endY = y + h - 24
    for (let wx = startX; wx <= endX; wx += 28) {
      for (let wy = startY; wy <= endY; wy += 34) {
        const lit = (wx + wy) % 3 === 0
        const pane = this.add.rectangle(wx, wy, 13, 16, lit ? 0xfff3a6 : 0x78c5ef)
        pane.setDepth(depth + 1)
        pane.setScrollFactor(scrollX, 1)
        pane.setAlpha(lit ? 0.92 : 0.7)
      }
    }
  }

  private addBureaucracyPoster(x: number, y: number, copy: string): void {
    const poster = this.add.rectangle(x, y, 74, 80, 0xffffff)
    poster.setDepth(-58)
    poster.setScrollFactor(0.48, 1)
    poster.setStrokeStyle(3, 0xf05a28, 0.8)

    const text = this.add.text(x, y, copy, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#b3311b',
      align: 'center',
      lineSpacing: 2,
    })
    text.setOrigin(0.5)
    text.setDepth(-57)
    text.setScrollFactor(0.48, 1)
  }

  private buildArena(): void {
    const plazaW = WORLD_WIDTH - 54
    const plazaH = WORLD_HEIGHT - 122
    const floor = this.add.rectangle(
      ARENA_CENTER_X,
      ARENA_CENTER_Y + 10,
      plazaW,
      plazaH,
      0xf1d59b,
    )
    floor.setDepth(-22)
    floor.setStrokeStyle(5, 0xffffff, 0.9)

    const curb = this.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y + 10, plazaW - 36, plazaH - 46, 0xf7e6bd)
    curb.setDepth(-21)
    curb.setAlpha(0.8)
    curb.setStrokeStyle(3, 0x5bb3ce, 0.62)

    const tileColor = 0xcfaa70
    for (let x = 58; x < WORLD_WIDTH - 58; x += 54) {
      const line = this.add.rectangle(x, ARENA_CENTER_Y + 10, 2, plazaH - 64, tileColor)
      line.setDepth(-20)
      line.setAlpha(0.28)
    }
    for (let y = 96; y < WORLD_HEIGHT - 96; y += 54) {
      const line = this.add.rectangle(ARENA_CENTER_X, y, plazaW - 54, 2, tileColor)
      line.setDepth(-20)
      line.setAlpha(0.24)
    }

    const combatRead = this.add.ellipse(
      ARENA_CENTER_X,
      ARENA_CENTER_Y + 22,
      388,
      488,
      0xfff4cb,
      0.54,
    )
    combatRead.setDepth(-19)
    combatRead.setStrokeStyle(4, 0x32a1c8, 0.35)

    const queueRing = this.add.ellipse(
      ARENA_CENTER_X,
      ARENA_CENTER_Y + 22,
      320,
      420,
      0xffffff,
      0.05,
    )
    queueRing.setDepth(-18)
    queueRing.setStrokeStyle(3, 0xe65353, 0.34)

    for (const [x, y] of [
      [86, 190],
      [554, 190],
      [86, 742],
      [554, 742],
      [146, 484],
      [494, 484],
    ] as [number, number][]) {
      this.addQueuePost(x, y)
    }

    this.addCrosswalk(ARENA_CENTER_X, WORLD_HEIGHT - 118)
    this.addFloorSticker(ARENA_CENTER_X - 122, ARENA_CENTER_Y - 176, 'FORM\nA-38')
    this.addFloorSticker(ARENA_CENTER_X + 128, ARENA_CENTER_Y + 178, 'APPROVED?')

    const topShade = this.add.rectangle(ARENA_CENTER_X, 40, WORLD_WIDTH, 80, 0xffffff)
    topShade.setDepth(-9)
    topShade.setAlpha(0.16)

    const bottomShade = this.add.rectangle(ARENA_CENTER_X, WORLD_HEIGHT - 36, WORLD_WIDTH, 72, 0xf07167)
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
      [ARENA_CENTER_X - 120, ARENA_CENTER_Y - 120],
      [ARENA_CENTER_X + 135, ARENA_CENTER_Y - 82],
      [ARENA_CENTER_X - 92, ARENA_CENTER_Y + 138],
      [ARENA_CENTER_X + 118, ARENA_CENTER_Y + 116],
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
