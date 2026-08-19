class CoinManager {
  constructor(canvas, ctx, assets) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.coins = [];
    
    // ============================================
    // CARREGA OS 6 FRAMES DA MOEDA
    // ============================================
    this.frames = [
      assets.frame0,
      assets.frame1,
      assets.frame2,
      assets.frame3,
      assets.frame4,
      assets.frame5
    ];
    
    this.totalFrames = 6;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.animationSpeed = 8; // A cada 8 frames, muda o quadro
    
    this.coinWidth = 28;
    this.coinHeight = 28;
    this.coinSpacing = 180;

    // ============================================
    // FLASH PARA QUANDO COLETA A MOEDA
    // ============================================
    this.flashImage = new Image();
    this.flashImage.src = 'Assets/flashlight.png';
    
    this.flashTimer = 0;           // Contador regressivo
    this.flashDuration = 9;        // 9 frames = ~150ms (60 FPS)
    this.flashPos = { x: 0, y: 0 };
  }

  reset() {
    this.coins = [];
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.flashTimer = 0;           // Reset do flash também
  }

  spawnCoinsPattern() {
    this.coins = [];
    const totalCoins = 10;
    
    const topMargin = 60;
    const bottomMargin = 80;
    const groundY = this.canvas.height - 112;
    const availableHeight = groundY - topMargin - bottomMargin;
    
    let startX = this.canvas.width + 50;

    for (let i = 0; i < totalCoins; i++) {
      const amplitude = availableHeight * 0.35;
      const centerY = topMargin + (availableHeight / 2);
      const y = centerY + Math.sin(i * 0.6) * amplitude;

      this.coins.push({
        x: startX + (i * this.coinSpacing),
        y: y,
        collected: false,
        counted: false
      });
    }
  }

  update(bird, onCollect) {
    const speed = 1.5;

    // ============================================
    // ATUALIZA A ANIMAÇÃO DOS 6 FRAMES
    // ============================================
    this.frameTimer++;
    if (this.frameTimer >= this.animationSpeed) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }

    // ============================================
    // ATUALIZA O TIMER DO FLASH
    // ============================================
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= speed;

      if (!coin.collected) {
        if (
          bird.x < coin.x + this.coinWidth &&
          bird.x + bird.width > coin.x &&
          bird.y < coin.y + this.coinHeight &&
          bird.y + bird.height > coin.y
        ) {
          coin.collected = true;

          // ============================================
          // ATIVA O FLASH NA POSIÇÃO DA MOEDA
          // ============================================
          this.flashTimer = this.flashDuration;
          this.flashPos.x = coin.x;
          this.flashPos.y = coin.y;

          if (onCollect) onCollect(true);
        }
      }

      if (coin.x + this.coinWidth < -50) {
        if (!coin.collected && !coin.counted) {
          coin.counted = true;
          if (onCollect) onCollect(false);
        }
        this.coins.splice(i, 1);
      }
    }
  }

  draw() {
    // ============================================
    // DESENHA O FLASH (se estiver ativo) - 3x MAIOR
    // ============================================
    if (this.flashTimer > 0 && this.flashImage.complete && this.flashImage.naturalWidth !== 0) {
      const alpha = this.flashTimer / this.flashDuration;
      
      // Tamanho 3x maior (84px)
      const flashSize = this.coinWidth * 3;
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(
        this.flashImage,
        this.flashPos.x - this.coinWidth,     // Centraliza (28px para esquerda)
        this.flashPos.y - this.coinWidth,     // Centraliza (28px para cima)
        flashSize,
        flashSize
      );
      this.ctx.restore();
    }

    // ============================================
    // DESENHA AS MOEDAS NÃO COLETADAS
    // ============================================
    for (const coin of this.coins) {
      if (!coin.collected) {
        const currentSprite = this.frames[this.currentFrame];
        
        if (currentSprite && currentSprite.complete && currentSprite.naturalWidth !== 0) {
          this.ctx.drawImage(
            currentSprite,
            coin.x,
            coin.y,
            this.coinWidth,
            this.coinHeight
          );
        } else {
          // Fallback caso a imagem não tenha carregado
          this.ctx.fillStyle = '#FFD700';
          this.ctx.beginPath();
          this.ctx.arc(coin.x + this.coinWidth / 2, coin.y + this.coinHeight / 2, this.coinWidth / 2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#B8860B';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('₿', coin.x + this.coinWidth / 2, coin.y + this.coinHeight / 2);
        }
      }
    }
  }
}