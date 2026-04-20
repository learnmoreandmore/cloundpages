<template>
  <div class="kof-page">
    <header class="hud">
      <div class="title-block">
        <h1>King of Canvas</h1>
        <p>拳皇风双人格斗原型（科比 2D 像素角色动作帧）</p>
      </div>
      <button class="restart-btn" type="button" @click="restartMatch">重新开始</button>
    </header>

    <div class="arena-wrap">
      <canvas ref="arenaCanvas" class="arena-canvas" :width="canvasWidth" :height="canvasHeight" />
    </div>

    <section class="tips">
      <h2>操作说明</h2>
      <div class="controls">
        <div>
          <h3>玩家 1（红）</h3>
          <p>A / D：移动</p>
          <p>W：跳跃</p>
          <p>F：轻拳</p>
          <p>G：重脚</p>
        </div>
        <div>
          <h3>玩家 2（蓝）</h3>
          <p>← / →：移动</p>
          <p>↑：跳跃</p>
          <p>K：轻拳</p>
          <p>L：重脚</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasWidth = 960
const canvasHeight = 540
const floorY = 440
const gravity = 0.65
const roundLimitSeconds = 60
const kobePortraitUrl = 'https://a.espncdn.com/i/headshots/nba/players/full/110.png'
const fighterPixelWidth = 104
const fighterPixelHeight = 168

const arenaCanvas = ref(null)
const keyState = new Map()
const jumpLatch = new Set()
const headSpriteCache = {
  p1: null,
  p2: null
}

let animationFrameId = 0
let previousTime = 0

const createFighter = (config) => ({
  id: config.id,
  name: config.name,
  color: config.color,
  x: config.x,
  y: floorY - fighterPixelHeight,
  width: fighterPixelWidth,
  height: fighterPixelHeight,
  velocityX: 0,
  velocityY: 0,
  speed: 4.3,
  jumpPower: 14.5,
  facing: config.facing,
  hp: 100,
  maxHp: 100,
  controls: config.controls,
  attackCooldown: 0,
  hitStun: 0,
  activeAttack: null,
  headSprite: config.headSprite || null,
  animFrame: 0
})

let fighterOne = createFighter({
  id: 'P1',
  name: '黑曼巴·赤',
  color: '#e95555',
  x: 180,
  facing: 1,
  headSprite: headSpriteCache.p1,
  controls: {
    left: 'a',
    right: 'd',
    jump: 'w',
    punch: 'f',
    kick: 'g'
  }
})

let fighterTwo = createFighter({
  id: 'P2',
  name: '黑曼巴·蓝',
  color: '#5f9dff',
  x: canvasWidth - 240,
  facing: -1,
  headSprite: headSpriteCache.p2,
  controls: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    punch: 'k',
    kick: 'l'
  }
})

let roundClock = roundLimitSeconds
let matchState = {
  over: false,
  winnerText: ''
}

const normalizeKey = (rawKey) => {
  if (rawKey.length === 1) return rawKey.toLowerCase()
  return rawKey
}

const parseHexColor = (hexColor) => {
  const color = hexColor.replace('#', '')
  const value = Number.parseInt(color, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  }
}

const adjustColor = (hexColor, amount) => {
  const { r, g, b } = parseHexColor(hexColor)
  const clamp = (value) => Math.max(0, Math.min(255, value))
  const toHex = (value) => clamp(Math.round(value)).toString(16).padStart(2, '0')
  return `#${toHex(r + amount)}${toHex(g + amount)}${toHex(b + amount)}`
}

const loadImage = (sourceUrl) => new Promise((resolve, reject) => {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error(`Failed to load image: ${sourceUrl}`))
  image.src = sourceUrl
})

const createKobeHeadSprite = (image, accentColor) => {
  const sourceSize = 20
  const accent = parseHexColor(accentColor)
  const canvas = document.createElement('canvas')
  canvas.width = sourceSize
  canvas.height = sourceSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // 头像区域取原图上方，聚焦脸部并做像素化处理。
  const cropSize = Math.min(image.width, image.height * 0.58)
  const sx = (image.width - cropSize) / 2
  const sy = image.height * 0.04
  ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, sourceSize, sourceSize)

  const frame = ctx.getImageData(0, 0, sourceSize, sourceSize)
  const pixels = frame.data
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 32) continue
    pixels[index] = Math.round(pixels[index] / 32) * 32
    pixels[index + 1] = Math.round(pixels[index + 1] / 32) * 32
    pixels[index + 2] = Math.round(pixels[index + 2] / 32) * 32

    const y = Math.floor((index / 4) / sourceSize)
    if (y > 14) {
      pixels[index] = Math.round(pixels[index] * 0.7 + accent.r * 0.3)
      pixels[index + 1] = Math.round(pixels[index + 1] * 0.7 + accent.g * 0.3)
      pixels[index + 2] = Math.round(pixels[index + 2] * 0.7 + accent.b * 0.3)
    }
  }
  ctx.putImageData(frame, 0, 0)
  return canvas
}

