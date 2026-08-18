// Configuração do Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 360;
canvas.height = 640;

// Gerenciador de Assets (Imagens)
const assets = {};
const assetSources = {
  message: 'Assets/message.png',
  bgDay: 'Assets/background-day.png',
  bgNight: 'Assets/background-night.png',
  base: 'Assets/base.png',

  btc: 'Assets/Bitcoin giratorio.gif',

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
// topHeight = 200, bottomY = 300, centro = (200+300)/2 = 250, ajuste = 250 - 12 = 238
const WAIT_Y = 238;

let coinsProcessed = 0;
let exitPipeSpawned = false;

let secretHoverAngle = 0;

let score = 0;
let highScore = parseInt(localStorage.getItem('flappy_highscore')) || 0;
let scoreHistory = JSON.parse(localStorage.getItem('flappy_score_history')) || [];

let pressedButton = null;
let isGameRunning = false;

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

function checkAllLoaded() {
  loadedCount++;
  if (loadedCount === totalAssets) {
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
  
  selectedBg = Math.random() < 0.5 ? assets.bgDay : assets.bgNight;

  bird = new Bird(canvas, ctx);
  pipeManager = new PipeManager(canvas, ctx, assets.pipe, assets.pipeRev);
  coinManager = new CoinManager(canvas, ctx);
  irisTransition = new IrisTransition(canvas, ctx);

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

function handleInput(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

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
    pipeManager.setPaused(false);
    baseScrollPaused = false;
    bird.jump();
    playSound(sounds.wing);
  }
  else if (gameState === 'GAMEOVER') {
    if (
      clickX >= btnPlayRect.x && clickX <= btnPlayRect.x + btnPlayRect.w &&
      clickY >= btnPlayRect.y && clickY <= btnPlayRect.y + btnPlayRect.h
    ) {
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
      // ============================================
      // RETORNANDO DO MODO MOEDA - CRIA CANO PARA SAIR
      // ============================================
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
      
      pipeManager.reset();
      pipeManager.setPaused(true);
      coinManager.reset();
      
      playSound(sounds.enteringPipe);
      irisTransition.startOpen(canvas.width / 2, canvas.height / 2);
    } else {
      // ============================================
      // ENTRANDO NO MODO MOEDA
      // ============================================
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
      
      pipeManager.reset();
      pipeManager.setPaused(true);
      coinManager.reset();
      coinsProcessed = 0;
      exitPipeSpawned = false;
      
      playSound(sounds.enteringPipe);
      irisTransition.startOpen(canvas.width / 2, canvas.height / 2);
    }
  });
}

function update() {
  const groundY = canvas.height - baseHeight;

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
    
    if (returnPipe) {
      returnPipe.x -= baseSpeed;
      if (returnPipe.x + returnPipe.width < -50) {
        returnPipe = null;
      }
    }
    
    pipeManager.update(bird, (ponto) => {
      score += ponto;
      if (score % 1 === 0) {
        playSound(sounds.point);
      }
    });

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

    const collision = pipeManager.checkCollision(bird);
    if (collision) {
      if (collision.type === 'SECRET_PIPE') {
        triggerEnterPipe(collision, false);
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
    // POSIÇÃO EXATA: ENTRE OS DOIS CANOS (mesma do modo moeda)
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
  if (selectedBg) {
    ctx.drawImage(selectedBg, 0, 0, canvas.width, canvas.height);
  }

  // ============================================
  // ORDEM DE DESENHO
  // ============================================
  
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

  if (irisTransition) {
    irisTransition.draw();
  }
}

function gameLoop() {
  if (!isGameRunning) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}