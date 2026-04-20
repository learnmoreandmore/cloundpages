<template>
  <div class="kof-page">
    <header class="hud">
      <div class="title-block">
        <h1>King of Canvas</h1>
        <p>拳皇风双人格斗原型（本地双人）</p>
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

const arenaCanvas = ref(null)
const keyState = new Map()
const jumpLatch = new Set()

let animationFrameId = 0
let previousTime = 0

const createFighter = (config) => ({
  id: config.id,
  name: config.name,
  color: config.color,
  x: config.x,
  y: floorY - 120,
  width: 58,
  height: 120,
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
  activeAttack: null
})

let fighterOne = createFighter({
  id: 'P1',
  name: '烈风',
  color: '#d43f3f',
  x: 180,
  facing: 1,
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
  name: '苍岚',
  color: '#2f7cff',
  x: canvasWidth - 240,
  facing: -1,
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

const canJump = (fighter) => fighter.y + fighter.height >= floorY - 0.5

const getBodyRect = (fighter) => ({
  x: fighter.x,
  y: fighter.y,
  width: fighter.width,
  height: fighter.height
})

const getAttackRect = (fighter, attack) => {
  const attackX = fighter.facing === 1
    ? fighter.x + fighter.width
    : fighter.x - attack.range

  return {
    x: attackX,
    y: fighter.y + 28,
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
      range: 48,
      height: 46,
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
    if (fighter.activeAttack.remaining <= 0) {
      fighter.activeAttack = null
    }
  }
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
  ctx.fillText(fighterTwo.name, rightX + barWidth - 62, y + 44)

  ctx.font = 'bold 34px sans-serif'
  ctx.fillStyle = '#ffe08a'
  ctx.fillText(String(Math.ceil(roundClock)), canvasWidth / 2 - 14, 50)

  if (matchState.over) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 44px sans-serif'
    ctx.fillText(matchState.winnerText, canvasWidth / 2 - 150, canvasHeight / 2)
    ctx.font = '20px sans-serif'
    ctx.fillText('点击“重新开始”再来一局', canvasWidth / 2 - 108, canvasHeight / 2 + 38)
  }
}

const drawFighter = (ctx, fighter) => {
  ctx.fillStyle = fighter.color
  ctx.fillRect(fighter.x, fighter.y, fighter.width, fighter.height)

  ctx.fillStyle = '#f2d0b6'
  ctx.fillRect(fighter.x + 15, fighter.y + 12, 28, 28)

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
    name: '烈风',
    color: '#d43f3f',
    x: 180,
    facing: 1,
    controls: fighterOne.controls
  })

  fighterTwo = createFighter({
    id: 'P2',
    name: '苍岚',
    color: '#2f7cff',
    x: canvasWidth - 240,
    facing: -1,
    controls: fighterTwo.controls
  })

  roundClock = roundLimitSeconds
  matchState = {
    over: false,
    winnerText: ''
  }
  keyState.clear()
  jumpLatch.clear()
}

onMounted(() => {
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