const hydrateKobeHeads = async () => {
  try {
    const image = await loadImage(kobePortraitUrl)
    headSpriteCache.p1 = createKobeHeadSprite(image, fighterOne.color)
    headSpriteCache.p2 = createKobeHeadSprite(image, fighterTwo.color)
    fighterOne.headSprite = headSpriteCache.p1
    fighterTwo.headSprite = headSpriteCache.p2
  } catch (error) {
    console.error('Kobe head sprite load failed:', error)
  }
}

const canJump = (fighter) => fighter.y + fighter.height >= floorY - 0.5

const getBodyRect = (fighter) => ({
  x: fighter.x + 24,
  y: fighter.y + 28,
  width: fighter.width - 48,
  height: fighter.height - 24
})

const getAttackRect = (fighter, attack) => {
  const attackX = fighter.facing === 1
    ? fighter.x + fighter.width
    : fighter.x - attack.range

  return {
    x: attackX,
    y: fighter.y + 56,
    width: attack.range,
    height: attack.height
  }
}

const isOverlap = (a, b) => (
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y
)

const startAttack = (fighter, kind) => {
  if (fighter.attackCooldown > 0 || fighter.hitStun > 0 || matchState.over) return

  if (kind === 'punch') {
    fighter.activeAttack = {
      type: 'punch',
      remaining: 12,
      total: 12,
      range: 48,
      height: 44,
      damage: 8,
      knockback: 4.2,
      hitDone: false
    }
    fighter.attackCooldown = 18
    return
  }

  fighter.activeAttack = {
    type: 'kick',
    remaining: 16,
    total: 16,
    range: 66,
    height: 56,
    damage: 14,
    knockback: 5.4,
    hitDone: false
  }
  fighter.attackCooldown = 24
}

const applyHit = (attacker, defender) => {
  if (!attacker.activeAttack || attacker.activeAttack.hitDone) return

  const hitBox = getAttackRect(attacker, attacker.activeAttack)
  const hurtBox = getBodyRect(defender)
  if (!isOverlap(hitBox, hurtBox)) return

  attacker.activeAttack.hitDone = true
  defender.hp = Math.max(0, defender.hp - attacker.activeAttack.damage)
  defender.hitStun = 12
  defender.velocityX = attacker.facing * attacker.activeAttack.knockback
  defender.velocityY = -2.2

  if (defender.hp <= 0) {
    matchState.over = true
    matchState.winnerText = `${attacker.name} 获胜！`
  }
}

const evaluateClock = () => {
  if (roundClock > 0 || matchState.over) return
  matchState.over = true
  if (fighterOne.hp === fighterTwo.hp) {
    matchState.winnerText = '平局！'
    return
  }
  matchState.winnerText = fighterOne.hp > fighterTwo.hp
    ? `${fighterOne.name} 时间胜利！`
    : `${fighterTwo.name} 时间胜利！`
}

const resolveAnimState = (fighter) => {
  if (fighter.hitStun > 0) return 'hit'
  if (fighter.activeAttack?.type === 'punch') return 'punch'
  if (fighter.activeAttack?.type === 'kick') return 'kick'
  if (!canJump(fighter)) return 'jump'
  if (Math.abs(fighter.velocityX) > 0.7) return 'walk'
  return 'idle'
}

