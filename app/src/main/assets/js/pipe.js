class PipeManager {
  constructor(canvas, ctx, pipeImg, pipeRevImg) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.pipeImg = pipeImg;
    this.pipeRevImg = pipeRevImg;
    
    this.pipes = [];
    this.pipeWidth = 52;
    this.pipeGap = 100;
    this.speed = 2;
    this.spawnTimer = 0;
    this.spawnInterval = 169;
    this.pipeCounter = 0;
    this.paused = false;

    // ============================================
    // SISTEMA DA ESTRELA
    // ============================================
    this._star = null;
    this.starSprites = [];
    this.starCollected = false;
  }

  // ============================================
  // CARREGA OS SPRITES DA ESTRELA
  // ============================================
  setStarSprites(sprite1, sprite2) {
    this.starSprites = [sprite1, sprite2];
  }

  // ============================================
  // GETTER PARA ACESSAR A ESTRELA
  // ============================================
  get star() {
    return this._star;
  }

  reset() {
    this.pipes = [];
    this.spawnTimer = 0;
    this.pipeCounter = 0;
    this.paused = false;
    this._star = null;
    this.starCollected = false;
  }

  setPaused(paused) {
    this.paused = paused;
  }

  spawnSecretReturnPipe(xPos) {
    this.pipes = [];
    
    const topHeight = 120;
    const bottomY = topHeight + this.pipeGap;

    const pipe = {
      x: xPos,
      topHeight: topHeight,
      bottomY: bottomY,
      width: this.pipeWidth,
      passed: true,
      isSecret: true,
      hasStar: true
    };

    this.pipes.push(pipe);

    if (this.starSprites.length === 2) {
      const starSize = 32;
      const gapCenterY = topHeight + (this.pipeGap / 2);
      
      this._star = {
        x: xPos + (this.pipeWidth / 2) - (starSize / 2),
        y: gapCenterY - (starSize / 2),
        size: starSize,
        collected: false,
        frame: 0,
        frameTimer: 0,
        frameInterval: 30
      };
      this.starCollected = false;
    }
  }

  update(bird, onScore) {
    if (!this.paused) {
      this.spawnTimer++;
      
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.pipeCounter++;

        const minTop = 50;
        const maxTop = this.canvas.height - 112 - this.pipeGap - 50;
        const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
        const bottomY = topHeight + this.pipeGap;

        const isSecret = (this.pipeCounter === 10);

        this.pipes.push({
          x: this.canvas.width,
          topHeight: topHeight,
          bottomY: bottomY,
          width: this.pipeWidth,
          passed: false,
          isSecret: isSecret,
          hasStar: false
        });
      }
    }

    if (this._star && !this._star.collected) {
      this._star.frameTimer++;
      if (this._star.frameTimer >= this._star.frameInterval) {
        this._star.frameTimer = 0;
        this._star.frame = (this._star.frame + 1) % 2;
      }
    }

    for (let i = 0; i < this.pipes.length; i++) {
      const p = this.pipes[i];
      p.x -= this.speed;

      if (this._star && !this._star.collected && p.hasStar) {
        this._star.x = p.x + (this.pipeWidth / 2) - (this._star.size / 2);
        const gapCenterY = p.topHeight + (this.pipeGap / 2);
        this._star.y = gapCenterY - (this._star.size / 2) + Math.sin(Date.now() / 500) * 5;
      }

      if (!p.passed && bird.x > p.x + p.width) {
        p.passed = true;
        if (onScore) {
          onScore(0.5);
          onScore(0.5);
        }
      }
    }

    if (this._star && !this._star.collected) {
      const s = this._star;
      if (bird.x < s.x + s.size &&
          bird.x + bird.width > s.x &&
          bird.y < s.y + s.size &&
          bird.y + bird.height > s.y) {
        
        this._star.collected = true;
        this.starCollected = true;
        
        if (onScore) {
          onScore(20);
        }
      }
    }

    this.pipes = this.pipes.filter(p => p.x + p.width > -100 || p.isSecret);
  }

  checkCollision(bird) {
    for (let i = 0; i < this.pipes.length; i++) {
      const p = this.pipes[i];

      const collideTop = 
        bird.x < p.x + p.width &&
        bird.x + bird.width > p.x &&
        bird.y < p.topHeight;

      if (collideTop) {
        return { type: 'PIPE', pipe: p };
      }

      const collideBottom = 
        bird.x < p.x + p.width &&
        bird.x + bird.width > p.x &&
        bird.y + bird.height > p.bottomY;

      if (collideBottom) {
        if (p.isSecret) {
          return { type: 'SECRET_PIPE', pipe: p };
        } else {
          return { type: 'PIPE', pipe: p };
        }
      }
    }

    return null;
  }

  draw() {
    this.pipes.forEach(p => {
      if (this.pipeRevImg && this.pipeRevImg.complete) {
        this.ctx.drawImage(
          this.pipeRevImg,
          0, this.pipeRevImg.height - p.topHeight,
          this.pipeWidth, p.topHeight,
          p.x, 0,
          p.width, p.topHeight
        );
      } else {
        this.ctx.fillStyle = '#73bf2e';
        this.ctx.fillRect(p.x, 0, p.width, p.topHeight);
      }

      const bottomHeight = this.canvas.height - 112 - p.bottomY;
      if (this.pipeImg && this.pipeImg.complete) {
        this.ctx.drawImage(
          this.pipeImg,
          0, 0,
          this.pipeWidth, bottomHeight,
          p.x, p.bottomY,
          p.width, bottomHeight
        );
      } else {
        this.ctx.fillStyle = '#73bf2e';
        this.ctx.fillRect(p.x, p.bottomY, p.width, bottomHeight);
      }

      if (this._star && !this._star.collected && p.hasStar) {
        const s = this._star;
        const currentSprite = this.starSprites[s.frame];
        
        if (currentSprite && currentSprite.complete && currentSprite.naturalWidth !== 0) {
          this.ctx.save();
          this.ctx.shadowColor = '#FFD700';
          this.ctx.shadowBlur = 20;
          this.ctx.drawImage(
            currentSprite,
            s.x,
            s.y,
            s.size,
            s.size
          );
          this.ctx.restore();
        } else {
          this.ctx.fillStyle = '#FFD700';
          this.ctx.font = '30px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('⭐', s.x + s.size/2, s.y + s.size/2);
        }
      }
    });
  }

  isStarCollected() {
    return this.starCollected;
  }

  resetStar() {
    this._star = null;
    this.starCollected = false;
  }
}