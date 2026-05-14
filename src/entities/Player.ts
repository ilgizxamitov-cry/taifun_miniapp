import Phaser from 'phaser'
import type { MobileControls } from '../ui/MobileControls'

const SPEED = 250
const DIAGONAL_NORMAL = 0.70710678

const TEX_W = 32
const TEX_H = 48

/** Locomotion-only visuals; future anim layers can map to these keys. */
const LocomotionVisual = {
  Idle: 'idle',
  Move: 'move',
} as const

type LocomotionVisualKey = (typeof LocomotionVisual)[keyof typeof LocomotionVisual]

const IDLE_TINT = 0xc4ccd8
const MOVE_TINT = 0xffffff
const FACING_EPS = 0.12
const MOVING_SPEED = 8

/** Combat tuning — swap durations / replace visuals when attacks expand. */
const ATTACK_DURATION_MS = 140
const ATTACK_COOLDOWN_MS = 210
const ATTACK_MOVE_MULT = 0.52
const ATTACK_TINT = 0xffe94d
const ATTACK_SCALE = 1.08

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private spaceKey!: Phaser.Input.Keyboard.Key
  private wasdKeys!: Record<'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>
  private mobile: MobileControls | null = null

  private facingSign = 1
  private locomotionVisual: LocomotionVisualKey | null = null

  private attackMsRemaining = 0
  private cooldownMsRemaining = 0

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    Player.replaceSilhouetteTexture(scene, textureKey)
    super(scene, x, y, textureKey)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setCollideWorldBounds(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setDamping(true)
    body.setDrag(900, 900)
    body.setMaxVelocity(SPEED + 40, SPEED + 40)
    body.setSize(26, 42)
    body.setOffset(3, 6)

    this.applyLocomotionPresentation(LocomotionVisual.Idle)
  }

  bindCursorKeys(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    this.cursors = cursors
    this.spaceKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    )
    this.wasdKeys = {
      w: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
  }

  bindMobileControls(mobile: MobileControls): void {
    this.mobile = mobile
  }

  update(): void {
    const dt = this.scene.game.loop.delta
    const body = this.body as Phaser.Physics.Arcade.Body

    this.tickCombatTimers(dt)
    this.tryBeginAttack()

    const attackActive = this.attackMsRemaining > 0
    const moveSpeed = attackActive ? SPEED * ATTACK_MOVE_MULT : SPEED

    const keyboardX =
      (this.cursors.left.isDown || this.wasdKeys.a.isDown ? -1 : 0) +
      (this.cursors.right.isDown || this.wasdKeys.d.isDown ? 1 : 0)
    const keyboardY =
      (this.cursors.up.isDown || this.wasdKeys.w.isDown ? -1 : 0) +
      (this.cursors.down.isDown || this.wasdKeys.s.isDown ? 1 : 0)

    let moveX = keyboardX
    let moveY = keyboardY

    if (this.mobile !== null && (this.mobile.moveX !== 0 || this.mobile.moveY !== 0)) {
      moveX = this.mobile.moveX
      moveY = this.mobile.moveY
    }

    if (moveX !== 0 && moveY !== 0 && Math.abs(moveX) === 1 && Math.abs(moveY) === 1) {
      moveX *= DIAGONAL_NORMAL
      moveY *= DIAGONAL_NORMAL
    }

    body.setVelocity(moveX * moveSpeed, moveY * moveSpeed)

    this.syncPresentation(body)
  }

  /** Timer-driven strike window + recovery; extend with buffers / charges later. */
  private tickCombatTimers(dt: number): void {
    if (this.attackMsRemaining > 0) {
      this.attackMsRemaining -= dt
      if (this.attackMsRemaining <= 0) {
        this.attackMsRemaining = 0
        this.cooldownMsRemaining = ATTACK_COOLDOWN_MS
        this.locomotionVisual = null
      }
      return
    }

    if (this.cooldownMsRemaining > 0) {
      this.cooldownMsRemaining -= dt
      if (this.cooldownMsRemaining < 0) {
        this.cooldownMsRemaining = 0
      }
    }
  }

  /** Future: weapon checks, stamina, combo gates — keep body lightweight. */
  private canBeginAttack(): boolean {
    return this.attackMsRemaining <= 0 && this.cooldownMsRemaining <= 0
  }

  private tryBeginAttack(): void {
    const keyAttack = Phaser.Input.Keyboard.JustDown(this.spaceKey)
    const touchAttack =
      this.mobile !== null && this.mobile.consumeAttackEdge()
    if (!keyAttack && !touchAttack) {
      return
    }
    if (!this.canBeginAttack()) {
      return
    }
    this.beginAttack()
  }

  private beginAttack(): void {
    this.attackMsRemaining = ATTACK_DURATION_MS
    this.locomotionVisual = null
  }

  /** Used by scenes for placeholder strike checks until hitboxes land. */
  isAttackActive(): boolean {
    return this.attackMsRemaining > 0
  }

  /** Hook point for future `play()` / texture swaps — swap implementation only. */
  private applyLocomotionPresentation(state: LocomotionVisualKey): void {
    if (state === this.locomotionVisual) {
      return
    }
    this.locomotionVisual = state
    switch (state) {
      case LocomotionVisual.Move:
        this.setTint(MOVE_TINT)
        break
      case LocomotionVisual.Idle:
      default:
        this.setTint(IDLE_TINT)
        break
    }
  }

  /** Distinct strike read — replace with anim-driven offsets later. */
  private applyAttackPresentation(): void {
    this.setTint(ATTACK_TINT)
    this.setScale(ATTACK_SCALE)
  }

  private syncPresentation(body: Phaser.Physics.Arcade.Body): void {
    const vx = body.velocity.x
    const vy = body.velocity.y

    if (vx > FACING_EPS) {
      this.facingSign = 1
    } else if (vx < -FACING_EPS) {
      this.facingSign = -1
    }

    this.setFlipX(this.facingSign < 0)

    if (this.attackMsRemaining > 0) {
      this.applyAttackPresentation()
      return
    }

    this.setScale(1, 1)

    const moving = Math.hypot(vx, vy) > MOVING_SPEED
    this.applyLocomotionPresentation(
      moving ? LocomotionVisual.Move : LocomotionVisual.Idle,
    )
  }

  /** Generated art faces right; flipX handles left. Replaces any prior key of same name. */
  private static replaceSilhouetteTexture(scene: Phaser.Scene, key: string): void {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key)
    }

    const g = scene.make.graphics({ x: 0, y: 0 })

    g.fillStyle(0x2c141c)
    g.fillRect(9, 14, 18, 30)

    g.fillStyle(0xff4b61)
    g.fillRoundedRect(8, 16, 18, 26, 3)

    g.fillStyle(0xffe6dc)
    g.fillEllipse(17, 11, 13, 11)

    g.fillStyle(0x1a0f18)
    g.fillEllipse(20, 10, 3, 3)

    g.fillStyle(0xffc9b8)
    g.fillRect(17, 19, 6, 11)

    g.fillStyle(0xff4b61)
    g.fillRect(11, 38, 6, 8)
    g.fillRect(18, 38, 6, 8)

    g.lineStyle(2, 0x2b121a, 1)
    g.strokeRoundedRect(7, 15, 20, 28, 4)

    g.generateTexture(key, TEX_W, TEX_H)
    g.destroy()
  }
}