const basePose = () => ({
  head: { x: 40, y: 6, w: 24, h: 24 },
  neck: { x: 49, y: 30, w: 8, h: 4 },
  torso: { x: 34, y: 36, w: 32, h: 44 },
  chest: { x: 32, y: 40, w: 34, h: 18 },
  waist: { x: 36, y: 80, w: 30, h: 12 },
  leftUpperArm: { x: 22, y: 40, w: 10, h: 22 },
  leftForeArm: { x: 20, y: 61, w: 10, h: 18 },
  rightUpperArm: { x: 66, y: 42, w: 10, h: 20 },
  rightForeArm: { x: 72, y: 60, w: 10, h: 18 },
  leftHand: { x: 18, y: 77, w: 12, h: 8 },
  rightHand: { x: 80, y: 76, w: 12, h: 8 },
  leftThigh: { x: 38, y: 94, w: 12, h: 28 },
  leftShin: { x: 38, y: 122, w: 12, h: 26 },
  rightThigh: { x: 54, y: 92, w: 12, h: 26 },
  rightShin: { x: 56, y: 118, w: 12, h: 28 },
  leftShoe: { x: 36, y: 148, w: 16, h: 8 },
  rightShoe: { x: 54, y: 148, w: 16, h: 8 },
  ball: { x: 69, y: 70, r: 8 }
})

const applyIdlePose = (pose, frame) => {
  const bob = Math.round(Math.sin(frame * 0.08) * 1.5)
  pose.head.y += bob
  pose.neck.y += bob
  pose.torso.y += bob
  pose.chest.y += bob
  pose.waist.y += bob
  pose.leftUpperArm.y += bob
  pose.leftForeArm.y += bob
  pose.rightUpperArm.y += bob
  pose.rightForeArm.y += bob
  pose.leftHand.y += bob
  pose.rightHand.y += bob
  pose.ball.y += bob
}

const applyWalkPose = (pose, frame) => {
  const swing = Math.sin(frame * 0.28)
  const antiSwing = Math.sin(frame * 0.28 + Math.PI)
  const liftLeft = Math.max(0, antiSwing)
  const liftRight = Math.max(0, swing)

  pose.leftUpperArm.x -= Math.round(swing * 4)
  pose.leftForeArm.x -= Math.round(swing * 5)
  pose.leftHand.x -= Math.round(swing * 5)
  pose.rightUpperArm.x += Math.round(swing * 4)
  pose.rightForeArm.x += Math.round(swing * 5)
  pose.rightHand.x += Math.round(swing * 6)

  pose.leftThigh.x -= Math.round(swing * 3)
  pose.leftShin.x -= Math.round(swing * 4)
  pose.leftShin.y -= Math.round(liftLeft * 6)
  pose.leftShoe.x -= Math.round(swing * 4)
  pose.leftShoe.y -= Math.round(liftLeft * 6)

  pose.rightThigh.x += Math.round(swing * 3)
  pose.rightShin.x += Math.round(swing * 4)
  pose.rightShin.y -= Math.round(liftRight * 6)
  pose.rightShoe.x += Math.round(swing * 4)
  pose.rightShoe.y -= Math.round(liftRight * 6)
  pose.ball.y += Math.round(Math.abs(swing) * 6)
}

const applyJumpPose = (pose, frame) => {
  const sway = Math.round(Math.sin(frame * 0.15) * 2)
  pose.head.y -= 2
  pose.torso.y -= 2
  pose.chest.y -= 2
  pose.waist.y -= 2

  pose.leftUpperArm.x = 20 + sway
  pose.leftUpperArm.y = 24
  pose.leftForeArm.x = 16 + sway
  pose.leftForeArm.y = 10
  pose.rightUpperArm.x = 62 + sway
  pose.rightUpperArm.y = 24
  pose.rightForeArm.x = 68 + sway
  pose.rightForeArm.y = 10
  pose.leftHand.x = 14 + sway
  pose.leftHand.y = 2
  pose.rightHand.x = 74 + sway
  pose.rightHand.y = 2

  pose.leftThigh.y = 96
  pose.leftShin.y = 120
  pose.leftShin.x = 34
  pose.leftShoe.x = 32
  pose.leftShoe.y = 146

  pose.rightThigh.y = 96
  pose.rightShin.y = 120
  pose.rightShin.x = 42
  pose.rightShoe.x = 42
  pose.rightShoe.y = 146
  pose.ball.x = 74 + sway
  pose.ball.y = -6
}

const applyPunchPose = (pose, attack) => {
  const t = 1 - attack.remaining / attack.total
  const extend = Math.round((1 - Math.abs(0.5 - t) * 2) * 26)
  pose.torso.x -= 3
  pose.chest.x -= 3
  pose.head.x += 3
  pose.head.y -= 1
  pose.rightUpperArm.x = 64 + Math.round(extend * 0.4)
  pose.rightForeArm.x = 72 + extend
  pose.rightForeArm.y = 53
  pose.rightHand.x = 82 + extend
  pose.rightHand.y = 54
  pose.leftUpperArm.x = 18
  pose.leftForeArm.x = 14
  pose.leftHand.x = 12
  pose.ball.x = 22
  pose.ball.y = 73
}

