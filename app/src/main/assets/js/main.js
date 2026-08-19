// Configuração do Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 360;
canvas.height = 640;

// ============================================
// SPLASH SCREEN - TELA INICIAL
// ============================================
let splashActive = true;
let splashTimer = 0;
const SPLASH_DURATION = 120; // 2 segundos (60 FPS * 2)
let splashImage = null;

// Gerenciador de Assets (Imagens)
const assets = {};
const assetSources = {
  // ============================================
  // SPLASH SCREEN
  // ============================================
  tumb: 'Assets/tumb.jpg',

  message: 'Assets/message.png',
  bgDay: 'Assets/background-day.png',
  bgNight: 'Assets/background-night.png',
  base: 'Assets/base.png',

  // ============================================
  // 6 FRAMES DA MOEDA
  // ============================================
  frame0: 'Assets/frame_0.png',
  frame1: 'Assets/frame_1.png',
  frame2: 'Assets/frame_2.png',
  frame3: 'Assets/frame_3.png',
  frame4: 'Assets/frame_4.png',
  frame5: 'Assets/frame_5.png',

  pipe: 'Assets/pipe-green.png',
  pipeRev: 'Assets/pipe-green -reverse.png',

  yellowUp: 'Assets/yellowbird-upflap.png',
  yellowMid: 'Assets/yellowbird-midflap.png',
  yellowDown: 'Assets/yellowbird-downflap.png',

  blueUp: 'Assets/bluebird-upflap.png',
  blueMid: 'Assets/bluebird-midflap.png',
  blueDown: 'Assets/bluebird-downflap.png',

  redUp: 'Assets/redbird-upflap.png',
  redMid: 'Assets/redbird-midflap.png',
  redDown: 'Assets/redbird-downflap.png',

  gameOver: 'Assets/gameover.png',
  placar: 'Assets/placar.jpg',
  btnPlay: 'Assets/play.jpg',
  btnScorecard: 'Assets/scorecard.jpg',

  medalBronze: 'Assets/Bronze.png',
  medalPrata: 'Assets/Prata.png',
  medalOuro: 'Assets/ouro.png',
  medalPlatina: 'Assets/Platina.png',

  num0: 'Assets/number_0.png',
  num1: 'Assets/number_1.png',
  num2: 'Assets/number_2.png',
  num3: 'Assets/number_3.png',
  num4: 'Assets/number_4.png',
  num5: 'Assets/number_5.png',
  num6: 'Assets/number_6.png',
  num7: 'Assets/number_7.png',
  num8: 'Assets/number_8.png',
  num9: 'Assets/number_9.png'
};

// Gerenciador de Sons
const sounds = {};
const soundSources = {
  wing: 'sons/wing.ogg',
  point: 'sons/point.ogg',
  hit: 'sons/hit.ogg',
  die: 'sons/die.ogg',
  swooshing: 'sons/swooshing.ogg',
  enteringPipe: 'sons/entrando no cano.m4a'
};

for (let key in soundSources) {
  sounds[key] = new Audio(soundSources[key]);
  sounds[key].load();
}

function playSound(audio) {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

let loadedCount = 0;
const totalAssets = Object.keys(assetSources).length;

let gameState = 'MENU';

let selectedBg;
let baseScrollX = 0;
let baseScrollPaused = false;
const baseSpeed = 2;
const baseHeight = 112;
let bird;
let pipeManager;
let coinManager;
let irisTransition;

let targetPipeData = null; 
let suctionPhase = 'ALIGNING';
let isReturningFromSecret = false;

// Controle da animação de entrada no modo moeda
let entrancePipe = null;
let entranceStartY = 0;
let entranceTargetY = 0;
let entranceAnimating = false;
let entranceFrameCount = 0;
let entranceDelay = 0;
const ENTRANCE_DELAY_FRAMES = 10;
const ANIMATION_FRAMES = 35;

// Controle da animação de RETORNO (saindo do cano)
let returnPipe = null;
let returnStartY = 0;
let returnTargetY = 0;
let returnAnimating = false;
let returnFrameCount = 0;
let returnDelay = 0;
const RETURN_DELAY_FRAMES = 10;
const RETURN_ANIMATION_FRAMES = 35;

// POSIÇÃO DE ESPERA (centro entre os canos)
const WAIT_Y = 238;

let coinsProcessed = 0;
let exitPipeSpawned = false;

let secretHoverAngle = 0;

let score = 0;
let highScore = parseInt(localStorage.getItem('flappy_highscore')) || 0;
let scoreHistory = JSON.parse(localStorage.getItem('flappy_score_history')) || [];

let pressedButton = null;
let isGameRunning = false;

// ============================================
// COOLDOWN PARA EVITAR RE-ENTRADA NO MODO MOEDA
// ============================================
let secretCooldown = false;
let secretCooldownTimer = 0;
const SECRET_COOLDOWN_FRAMES = 120;

// ============================================
// FLAG PARA SABER SE O MODO MOEDA JÁ FOI ATIVADO
// ============================================
let secretActivated = false;

// ============================================
// FLAG PARA CONTROLAR A REMOÇÃO DO CANO DE RETORNO
// ============================================
let returnPipeRemoved = false;

// ============================================
// DELAY PARA COMEÇAR A GERAR CANOS NOVAMENTE
// ============================================
let pipeResumeDelay = 0;
const PIPE_RESUME_DELAY_FRAMES = 120;

// ============================================
// CONFIGURAÇÕES DO JOGO - NOVOS PADRÕES
// ============================================
const DEFAULT_CONFIG = {
    gravity: 0.12,
    speed: 1.2,
    jumpForce: -3.4,
    irisSpeed: 2
};

let gameConfig = {
    gravity: 0.12,
    speed: 1.2,
    jumpForce: -3.4,
    irisSpeed: 2
};

let configMenuOpen = false;

function loadConfig() {
    const saved = localStorage.getItem('flappy_config');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameConfig.gravity = parsed.gravity !== undefined ? parsed.gravity : DEFAULT_CONFIG.gravity;
            gameConfig.speed = parsed.speed !== undefined ? parsed.speed : DEFAULT_CONFIG.speed;
            gameConfig.jumpForce = parsed.jumpForce !== undefined ? parsed.jumpForce : DEFAULT_CONFIG.jumpForce;
            gameConfig.irisSpeed = parsed.irisSpeed !== undefined ? parsed.irisSpeed : DEFAULT_CONFIG.irisSpeed;
        } catch(e) {
            resetConfig();
        }
    } else {
        resetConfig();
    }
}

