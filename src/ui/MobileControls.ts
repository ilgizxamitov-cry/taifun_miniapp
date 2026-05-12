import Phaser from 'phaser'

const DEPTH = 1500
const BTN_SIZE = 74
const BTN_GAP = 11
const EDGE_PAD = 16
const ROW_GAP = 12

type BtnPair = {
  rect: Phaser.GameObjects.Rectangle
  text: Phaser.GameObjects.Text
}

/**
 * Screen-space touch zones (scrollFactor 0). Hold = move; tap edges = jump / attack.
 * Extra pointers allow multiple simultaneous touches.
 */
export class MobileControls {
  readonly scene: Phaser.Scene

  private leftHeld = false
  private rightHeld = false
  private jumpPending = false
  private attackPending = false

  private readonly root: Phaser.GameObjects.Container
  private readonly pairs: BtnPair[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    for (let i = 0; i < 3; i++) {
      scene.input.addPointer()
    }

    this.root = scene.add.container(0, 0)
    this.root.setScrollFactor(0)
    this.root.setDepth(DEPTH)

    this.buildControls()
    scene.scale.on('resize', this.handleResize, this)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off('resize', this.handleResize, this)
    })
  }

  get left(): boolean {
    return this.leftHeld
  }

  get right(): boolean {
    return this.rightHeld
  }

  /** One-shot per tap; consume from Player.update() the same frame. */
  consumeJumpEdge(): boolean {
    const v = this.jumpPending
    this.jumpPending = false
    return v
  }

  consumeAttackEdge(): boolean {
    const v = this.attackPending
    this.attackPending = false
    return v
  }

  private handleResize(): void {
    this.layout()
  }

  private mkPair(label: string, fontSize: string): BtnPair {
    const rect = this.scene.add.rectangle(0, 0, BTN_SIZE, BTN_SIZE, 0x101824)
    rect.setAlpha(0.38)
    rect.setStrokeStyle(2, 0x8aa4cc, 0.42)
    rect.setScrollFactor(0)
    rect.setInteractive({ useHandCursor: false })

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize,
      color: '#dce8ff',
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setAlpha(0.88)

    this.root.add(rect)
    this.root.add(text)

    return { rect, text }
  }

  private buildControls(): void {
    const left = this.mkPair('◀', '26px')
    const right = this.mkPair('▶', '26px')
    const jump = this.mkPair('▲', '26px')
    const attack = this.mkPair('A', '22px')

    this.bindHold(left.rect, () => {
      this.leftHeld = true
    }, () => {
      this.leftHeld = false
    })

    this.bindHold(right.rect, () => {
      this.rightHeld = true
    }, () => {
      this.rightHeld = false
    })

    this.bindTap(jump.rect, () => {
      this.jumpPending = true
    })

    this.bindTap(attack.rect, () => {
      this.attackPending = true
    })

    this.pairs.push(left, right, jump, attack)
    this.layout()
  }

  private bindHold(
    rect: Phaser.GameObjects.Rectangle,
    down: () => void,
    up: () => void,
  ): void {
    rect.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.preventDefault?.()
      down()
    })
    rect.on('pointerup', up)
    rect.on('pointerout', up)
    rect.on('pointerupoutside', up)
  }

  private bindTap(rect: Phaser.GameObjects.Rectangle, fire: () => void): void {
    rect.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.preventDefault?.()
      fire()
    })
  }

  private layout(): void {
    const w = this.scene.scale.width
    const h = this.scene.scale.height

    if (this.pairs.length < 4) {
      return
    }

    const [left, right, jump, attack] = this.pairs

    const bottomY = h - EDGE_PAD - BTN_SIZE / 2
    const leftBaseX = EDGE_PAD + BTN_SIZE / 2
    const jumpY = bottomY - BTN_SIZE - ROW_GAP

    left.rect.setPosition(leftBaseX, bottomY)
    left.text.setPosition(leftBaseX, bottomY)

    right.rect.setPosition(leftBaseX + BTN_SIZE + BTN_GAP, bottomY)
    right.text.setPosition(right.rect.x, right.rect.y)

    const rightClusterX = w - EDGE_PAD - BTN_SIZE / 2
    jump.rect.setPosition(rightClusterX, jumpY)
    jump.text.setPosition(rightClusterX, jumpY)

    attack.rect.setPosition(rightClusterX, bottomY)
    attack.text.setPosition(rightClusterX, bottomY)
  }
}