const applyKickPose = (pose, attack) => {
  const t = 1 - attack.remaining / attack.total
  const extend = Math.round((1 - Math.abs(0.5 - t) * 2) * 28)
  pose.torso.x -= 3
  pose.chest.x -= 3
  pose.head.x += 3
  pose.head.y -= 1

  pose.rightThigh.x = 46 + Math.round(extend * 0.3)
  pose.rightThigh.y = 90 - Math.round(extend * 0.1)
  pose.rightShin.x = 46 + extend
  pose.rightShin.y = 112 - Math.round(extend * 0.22)
  pose.rightShoe.x = 44 + extend + 2
  pose.rightShoe.y = 140 - Math.round(extend * 0.22)

  pose.leftThigh.x = 32
  pose.leftShin.x = 32
  pose.leftShoe.x = 30
  pose.rightHand.x = 78
  pose.leftHand.x = 18
  pose.ball.x = 24
  pose.ball.y = 74
}

const applyHitPose = (pose, frame) => {
  const shake = Math.round(Math.sin(frame * 0.7) * 2)
  pose.head.x -= 4 + shake
  pose.torso.x -= 3 + shake
  pose.chest.x -= 3 + shake
  pose.waist.x -= 3 + shake
  pose.rightUpperArm.x -= 2
  pose.rightForeArm.x -= 3
  pose.rightHand.x -= 3
  pose.leftUpperArm.x -= 2
  pose.leftForeArm.x -= 3
  pose.leftHand.x -= 3
  pose.ball.x = 16
  pose.ball.y = 92
}

const getPoseFrame = (fighter) => {
  const pose = basePose()
  const state = resolveAnimState(fighter)
  const frame = fighter.animFrame

  // 头朝右+身子前倾的基础姿态（参考用户给的第二张图）。
  pose.head.x += 4
  pose.torso.x -= 2
  pose.chest.x -= 2
  pose.waist.x -= 2
  pose.rightUpperArm.y += 2
  pose.rightForeArm.y += 2
  pose.leftUpperArm.y += 1
  pose.leftForeArm.y += 1

  applyIdlePose(pose, frame)
  if (state === 'walk') applyWalkPose(pose, frame)
  if (state === 'jump') applyJumpPose(pose, frame)
  if (state === 'punch' && fighter.activeAttack) applyPunchPose(pose, fighter.activeAttack)
  if (state === 'kick' && fighter.activeAttack) applyKickPose(pose, fighter.activeAttack)
  if (state === 'hit') applyHitPose(pose, frame)
  return pose
}

const updateFighter = (fighter, enemy) => {
  fighter.facing = fighter.x < enemy.x ? 1 : -1

  if (!matchState.over && fighter.hitStun === 0) {
    const leftPressed = keyState.get(fighter.controls.left)
    const rightPressed = keyState.get(fighter.controls.right)

    if (leftPressed && !rightPressed) {
      fighter.velocityX = -fighter.speed
    } else if (rightPressed && !leftPressed) {
      fighter.velocityX = fighter.speed
    } else {
      fighter.velocityX *= 0.75
      if (Math.abs(fighter.velocityX) < 0.2) fighter.velocityX = 0
    }

    const jumpPressed = keyState.get(fighter.controls.jump)
    const jumpKey = fighter.controls.jump
    if (jumpPressed && !jumpLatch.has(jumpKey) && canJump(fighter)) {
      jumpLatch.add(jumpKey)
      fighter.velocityY = -fighter.jumpPower
    }
    if (!jumpPressed) {
      jumpLatch.delete(jumpKey)
    }

    if (keyState.get(fighter.controls.punch)) {
      startAttack(fighter, 'punch')
    } else if (keyState.get(fighter.controls.kick)) {
      startAttack(fighter, 'kick')
    }
  } else {
    fighter.velocityX *= 0.9
  }

  fighter.y += fighter.velocityY
  fighter.velocityY += gravity
  fighter.x += fighter.velocityX

  if (fighter.y + fighter.height >= floorY) {
    fighter.y = floorY - fighter.height
    if (fighter.velocityY > 0) fighter.velocityY = 0
  }

  if (fighter.x < 10) fighter.x = 10
  if (fighter.x + fighter.width > canvasWidth - 10) {
    fighter.x = canvasWidth - fighter.width - 10
  }

  if (fighter.attackCooldown > 0) fighter.attackCooldown -= 1
  if (fighter.hitStun > 0) fighter.hitStun -= 1
  if (fighter.activeAttack) {
    fighter.activeAttack.remaining -= 1
    if (fighter.activeAttack.remaining <= 0) fighter.activeAttack = null
  }

  fighter.animFrame += 1
}

