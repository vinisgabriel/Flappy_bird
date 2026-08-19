class CoinManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.coins = [];
    
    // Carrega o GIF do Bitcoin
    this.btcImage = new Image();
    this.btcImage.src = 'Assets/Bitcoin giratorio.gif';
    
    // Para animação manual do GIF
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 6; // AUMENTADO de 3 para 6 (mais lento)
    
    this.coinWidth = 24;
    this.coinHeight = 24;
    this.coinSpacing = 180;
  }

  reset() {
    this.coins = [];
    this.animationFrame = 0;
    this.animationTimer = 0;
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
    const speed = 2;

    // Atualiza a animação do GIF manualmente (mais lenta)
    this.animationTimer++;
    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
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
    for (const coin of this.coins) {
      if (!coin.collected) {
        this.ctx.save();
        this.ctx.translate(coin.x + this.coinWidth / 2, coin.y + this.coinHeight / 2);
        
        // Rotação baseada no frame de animação
        const rotation = (this.animationFrame / 4) * Math.PI * 2;
        this.ctx.rotate(rotation);
        
        if (this.btcImage.complete && this.btcImage.naturalWidth !== 0) {
          this.ctx.drawImage(
            this.btcImage, 
            -this.coinWidth / 2, 
            -this.coinHeight / 2, 
            this.coinWidth, 
            this.coinHeight
          );
        } else {
          // Fallback com círculo dourado
          this.ctx.fillStyle = '#FFD700';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, this.coinWidth / 2, 0, Math.PI * 2);
          this.ctx.fill();
          
          this.ctx.fillStyle = '#B8860B';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('₿', 0, 0);
        }
        
        this.ctx.restore();
      }
    }
  }
}