function saveConfig() {
    localStorage.setItem('flappy_config', JSON.stringify(gameConfig));
}

function resetConfig() {
    gameConfig.gravity = DEFAULT_CONFIG.gravity;
    gameConfig.speed = DEFAULT_CONFIG.speed;
    gameConfig.jumpForce = DEFAULT_CONFIG.jumpForce;
    gameConfig.irisSpeed = DEFAULT_CONFIG.irisSpeed;
    saveConfig();
}

function applyConfig() {
    if (bird) {
        bird.gravity = gameConfig.gravity;
        bird.jumpForce = gameConfig.jumpForce;
    }
    if (pipeManager) {
        pipeManager.speed = gameConfig.speed;
    }
    if (irisTransition) {
        irisTransition.setSpeed(gameConfig.irisSpeed);
    }
}

// ============================================

const btnWidth = 100;
const btnHeight = 58;
const boardY = 180;
const boardH = 116;
const btnY = boardY + boardH + 20;

const btnPlayRect = {
  x: canvas.width / 2 - 105,
  y: btnY,
  w: btnWidth,
  h: btnHeight
};

const btnScoreRect = {
  x: canvas.width / 2 + 5,
  y: btnY,
  w: btnWidth,
  h: btnHeight
};

const messageWidth = 184;
const messageHeight = 267;
const messageX = (canvas.width - messageWidth) / 2;
const messageY = (canvas.height - messageHeight) / 2 - 30;

// Posição do botão de engrenagem
let configGearRect = { x: 0, y: 0, w: 30, h: 30 };

function checkAllLoaded() {
  loadedCount++;
  if (loadedCount === totalAssets) {
    // ============================================
    // CARREGA A IMAGEM DA SPLASH SCREEN
    // ============================================
    splashImage = assets.tumb;
    initGame();
  }
}

for (let key in assetSources) {
  assets[key] = new Image();
  assets[key].src = assetSources[key];
  assets[key].onload = checkAllLoaded;
  assets[key].onerror = () => {
    console.error(`Erro ao carregar o asset: ${assetSources[key]}`);
    checkAllLoaded();
  };
}

function initGame() {
  if (isGameRunning) return;
  
  loadConfig();
  selectedBg = Math.random() < 0.5 ? assets.bgDay : assets.bgNight;

  bird = new Bird(canvas, ctx);
  pipeManager = new PipeManager(canvas, ctx, assets.pipe, assets.pipeRev);
  coinManager = new CoinManager(canvas, ctx, assets);
  irisTransition = new IrisTransition(canvas, ctx);

  applyConfig();
  resetToMenu();
  canvas.addEventListener('pointerdown', handleInput);
  
  isGameRunning = true;
  requestAnimationFrame(gameLoop);
}

function resetToMenu() {
  gameState = 'MENU';
  score = 0;
  targetPipeData = null;
  suctionPhase = 'ALIGNING';
  isReturningFromSecret = false;
  coinsProcessed = 0;
  exitPipeSpawned = false;
  entrancePipe = null;
  entranceAnimating = false;
  entranceFrameCount = 0;
  entranceDelay = 0;
  returnPipe = null;
  returnAnimating = false;
  returnFrameCount = 0;
  returnDelay = 0;
  baseScrollPaused = false;
  configMenuOpen = false;
  secretCooldown = false;
  secretCooldownTimer = 0;
  secretActivated = false;
  returnPipeRemoved = false;
  pipeResumeDelay = 0;

  bird.x = canvas.width / 2 - bird.width / 2;
  bird.baseMenuY = messageY + 168;
  bird.y = bird.baseMenuY;
  bird.velocity = 0;
  bird.rotation = 0;

  const skins = [
    [assets.yellowUp, assets.yellowMid, assets.yellowDown],
    [assets.blueUp, assets.blueMid, assets.blueDown],
    [assets.redUp, assets.redMid, assets.redDown]
  ];
  bird.setSkin(skins[Math.floor(Math.random() * skins.length)]);
  
  if (pipeManager) {
    pipeManager.reset();
    pipeManager.setPaused(false);
  }
  if (coinManager) coinManager.reset();
}

function toggleConfigMenu() {
    configMenuOpen = !configMenuOpen;
}