const drawBackground = (ctx) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  gradient.addColorStop(0, '#191c2f')
  gradient.addColorStop(1, '#2f2440')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = '#3a3152'
  ctx.fillRect(0, floorY, canvasWidth, canvasHeight - floorY)
}

const drawHud = (ctx) => {
  const barWidth = 320
  const barHeight = 22
  const leftX = 38
  const rightX = canvasWidth - barWidth - 38
  const y = 24

  ctx.fillStyle = '#111'
  ctx.fillRect(leftX, y, barWidth, barHeight)
  ctx.fillRect(rightX, y, barWidth, barHeight)

  ctx.fillStyle = '#e95050'
  ctx.fillRect(leftX, y, (fighterOne.hp / fighterOne.maxHp) * barWidth, barHeight)

  ctx.fillStyle = '#5f9dff'
  ctx.fillRect(
    rightX + (1 - fighterTwo.hp / fighterTwo.maxHp) * barWidth,
    y,
    (fighterTwo.hp / fighterTwo.maxHp) * barWidth,
    barHeight
  )

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText(fighterOne.name, leftX, y + 44)
  ctx.fillText(fighterTwo.name, rightX + barWidth - 94, y + 44)

  ctx.font = 'bold 34px sans-serif'
  ctx.fillStyle = '#ffe08a'
  ctx.fillText(String(Math.ceil(roundClock)), canvasWidth / 2 - 14, 50)

  if (matchState.over) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 44px sans-serif'
    ctx.fillText(matchState.winnerText, canvasWidth / 2 - 170, canvasHeight / 2)
    ctx.font = '20px sans-serif'
    ctx.fillText('点击“重新开始”再来一局', canvasWidth / 2 - 108, canvasHeight / 2 + 38)
  }
}

const drawPixelPart = (ctx, part, fillColor, edgeColor) => {
  ctx.fillStyle = fillColor
  ctx.fillRect(part.x, part.y, part.w, part.h)
  ctx.strokeStyle = edgeColor
  ctx.lineWidth = 1
  ctx.strokeRect(part.x + 0.5, part.y + 0.5, part.w - 1, part.h - 1)
}

