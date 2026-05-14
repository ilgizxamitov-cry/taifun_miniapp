import Phaser from 'phaser'

const DEPTH = 1500
const STICK_BASE_SIZE = 112
const STICK_KNOB_SIZE = 44
const ACTION_SIZE = 96
const EDGE_PAD = 20
const CONTROL_BOTTOM_PAD = 34
const DEADZONE = 8

type PointerLike = Phaser.Input.Pointer

/**
 * Portrait arena controls: left-side drag stick for free movement and one large
 * right-side action button. Screen-space objects stay visible as the camera moves.
 */
export class MobileControls {
  readonly scene: Phaser.Scene

  private movePointerId: number | null = null
  private stickCenter = new Phaser.Math.Vector2()
  private moveVector = new Phaser.Math.Vector2()
  private attackPending = false

  private readonly root: Phaser.GameObjects.Container
  private readonly stickBase: Phaser.GameObjects.Ellipse
  private readonly stickKnob: Phaser.GameObjects.Ellipse
  private readonly stickLabel: Phaser.GameObjects.Text
  private readonly actionButton: Phaser.GameObjects.Ellipse
  private readonly actionText: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    for (let i = 0; i < 3; i++) {
      scene.input.addPointer()
    }

    this.root = scene.add.container(0, 0)
    this.root.setScrollFactor(0)
    this.root.setDepth(DEPTH)

    this.stickBase = scene.add.ellipse(0, 0, STICK_BASE_SIZE, STICK_BASE_SIZE, 0x101824)
    this.stickBase.setAlpha(0.42)
    this.stickBase.setStrokeStyle(2, 0x8aa4cc, 0.48)
    this.stickBase.setScrollFactor(0)
    this.stickBase.setInteractive({ useHandCursor: false })

    this.stickKnob = scene.add.ellipse(0, 0, STICK_KNOB_SIZE, STICK_KNOB_SIZE, 0xdce8ff)
    this.stickKnob.setAlpha(0.62)
    this.stickKnob.setStrokeStyle(2, 0xffffff, 0.3)
    this.stickKnob.setScrollFactor(0)

    this.stickLabel = scene.add.text(0, 0, 'MOVE', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#dce8ff',
    })
    this.stickLabel.setOrigin(0.5)
    this.stickLabel.setAlpha(0.72)
    this.stickLabel.setScrollFactor(0)

    this.actionButton = scene.add.ellipse(0, 0, ACTION_SIZE, ACTION_SIZE, 0x5c2030)
    this.actionButton.setAlpha(0.72)
    this.actionButton.setStrokeStyle(3, 0xffd166, 0.72)
    this.actionButton.setScrollFactor(0)
    this.actionButton.setInteractive({ useHandCursor: false })

    this.actionText = scene.add.text(0, 0, 'ACTION', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#fff2bb',
    })
    this.actionText.setOrigin(0.5)
    this.actionText.setAlpha(0.95)
    this.actionText.setScrollFactor(0)

    this.root.add([
      this.stickBase,
      this.stickKnob,
      this.stickLabel,
      this.actionButton,
      this.actionText,
    ])

    this.bindInput()
    this.layout()

    scene.scale.on('resize', this.handleResize, this)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off('resize', this.handleResize, this)
    })
  }

  get left(): boolean {
    return this.moveVector.x < -0.35
  }

  get right(): boolean {
    return this.moveVector.x > 0.35
  }

  get moveX(): number {
    return this.moveVector.x
  }

  get moveY(): number {
    return this.moveVector.y
  }

  consumeAttackEdge(): boolean {
    const v = this.attackPending
    this.attackPending = false
    return v
  }

  private handleResize(): void {
    this.layout()
  }

  private bindInput(): void {
    this.stickBase.on('pointerdown', (p: PointerLike) => {
      p.event?.preventDefault?.()
      this.movePointerId = p.id
      this.updateStickFromPointer(p)
    })

    this.scene.input.on('pointermove', (p: PointerLike) => {
      if (this.movePointerId !== p.id) {
        return
      }
      this.updateStickFromPointer(p)
    })

    this.scene.input.on('pointerup', (p: PointerLike) => {
      if (this.movePointerId !== p.id) {
        return
      }
      this.movePointerId = null
      this.moveVector.set(0, 0)
      this.stickKnob.setPosition(this.stickCenter.x, this.stickCenter.y)
    })

    this.actionButton.on('pointerdown', (p: PointerLike) => {
      p.event?.preventDefault?.()
      this.attackPending = true
      this.scene.tweens.add({
        targets: this.actionButton,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 45,
        yoyo: true,
      })
    })
  }

  private updateStickFromPointer(p: PointerLike): void {
    const maxDist = STICK_BASE_SIZE * 0.38
    const dx = p.x - this.stickCenter.x
    const dy = p.y - this.stickCenter.y
    const dist = Math.hypot(dx, dy)

    if (dist < DEADZONE) {
      this.moveVector.set(0, 0)
      this.stickKnob.setPosition(this.stickCenter.x, this.stickCenter.y)
      return
    }

    const clamped = Math.min(dist, maxDist)
    const nx = dx / dist
    const ny = dy / dist
    this.moveVector.set(nx * (clamped / maxDist), ny * (clamped / maxDist))
    this.stickKnob.setPosition(
      this.stickCenter.x + nx * clamped,
      this.stickCenter.y + ny * clamped,
    )
  }

  private layout(): void {
    const w = this.scene.scale.width
    const h = this.scene.scale.height
    const y = h - CONTROL_BOTTOM_PAD - STICK_BASE_SIZE / 2

    this.stickCenter.set(EDGE_PAD + STICK_BASE_SIZE / 2, y)
    this.stickBase.setPosition(this.stickCenter.x, this.stickCenter.y)
    this.stickKnob.setPosition(this.stickCenter.x, this.stickCenter.y)
    this.stickLabel.setPosition(this.stickCenter.x, this.stickCenter.y + STICK_BASE_SIZE / 2 + 15)

    const actionX = w - EDGE_PAD - ACTION_SIZE / 2
    const actionY = h - CONTROL_BOTTOM_PAD - ACTION_SIZE / 2
    this.actionButton.setPosition(actionX, actionY)
    this.actionText.setPosition(actionX, actionY)
  }
}