function handleConfigClick(x, y) {
    if (!configMenuOpen) return false;
    
    const panelW = 290;
    const panelH = 420;
    const panelX = (canvas.width - panelW) / 2;
    const panelY = (canvas.height - panelH) / 2 - 10;
    
    // Botão Fechar
    const btnX = (canvas.width - 120) / 2;
    const btnY = panelY + panelH - 45;
    if (x >= btnX && x <= btnX + 120 && y >= btnY && y <= btnY + 35) {
        configMenuOpen = false;
        return true;
    }
    
    const startY = panelY + 65;
    const lineHeight = 55;
    const sliderX = panelX + 20;
    const sliderWidth = panelW - 55;
    const resetX = panelX + panelW - 35;
    const resetBtnSize = 24;
    
    // Reset Gravidade
    if (x >= resetX && x <= resetX + resetBtnSize && y >= startY - 5 && y <= startY + 25) {
        gameConfig.gravity = DEFAULT_CONFIG.gravity;
        applyConfig();
        saveConfig();
        return true;
    }
    
    // Reset Velocidade
    if (x >= resetX && x <= resetX + resetBtnSize && y >= startY + lineHeight - 5 && y <= startY + lineHeight + 25) {
        gameConfig.speed = DEFAULT_CONFIG.speed;
        applyConfig();
        saveConfig();
        return true;
    }
    
    // Reset Força do Pulo
    if (x >= resetX && x <= resetX + resetBtnSize && y >= startY + lineHeight * 2 - 5 && y <= startY + lineHeight * 2 + 25) {
        gameConfig.jumpForce = DEFAULT_CONFIG.jumpForce;
        applyConfig();
        saveConfig();
        return true;
    }
    
    // Reset Velocidade da Íris
    if (x >= resetX && x <= resetX + resetBtnSize && y >= startY + lineHeight * 3 - 5 && y <= startY + lineHeight * 3 + 25) {
        gameConfig.irisSpeed = DEFAULT_CONFIG.irisSpeed;
        applyConfig();
        saveConfig();
        return true;
    }
    
    // Slider Gravidade (0.01 a 0.80)
    if (y >= startY + 12 && y <= startY + 28) {
        const percent = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
        gameConfig.gravity = Math.round((0.01 + percent * 0.79) * 100) / 100;
        applyConfig();
        saveConfig();
        return true;
    }
    
    // Slider Velocidade (0.3 a 5.0)
    if (y >= startY + lineHeight + 12 && y <= startY + lineHeight + 28) {
        const percent = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
        gameConfig.speed = Math.round((0.3 + percent * 4.7) * 10) / 10;
        applyConfig();
        saveConfig();
        return true;
    }
    
    // Slider Força do Pulo (2.0 a 8.0)
    if (y >= startY + lineHeight * 2 + 12 && y <= startY + lineHeight * 2 + 28) {
        const percent = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
        gameConfig.jumpForce = -(Math.round((2.0 + percent * 6.0) * 10) / 10);
        applyConfig();
        saveConfig();
        return true;
    }
    
    // Slider Velocidade da Íris (1 a 10)
    if (y >= startY + lineHeight * 3 + 12 && y <= startY + lineHeight * 3 + 28) {
        const percent = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
        gameConfig.irisSpeed = Math.round(1 + percent * 9);
        applyConfig();
        saveConfig();
        return true;
    }
    
    return false;
}

function drawConfigMenu() {
    if (!configMenuOpen) return;
    
    // Fundo escuro semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Painel
    const panelW = 290;
    const panelH = 420;
    const panelX = (canvas.width - panelW) / 2;
    const panelY = (canvas.height - panelH) / 2 - 10;
    
    ctx.fillStyle = '#DED895';
    ctx.strokeStyle = '#543847';
    ctx.lineWidth = 3;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    
    // Título
    ctx.fillStyle = '#543847';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚙️ CONFIGURAÇÕES', canvas.width / 2, panelY + 15);
    
    // Linha separadora
    ctx.beginPath();
    ctx.moveTo(panelX + 20, panelY + 45);
    ctx.lineTo(panelX + panelW - 20, panelY + 45);
    ctx.strokeStyle = '#543847';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    const startY = panelY + 65;
    const lineHeight = 55;
    const labelX = panelX + 15;
    const sliderX = panelX + 20;
    const sliderWidth = panelW - 55;
    const resetX = panelX + panelW - 35;
    const resetBtnSize = 24;
    
    // ============================================
    // GRAVIDADE (0.01 a 0.80)
    // ============================================
    const y1 = startY;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#543847';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Gravidade', labelX, y1);
    
    ctx.textAlign = 'right';
    ctx.font = '13px Arial';
    ctx.fillStyle = '#E06010';
    ctx.fillText(gameConfig.gravity.toFixed(2), panelX + panelW - 45, y1);
    
    drawSlider(sliderX, y1 + 18, sliderWidth, gameConfig.gravity, 0.01, 0.80);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E06010';
    ctx.font = '16px Arial';
    ctx.fillText('↺', resetX + resetBtnSize/2, y1 + 2);
    
    // ============================================
    // VELOCIDADE (0.3 a 5.0)
    // ============================================
    const y2 = startY + lineHeight;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#543847';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Velocidade', labelX, y2);
    
    ctx.textAlign = 'right';
    ctx.font = '13px Arial';
    ctx.fillStyle = '#E06010';
    ctx.fillText(gameConfig.speed.toFixed(1), panelX + panelW - 45, y2);
    
    drawSlider(sliderX, y2 + 18, sliderWidth, gameConfig.speed, 0.3, 5.0);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E06010';
    ctx.font = '16px Arial';
    ctx.fillText('↺', resetX + resetBtnSize/2, y2 + 2);
    
    // ============================================
    // FORÇA DO PULO (2.0 a 8.0)
    // ============================================
    const y3 = startY + lineHeight * 2;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#543847';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Força do Pulo', labelX, y3);
    
    ctx.textAlign = 'right';
    ctx.font = '13px Arial';
    ctx.fillStyle = '#E06010';
    ctx.fillText(Math.abs(gameConfig.jumpForce).toFixed(1), panelX + panelW - 45, y3);
    
    drawSlider(sliderX, y3 + 18, sliderWidth, Math.abs(gameConfig.jumpForce), 2.0, 8.0);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E06010';
    ctx.font = '16px Arial';
    ctx.fillText('↺', resetX + resetBtnSize/2, y3 + 2);
    
    // ============================================
    // VELOCIDADE DA ÍRIS (1 a 10)
    // ============================================
    const y4 = startY + lineHeight * 3;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#543847';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Velocidade da Íris', labelX, y4);
    
    ctx.textAlign = 'right';
    ctx.font = '13px Arial';
    ctx.fillStyle = '#E06010';
    ctx.fillText(gameConfig.irisSpeed.toFixed(0), panelX + panelW - 45, y4);
    
    drawSlider(sliderX, y4 + 18, sliderWidth, gameConfig.irisSpeed, 1, 10);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E06010';
    ctx.font = '16px Arial';
    ctx.fillText('↺', resetX + resetBtnSize/2, y4 + 2);
    
    // ============================================
    // VALORES PADRÃO ATUALIZADOS
    // ============================================
    const y5 = startY + lineHeight * 4 + 5;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8C4303';
    ctx.font = '10px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText('Padrão: ' + DEFAULT_CONFIG.gravity.toFixed(2) + '  |  ' + DEFAULT_CONFIG.speed.toFixed(1) + '  |  ' + Math.abs(DEFAULT_CONFIG.jumpForce).toFixed(1) + '  |  ' + DEFAULT_CONFIG.irisSpeed.toFixed(0), canvas.width / 2, y5);
    
    // ============================================
    // BOTÃO FECHAR
    // ============================================
    const btnX = (canvas.width - 120) / 2;
    const btnY = panelY + panelH - 45;
    ctx.fillStyle = '#E06010';
    ctx.fillRect(btnX, btnY, 120, 35);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FECHAR', canvas.width / 2, btnY + 18);
}