const drawBasketball = (ctx, ball) => {
  ctx.fillStyle = '#e47c30'
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#7c3512'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.r - 0.8, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(ball.x - ball.r, ball.y)
  ctx.lineTo(ball.x + ball.r, ball.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(ball.x, ball.y - ball.r)
  ctx.lineTo(ball.x, ball.y + ball.r)
  ctx.stroke()
}

const drawFighter = (ctx, fighter) => {
  const pose = getPoseFrame(fighter)
  const jerseyMain = fighter.color
  const jerseyShade = adjustColor(jerseyMain, -34)
  const shortsColor = adjustColor(jerseyMain, -18)
  const skinColor = '#8f5f43'
  const skinShade = '#6e4631'
  const jerseyTrim = adjustColor(jerseyMain, 22)
  const shoeColor = '#f2f4fa'
  const shoeShade = '#aeb4c2'

  ctx.save()
  ctx.imageSmoothingEnabled = false

  if (fighter.facing === -1) {
    ctx.translate(fighter.x + fighter.width, fighter.y)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(fighter.x, fighter.y)
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  ctx.fillRect(20, fighter.height - 9, 48, 6)

  drawPixelPart(ctx, pose.leftThigh, shortsColor, jerseyShade)
  drawPixelPart(ctx, pose.rightThigh, shortsColor, jerseyShade)
  drawPixelPart(ctx, pose.leftShin, skinColor, skinShade)
  drawPixelPart(ctx, pose.rightShin, skinColor, skinShade)
  drawPixelPart(ctx, pose.leftShoe, shoeColor, shoeShade)
  drawPixelPart(ctx, pose.rightShoe, shoeColor, shoeShade)

  drawPixelPart(ctx, pose.torso, jerseyMain, jerseyShade)
  drawPixelPart(ctx, pose.chest, jerseyTrim, jerseyShade)
  drawPixelPart(ctx, pose.waist, shortsColor, jerseyShade)
  drawPixelPart(ctx, pose.neck, skinColor, skinShade)

  drawPixelPart(ctx, pose.leftUpperArm, skinColor, skinShade)
  drawPixelPart(ctx, pose.leftForeArm, skinColor, skinShade)
  drawPixelPart(ctx, pose.rightUpperArm, skinColor, skinShade)
  drawPixelPart(ctx, pose.rightForeArm, skinColor, skinShade)
  drawPixelPart(ctx, pose.leftHand, skinColor, skinShade)
  drawPixelPart(ctx, pose.rightHand, skinColor, skinShade)

  if (fighter.headSprite) {
    ctx.drawImage(fighter.headSprite, pose.head.x, pose.head.y, pose.head.w, pose.head.h)
  } else {
    drawPixelPart(ctx, pose.head, skinColor, skinShade)
  }

  drawBasketball(ctx, pose.ball)

  ctx.strokeStyle = fighter.color
  ctx.lineWidth = 2
  ctx.strokeRect(12, 2, fighter.width - 24, fighter.height - 6)
  ctx.restore()

  if (fighter.activeAttack) {
    const hitBox = getAttackRect(fighter, fighter.activeAttack)
    ctx.fillStyle = fighter.activeAttack.type === 'punch'
      ? 'rgba(255, 220, 120, 0.35)'
      : 'rgba(255, 120, 120, 0.35)'
    ctx.fillRect(hitBox.x, hitBox.y, hitBox.width, hitBox.height)
  }
}

const tick = (timestamp) => {
  if (!arenaCanvas.value) return
  const ctx = arenaCanvas.value.getContext('2d')
  if (!ctx) return

  if (previousTime === 0) previousTime = timestamp
  const deltaSeconds = Math.min((timestamp - previousTime) / 1000, 0.05)
  previousTime = timestamp

  if (!matchState.over) {
    roundClock = Math.max(0, roundClock - deltaSeconds)
  }

  updateFighter(fighterOne, fighterTwo)
  updateFighter(fighterTwo, fighterOne)
  applyHit(fighterOne, fighterTwo)
  applyHit(fighterTwo, fighterOne)
  evaluateClock()

  drawBackground(ctx)
  drawFighter(ctx, fighterOne)
  drawFighter(ctx, fighterTwo)
  drawHud(ctx)

  animationFrameId = requestAnimationFrame(tick)
}

const handleKeyDown = (event) => {
  keyState.set(normalizeKey(event.key), true)
}

const handleKeyUp = (event) => {
  keyState.set(normalizeKey(event.key), false)
}

const restartMatch = () => {
  fighterOne = createFighter({
    id: 'P1',
    name: '黑曼巴·赤',
    color: '#e95555',
    x: 180,
    facing: 1,
    headSprite: headSpriteCache.p1,
    controls: fighterOne.controls
  })
  fighterTwo = createFighter({
    id: 'P2',
    name: '黑曼巴·蓝',
    color: '#5f9dff',
    x: canvasWidth - 240,
    facing: -1,
    headSprite: headSpriteCache.p2,
    controls: fighterTwo.controls
  })

  roundClock = roundLimitSeconds
  matchState = { over: false, winnerText: '' }
  keyState.clear()
  jumpLatch.clear()
}

onMounted(async () => {
  await hydrateKobeHeads()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  animationFrameId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.kof-page {
  min-height: 100vh;
  background: #101626;
  color: #fff;
  padding: 20px;
  box-sizing: border-box;
}

.hud {
  max-width: 980px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-block h1 {
  margin: 0;
  font-size: 28px;
}

.title-block p {
  margin: 8px 0 0;
  color: #a2b0d8;
}

.restart-btn {
  border: none;
  border-radius: 8px;
  background: #5668ff;
  color: #fff;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.restart-btn:hover {
  background: #4154f6;
}

.arena-wrap {
  max-width: 980px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.arena-canvas {
  display: block;
  width: 100%;
  height: auto;
}

.tips {
  max-width: 980px;
  margin: 20px auto 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
}

.tips h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.controls h3 {
  margin: 0 0 8px;
}

.controls p {
  margin: 4px 0;
  color: #d5dcf5;
}

@media (max-width: 700px) {
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
