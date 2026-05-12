import './style.css'
import Phaser from 'phaser'
import { CityScene } from './scenes/CityScene'

declare global {
    interface Window {
        Telegram?: any
    }
}

const tg = window.Telegram?.WebApp

if (tg) {
    console.log('Telegram WebApp detected')

    tg.ready()
    tg.expand()
} else {
    console.log('Running in browser mode')
}

const DESIGN_WIDTH = 960
const DESIGN_HEIGHT = 540

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    parent: 'app',

    backgroundColor: '#0c0e14',

    pixelArt: true,
    roundPixels: true,
    antialias: false,

    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'app',
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
    },

    physics: {
        default: 'arcade',

        arcade: {
            gravity: {
                x: 0,
                y: 1100,
            },

            tileBias: 8,
            fps: 60,
            fixedStep: true,
        },
    },

    scene: [CityScene],
}

const game = new Phaser.Game(config)

window.addEventListener('resize', () => {
    game.scale.refresh()
})