function drawSlider(x, y, width, value, min, max) {
    const percent = (value - min) / (max - min);
    const thumbX = x + Math.max(0, Math.min(percent, 1)) * width;
    
    // Trilho
    ctx.fillStyle = '#c0b07a';
    ctx.fillRect(x, y, width, 8);
    
    // Preenchimento
    ctx.fillStyle = '#E06010';
    ctx.fillRect(x, y, thumbX - x, 8);
    
    // Botão
    ctx.fillStyle = '#543847';
    ctx.beginPath();
    ctx.arc(thumbX, y + 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function handleInput(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

  // ============================================
  // IGNORA CLIQUE DURANTE A SPLASH SCREEN
  // ============================================
  if (splashActive) return;

  // Se o menu de configurações estiver aberto, processa o clique nele
  if (configMenuOpen) {
    if (handleConfigClick(clickX, clickY)) {
      return;
    }
  }

  if (gameState === 'MENU') {
    gameState = 'PLAYING';
    bird.jump();
    playSound(sounds.wing);
  } 
  else if (gameState === 'PLAYING') {
    bird.jump();
    playSound(sounds.wing);
  }
  else if (gameState === 'SECRET_WAITING') {
    gameState = 'SECRET_PLAYING';
    baseScrollPaused = false;
    bird.jump();
    playSound(sounds.wing);
  }
  else if (gameState === 'SECRET_PLAYING') {
    bird.jump();
    playSound(sounds.wing);
  }
  else if (gameState === 'RETURN_WAITING') {
    gameState = 'PLAYING';
    baseScrollPaused = false;
    bird.jump();
    playSound(sounds.wing);
  }
  else if (gameState === 'GAMEOVER') {
    // Botão de configurações (engrenagem no scorecard)
    if (configGearRect) {
        const g = configGearRect;
        if (clickX >= g.x && clickX <= g.x + g.w && clickY >= g.y && clickY <= g.y + g.h) {
            toggleConfigMenu();
            return;
        }
    }
    
    if (
      clickX >= btnPlayRect.x && clickX <= btnPlayRect.x + btnPlayRect.w &&
      clickY >= btnPlayRect.y && clickY <= btnPlayRect.y + btnPlayRect.h
    ) {
      // Randomiza o cenário ao clicar em PLAY
      selectedBg = Math.random() < 0.5 ? assets.bgDay : assets.bgNight;
      
      pressedButton = 'PLAY';
      playSound(sounds.swooshing);
      setTimeout(() => {
        pressedButton = null;
        resetToMenu();
      }, 120);
      return;
    }

    if (
      clickX >= btnScoreRect.x && clickX <= btnScoreRect.x + btnScoreRect.w &&
      clickY >= btnScoreRect.y && clickY <= btnScoreRect.y + btnScoreRect.h
    ) {
      pressedButton = 'SCORECARD';
      playSound(sounds.swooshing);
      setTimeout(() => {
        pressedButton = null;
        gameState = 'SCORES';
      }, 120);
      return;
    }
  } 
  else if (gameState === 'SCORES') {
    // Verifica se clicou na engrenagem
    if (configGearRect) {
        const g = configGearRect;
        if (clickX >= g.x && clickX <= g.x + g.w && clickY >= g.y && clickY <= g.y + g.h) {
            toggleConfigMenu();
            return;
        }
    }
    // Se não clicou na engrenagem, volta para o game over
    playSound(sounds.swooshing);
    gameState = 'GAMEOVER';
  }
}

function triggerEnterPipe(collisionData, isReturning = false) {
  gameState = 'ENTERING_PIPE';
  targetPipeData = collisionData;
  suctionPhase = 'ALIGNING';
  isReturningFromSecret = isReturning;
  playSound(sounds.enteringPipe);

  const centerX = bird.x + bird.width / 2;
  const centerY = bird.y + bird.height / 2;

  irisTransition.startClose(centerX, centerY, () => {
    if (isReturningFromSecret) {
      // RETORNANDO DO MODO MOEDA
      const pipeX = canvas.width / 2 - 26;
      const topHeight = 200;
      const gapSize = 100;
      const bottomY = topHeight + gapSize;
      
      returnPipe = {
        x: pipeX,
        topHeight: topHeight,
        bottomY: bottomY,
        width: 52,
        isSecret: true,
        active: true
      };
      
      const centerGap = (topHeight + bottomY) / 2;
      returnTargetY = centerGap - bird.height / 2;
      returnStartY = bottomY + 30;
      
      const birdX = pipeX + (52 / 2) - (bird.width / 2);
      
      bird.x = birdX;
      bird.y = returnStartY;
      bird.velocity = 0;
      bird.rotation = 0;
      
      returnAnimating = true;
      returnFrameCount = 0;
      returnDelay = 0;
      gameState = 'RETURNING_FROM_SECRET';
      baseScrollPaused = true;
      
      // LIMPA TODOS OS CANOS NORMAIS
      pipeManager.pipes = [];
      pipeManager.setPaused(true);
      coinManager.reset();
      returnPipeRemoved = false;
      pipeResumeDelay = 0;
      
      secretCooldown = true;
      secretCooldownTimer = 0;
      
      playSound(sounds.enteringPipe);
      irisTransition.startOpen(canvas.width / 2, canvas.height / 2);
    } else {
      // ENTRANDO NO MODO MOEDA
      const pipeX = canvas.width / 2 - 26;
      const topHeight = 200;
      const gapSize = 100;
      const bottomY = topHeight + gapSize;
      
      entrancePipe = {
        x: pipeX,
        topHeight: topHeight,
        bottomY: bottomY,
        width: 52,
        isSecret: true,
        active: true
      };
      
      const centerGap = (topHeight + bottomY) / 2;
      entranceTargetY = centerGap - bird.height / 2;
      entranceStartY = bottomY + 30;
      
      const birdX = pipeX + (52 / 2) - (bird.width / 2);
      
      bird.x = birdX;
      bird.y = entranceStartY;
      bird.velocity = 0;
      bird.rotation = 0;
      
      entranceAnimating = true;
      entranceFrameCount = 0;
      entranceDelay = 0;
      gameState = 'ENTERING_SECRET';
      baseScrollPaused = true;
      
      pipeManager.setPaused(true);
      coinManager.reset();
      coinsProcessed = 0;
      exitPipeSpawned = false;
      
      secretActivated = true;
      
      playSound(sounds.enteringPipe);
      irisTransition.startOpen(canvas.width / 2, canvas.height / 2);
    }
  });
}

function update() {
  const groundY = canvas.height - baseHeight;

  // ============================================
  // SPLASH SCREEN - CONTAGEM REGRESSIVA
  // ============================================
  if (splashActive) {
    splashTimer++;
    if (splashTimer >= SPLASH_DURATION) {
      splashActive = false;
    }
    return; // Não atualiza o jogo enquanto a splash está ativa
  }

  if (irisTransition) {
    irisTransition.update();
  }

  if (gameState === 'MENU') {
    if (!baseScrollPaused) {
      baseScrollX = (baseScrollX + baseSpeed) % canvas.width;
    }
    bird.updateMenu();
  } 
  else if (gameState === 'PLAYING') {
    if (!baseScrollPaused) {
      baseScrollX = (baseScrollX + baseSpeed) % canvas.width;
    }
    bird.updatePlaying();
    
    // REMOVE O CANO DE RETORNO QUANDO SAI DA TELA
    if (returnPipe) {
      returnPipe.x -= baseSpeed;
      if (returnPipe.x + returnPipe.width < -50) {
        returnPipe = null;
        returnPipeRemoved = true;
        pipeResumeDelay = 0;
        // DEPOIS QUE O CANO DE RETORNO SAI, RESETA O pipeManager
        pipeManager.pipes = [];
        pipeManager.spawnTimer = 0;
      }
    }
    
    // DELAY DE 2 SEGUNDOS PARA LIBERAR O pipeManager
    if (returnPipeRemoved && pipeManager.paused) {
      pipeResumeDelay++;
      if (pipeResumeDelay >= PIPE_RESUME_DELAY_FRAMES) {
        pipeManager.setPaused(false);
        returnPipeRemoved = false;
      }
    }
    
    // Só atualiza os canos se o pipeManager não estiver pausado
    if (!pipeManager.paused) {
      pipeManager.update(bird, (ponto) => {
        score += ponto;
        if (score % 1 === 0) {
          playSound(sounds.point);
        }
      });
    }

    if (bird.y < 0) {
      bird.y = 0;
      bird.velocity = 0;
    }

    if (bird.y + bird.height >= groundY) {
      bird.y = groundY - bird.height;
      playSound(sounds.hit);
      playSound(sounds.die);
      triggerGameOver();
    }

    // COOLDOWN
    if (secretCooldown) {
      secretCooldownTimer++;
      if (secretCooldownTimer >= SECRET_COOLDOWN_FRAMES) {
        secretCooldown = false;
        secretCooldownTimer = 0;
      }
    }

    const collision = pipeManager.checkCollision(bird);
    if (collision) {
      if (collision.type === 'SECRET_PIPE') {
        if (!secretCooldown && !secretActivated) {
          triggerEnterPipe(collision, false);
        }
      } else {
        playSound(sounds.hit);
        gameState = 'HIT';
      }
    }
  } 
  else if (gameState === 'ENTERING_PIPE') {
    bird.rotation = 0;
    
    if (targetPipeData) {
      const p = targetPipeData.pipe;
      const targetX = p.x + (p.width / 2) - (bird.width / 2);
      const targetY = p.bottomY - bird.height; 

      if (suctionPhase === 'ALIGNING') {
        bird.x += (targetX - bird.x) * 0.25;
        bird.y += (targetY - bird.y) * 0.25;

        if (Math.abs(bird.x - targetX) < 2 && Math.abs(bird.y - targetY) < 3) {
          bird.x = targetX;
          bird.y = targetY;
          suctionPhase = 'ENTERING';
        }
      } 
      else if (suctionPhase === 'ENTERING') {
        bird.x = targetX;
        bird.y += 2.5;
      }
    }
  }
  else if (gameState === 'ENTERING_SECRET') {
    bird.animateWings();
    
    if (entranceAnimating) {
      entranceFrameCount++;
      
      if (entranceFrameCount <= ENTRANCE_DELAY_FRAMES) {
        bird.y = entranceStartY;
        bird.rotation = 0;
      }
      else {
        const progress = (entranceFrameCount - ENTRANCE_DELAY_FRAMES) / ANIMATION_FRAMES;
        const easedProgress = Math.min(progress, 1);
        
        bird.y = entranceStartY - (entranceStartY - entranceTargetY) * easedProgress;
        bird.rotation = -0.2 * (1 - easedProgress);
        
        const targetX = canvas.width / 2 - bird.width / 2;
        bird.x += (targetX - bird.x) * 0.05;
        
        if (easedProgress >= 1 || entranceFrameCount > ENTRANCE_DELAY_FRAMES + ANIMATION_FRAMES + 10) {
          bird.y = entranceTargetY;
          bird.x = targetX;
          bird.rotation = 0;
          entranceAnimating = false;
          
          gameState = 'SECRET_WAITING';
          secretHoverAngle = 0;
          baseScrollPaused = true;
          coinManager.spawnCoinsPattern();
        }
      }
    }
  }
  else if (gameState === 'RETURNING_FROM_SECRET') {
    bird.animateWings();
    
    if (returnAnimating) {
      returnFrameCount++;
      
      if (returnFrameCount <= RETURN_DELAY_FRAMES) {
        bird.y = returnStartY;
        bird.rotation = 0;
      }
      else {
        const progress = (returnFrameCount - RETURN_DELAY_FRAMES) / RETURN_ANIMATION_FRAMES;
        const easedProgress = Math.min(progress, 1);
        
        bird.y = returnStartY - (returnStartY - returnTargetY) * easedProgress;
        bird.rotation = -0.2 * (1 - easedProgress);
        
        const targetX = canvas.width / 2 - bird.width / 2;
        bird.x += (targetX - bird.x) * 0.05;
        
        if (easedProgress >= 1 || returnFrameCount > RETURN_DELAY_FRAMES + RETURN_ANIMATION_FRAMES + 10) {
          bird.y = returnTargetY;
          bird.x = targetX;
          bird.rotation = 0;
          returnAnimating = false;
          
          gameState = 'RETURN_WAITING';
          secretHoverAngle = 0;
          baseScrollPaused = true;
        }
      }
    }
  }
  else if (gameState === 'SECRET_WAITING') {
    secretHoverAngle += 0.08;
    bird.y = WAIT_Y + Math.sin(secretHoverAngle) * 5;
    bird.rotation = 0;
    bird.animateWings();
  }
  else if (gameState === 'RETURN_WAITING') {
    secretHoverAngle += 0.08;
    bird.y = WAIT_Y + Math.sin(secretHoverAngle) * 5;
    bird.rotation = 0;
    bird.animateWings();
  }
  else if (gameState === 'SECRET_PLAYING') {
    if (!baseScrollPaused) {
      baseScrollX = (baseScrollX + baseSpeed) % canvas.width;
    }
    bird.updatePlaying();
    
    if (entrancePipe) {
      entrancePipe.x -= baseSpeed;
      if (entrancePipe.x + entrancePipe.width < -50) {
        entrancePipe = null;
      }
    }
    
    coinManager.update(bird, (coletou) => {
      coinsProcessed++;
      if (coletou) {
        score += 10;
        playSound(sounds.point);
      }
    });

    if (coinsProcessed >= 10 && !exitPipeSpawned) {
      exitPipeSpawned = true;
      pipeManager.spawnSecretReturnPipe(canvas.width + 20);
    }

    if (exitPipeSpawned) {
      pipeManager.update(bird, () => {});
      const exitPipe = pipeManager.pipes[0];
      if (exitPipe && bird.x + bird.width >= exitPipe.x) {
        triggerEnterPipe({ type: 'SECRET_PIPE', pipe: exitPipe }, true);
      }
    }

    if (bird.y < 0) {
      bird.y = 0;
      bird.velocity = 0;
    }

    if (bird.y + bird.height >= groundY) {
      bird.y = groundY - bird.height;
      playSound(sounds.hit);
      playSound(sounds.die);
      triggerGameOver();
    }
  }
  else if (gameState === 'HIT') {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    bird.rotation += 8 * (Math.PI / 180);
    if (bird.rotation > 90 * (Math.PI / 180)) {
      bird.rotation = 90 * (Math.PI / 180);
    }

    if (bird.y + bird.height >= groundY) {
      bird.y = groundY - bird.height;
      playSound(sounds.die);
      triggerGameOver();
    }
  }
}

function triggerGameOver() {
  gameState = 'GAMEOVER';
  const finalScore = Math.floor(score);
  
  if (finalScore > highScore) {
    highScore = finalScore;
    localStorage.setItem('flappy_highscore', highScore);
  }

  scoreHistory.push(finalScore);
  scoreHistory.sort((a, b) => b - a);
  if (scoreHistory.length > 10) {
    scoreHistory = scoreHistory.slice(0, 10);
  }
  localStorage.setItem('flappy_score_history', JSON.stringify(scoreHistory));
}

function drawNumberRightAligned(value, rightX, topY, digitWidth = 14, digitHeight = 20) {
  const str = value.toString();
  for (let i = str.length - 1; i >= 0; i--) {
    const digit = str[i];
    const img = assets['num' + digit];
    rightX -= digitWidth;
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, rightX, topY, digitWidth, digitHeight);
    }
  }
}

