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
    this.spawnInterval = 100;
    this.pipeCounter = 0;
    this.paused = false;
  }

  reset() {
    this.pipes = [];
    this.spawnTimer = 0;
    this.pipeCounter = 0;
    this.paused = false;
  }

  setPaused(paused) {
    this.paused = paused;
  }

  spawnSecretReturnPipe(xPos) {
    this.pipes = [];
    
    const topHeight = 120;
    const bottomY = topHeight + this.pipeGap;

    this.pipes.push({
      x: xPos,
      topHeight: topHeight,
      bottomY: bottomY,
      width: this.pipeWidth,
      passed: true,
      isSecret: true
    });
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
          isSecret: isSecret
        });
      }
    }

    for (let i = 0; i < this.pipes.length; i++) {
      const p = this.pipes[i];
      p.x -= this.speed;

      if (!p.passed && bird.x > p.x + p.width) {
        p.passed = true;
        if (onScore) {
          onScore(0.5);
          onScore(0.5);
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
    });
  }
}