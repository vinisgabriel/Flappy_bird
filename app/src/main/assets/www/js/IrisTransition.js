class IrisTransition {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.radius = Math.hypot(canvas.width, canvas.height);
    this.maxRadius = this.radius;
    this.state = 'IDLE';
    this.speed = 5;
    this.onComplete = null;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
  }

  startClose(centerX, centerY, onComplete) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = this.maxRadius;
    this.state = 'CLOSING';
    this.onComplete = onComplete;
  }

  startOpen(centerX, centerY, onComplete) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = 0;
    this.state = 'OPENING';
    this.onComplete = onComplete;
  }

  update() {
    if (this.state === 'CLOSING') {
      this.radius -= this.speed;
      if (this.radius <= 0) {
        this.radius = 0;
        this.state = 'IDLE';
        if (this.onComplete) this.onComplete();
      }
    } else if (this.state === 'OPENING') {
      this.radius += this.speed;
      if (this.radius >= this.maxRadius) {
        this.radius = this.maxRadius;
        this.state = 'IDLE';
        if (this.onComplete) this.onComplete();
      }
    }
  }

  draw() {
    if (this.state === 'IDLE' && this.radius >= this.maxRadius) return;

    this.ctx.save();
    this.ctx.beginPath();
    
    this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.arc(this.centerX, this.centerY, Math.max(0, this.radius), 0, Math.PI * 2, true);
    
    this.ctx.fillStyle = 'black';
    this.ctx.fill();
    this.ctx.restore();
  }
}