function drawPlayingScore() {
  const scoreStr = Math.floor(score).toString();
  const digitWidth = 24; 
  const totalWidth = scoreStr.length * digitWidth;
  let startX = (canvas.width - totalWidth) / 2;
  const startY = 50;

  for (let i = 0; i < scoreStr.length; i++) {
    const digit = scoreStr[i];
    const img = assets['num' + digit];
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, startX, startY, digitWidth, 36);
    }
    startX += digitWidth;
  }
}

function drawGameOverScreen() {
  if (assets.gameOver) {
    const goW = 192;
    const goH = 42;
    ctx.drawImage(assets.gameOver, (canvas.width - goW) / 2, 120, goW, goH);
  }

  const boardW = 226;
  const boardH = 116;
  const boardX = (canvas.width - boardW) / 2;

  if (assets.placar) {
    ctx.drawImage(assets.placar, boardX, boardY, boardW, boardH);
  }

  const finalScore = Math.floor(score);
  let medalImg = null;

  if (finalScore >= 40) {
    medalImg = assets.medalPlatina;
  } else if (finalScore >= 30) {
    medalImg = assets.medalOuro;
  } else if (finalScore >= 20) {
    medalImg = assets.medalPrata;
  } else if (finalScore >= 10) {
    medalImg = assets.medalBronze;
  }

  if (medalImg && medalImg.complete && medalImg.naturalWidth !== 0) {
    const medalSize = 44;
    const medalX = boardX + 26;
    const medalY = boardY + 41;
    ctx.drawImage(medalImg, medalX, medalY, medalSize, medalSize);
  }

  drawNumberRightAligned(finalScore, boardX + 200, boardY + 36, 14, 20);
  drawNumberRightAligned(highScore, boardX + 200, boardY + 76, 14, 20);

  const playOffset = (pressedButton === 'PLAY') ? 3 : 0;
  const scoreOffset = (pressedButton === 'SCORECARD') ? 3 : 0;

  if (assets.btnPlay) {
    const bx = btnPlayRect.x;
    const by = btnPlayRect.y + playOffset;
    ctx.drawImage(assets.btnPlay, bx, by, btnPlayRect.w, btnPlayRect.h);
  }

  if (assets.btnScorecard) {
    const bx = btnScoreRect.x;
    const by = btnScoreRect.y + scoreOffset;
    ctx.drawImage(assets.btnScorecard, bx, by, btnScoreRect.w, btnPlayRect.h);
  }
}

function drawScoresScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = 260;
  const panelH = 380;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = (canvas.height - panelH) / 2;

  ctx.fillStyle = '#DED895';
  ctx.strokeStyle = '#543847';
  ctx.lineWidth = 4;

  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = '#E06010';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TOP 10 SCORES', canvas.width / 2, panelY + 35);

  ctx.beginPath();
  ctx.moveTo(panelX + 15, panelY + 48);
  ctx.lineTo(panelX + panelW - 15, panelY + 48);
  ctx.strokeStyle = '#543847';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '16px monospace';
  ctx.textAlign = 'left';

  if (scoreHistory.length === 0) {
    ctx.fillStyle = '#543847';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhum recorde registrado!', canvas.width / 2, panelY + 120);
  } else {
    scoreHistory.forEach((pts, idx) => {
      const lineY = panelY + 78 + (idx * 26);
      
      if (idx === 0) {
        ctx.fillStyle = '#E06010';
      } else if (idx === 1 || idx === 2) {
        ctx.fillStyle = '#8C4303';
      } else {
        ctx.fillStyle = '#543847';
      }

      ctx.fillText(`${idx + 1}º`, panelX + 25, lineY);
      
      ctx.textAlign = 'right';
      ctx.fillText(`${pts} pts`, panelX + panelW - 25, lineY);
      ctx.textAlign = 'left';
    });
  }

  // Botão de configurações (engrenagem)
  const gearSize = 30;
  const gearX = panelX + panelW - gearSize - 10;
  const gearY = panelY + 5;
  configGearRect.x = gearX;
  configGearRect.y = gearY;
  configGearRect.w = gearSize;
  configGearRect.h = gearSize;
  
  ctx.fillStyle = '#543847';
  ctx.font = '25px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚙️', gearX + gearSize/2, gearY + gearSize/2);

  ctx.fillStyle = '#FCF8E3';
  ctx.fillRect(panelX + 30, panelY + panelH - 42, panelW - 60, 28);
  ctx.strokeRect(panelX + 30, panelY + panelH - 42, panelW - 60, 28);

  ctx.fillStyle = '#543847';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TOQUE PARA VOLTAR', canvas.width / 2, panelY + panelH - 24);
}

function drawPipeTop(p) {
  if (assets.pipeRev && assets.pipeRev.complete) {
    ctx.drawImage(
      assets.pipeRev,
      0, assets.pipeRev.height - p.topHeight,
      p.width, p.topHeight,
      p.x, 0,
      p.width, p.topHeight
    );
  } else {
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(p.x, 0, p.width, p.topHeight);
  }
}

function drawPipeBottom(p) {
  const bottomHeight = canvas.height - 112 - p.bottomY;
  if (assets.pipe && assets.pipe.complete) {
    ctx.drawImage(
      assets.pipe,
      0, 0,
      p.width, bottomHeight,
      p.x, p.bottomY,
      p.width, bottomHeight
    );
  } else {
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(p.x, p.bottomY, p.width, bottomHeight);
  }
}

function drawPipe(p) {
  drawPipeTop(p);
  drawPipeBottom(p);
}

function draw() {
  // ============================================
  // SPLASH SCREEN - DESENHA A IMAGEM
  // ============================================
  if (splashActive && splashImage && splashImage.complete && splashImage.naturalWidth !== 0) {
    ctx.drawImage(splashImage, 0, 0, canvas.width, canvas.height);
    return; // Não desenha mais nada enquanto a splash está ativa
  }

  if (selectedBg) {
    ctx.drawImage(selectedBg, 0, 0, canvas.width, canvas.height);
  }

  if (gameState === 'ENTERING_SECRET' && entrancePipe) {
    drawPipeTop(entrancePipe);
    if (entranceFrameCount > ENTRANCE_DELAY_FRAMES) {
      if (bird) bird.draw();
    }
    drawPipeBottom(entrancePipe);
  }
  else if (gameState === 'RETURNING_FROM_SECRET' && returnPipe) {
    drawPipeTop(returnPipe);
    if (returnFrameCount > RETURN_DELAY_FRAMES) {
      if (bird) bird.draw();
    }
    drawPipeBottom(returnPipe);
  }
  else if (gameState === 'SECRET_WAITING' && entrancePipe) {
    drawPipe(entrancePipe);
    if (coinManager) coinManager.draw();
    if (bird) bird.draw();
  }
  else if (gameState === 'RETURN_WAITING' && returnPipe) {
    drawPipe(returnPipe);
    if (bird) bird.draw();
  }
  else if (gameState === 'ENTERING_PIPE' && suctionPhase === 'ENTERING') {
    if (bird) bird.draw();
    if (pipeManager) pipeManager.draw();
  }
  else if (gameState === 'SECRET_PLAYING') {
    if (entrancePipe) {
      drawPipe(entrancePipe);
    }
    if (coinManager) coinManager.draw();
    if (exitPipeSpawned && pipeManager) pipeManager.draw();
    if (bird) bird.draw();
  }
  else if (gameState === 'PLAYING') {
    if (returnPipe) {
      drawPipe(returnPipe);
    }
    if (pipeManager) pipeManager.draw();
    if (bird) bird.draw();
  }
  else {
    if (pipeManager) pipeManager.draw();
    if (bird) bird.draw();
  }

  if (gameState === 'MENU') {
    if (assets.message) {
      ctx.drawImage(assets.message, messageX, messageY, messageWidth, messageHeight);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText('Criado por vinisgabriel_2026', canvas.width / 2, canvas.height - 118);
    ctx.shadowBlur = 0;
  }

  const baseY = canvas.height - baseHeight;
  if (assets.base) {
    ctx.drawImage(assets.base, -baseScrollX, baseY, canvas.width, baseHeight);
    ctx.drawImage(assets.base, -baseScrollX + canvas.width, baseY, canvas.width, baseHeight);
  }

  if (
    gameState === 'PLAYING' || 
    gameState === 'HIT' || 
    gameState === 'SECRET_WAITING' || 
    gameState === 'SECRET_PLAYING' ||
    gameState === 'RETURN_WAITING' ||
    gameState === 'ENTERING_SECRET' ||
    gameState === 'RETURNING_FROM_SECRET'
  ) {
    drawPlayingScore();
  }

  if (gameState === 'GAMEOVER') {
    drawGameOverScreen();
  }

  if (gameState === 'SCORES') {
    drawGameOverScreen();
    drawScoresScreen();
  }

  // Menu de configurações (sempre por cima de tudo)
  if (configMenuOpen) {
    drawConfigMenu();
  }

  if (irisTransition) {
    irisTransition.draw();
  }
}

// ============================================
// CAPTURA O BOTÃO "VOLTAR" DO ANDROID
// ============================================
document.addEventListener('backbutton', function(e) {
    // Impede o comportamento padrão (sair do app)
    e.preventDefault();
    
    // Se a splash screen estiver ativa, não faz nada
    if (splashActive) return;
    
    // Se o menu de configurações estiver aberto, fecha ele
    if (configMenuOpen) {
        configMenuOpen = false;
        return;
    }
    
    // Verifica em qual tela o jogador está
    if (gameState === 'GAMEOVER') {
        // Volta para o MENU
        playSound(sounds.swooshing);
        resetToMenu();
    } 
    else if (gameState === 'SCORES') {
        // Volta para o GAMEOVER
        playSound(sounds.swooshing);
        gameState = 'GAMEOVER';
    }
    else if (gameState === 'MENU') {
        // Se estiver no MENU, deixa o comportamento padrão (sair do app)
        // Não faz nada, o Android vai sair naturalmente
        return;
    }
    else if (gameState === 'PLAYING' || 
             gameState === 'HIT' || 
             gameState === 'SECRET_WAITING' || 
             gameState === 'SECRET_PLAYING' ||
             gameState === 'RETURN_WAITING' ||
             gameState === 'ENTERING_SECRET' ||
             gameState === 'RETURNING_FROM_SECRET' ||
             gameState === 'ENTERING_PIPE') {
        // Se estiver jogando, volta para o MENU
        playSound(sounds.swooshing);
        resetToMenu();
    }
    else {
        // Qualquer outro estado, volta para o MENU
        playSound(sounds.swooshing);
        resetToMenu();
    }
});

function gameLoop() {
  if (!isGameRunning) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}