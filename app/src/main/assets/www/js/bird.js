class Bird {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    this.x = 80;
    this.y = 260;
    this.width = 34;
    this.height = 24;

    this.gravity = 0.30;
    this.velocity = 0;
    this.jumpForce = -4.6;
    
    this.frame = 0;
    this.frameTimer = 0;
    this.frameInterval = 8;

    this.floatAngle = 0;
    this.sprites = [];
    this.rotation = 0;
  }

  setSkin(sprites) {
    this.sprites = sprites;
  }

  updateMenu() {
    this.floatAngle += 0.08;
    this.y = this.baseMenuY + Math.sin(this.floatAngle) * 5;
    this.rotation = 0;
    this.animateWings();
  }

  updatePlaying() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    if (this.velocity < 0) {
      this.rotation = -20 * (Math.PI / 180);
    } else {
      this.rotation += 3 * (Math.PI / 180);
      if (this.rotation > 70 * (Math.PI / 180)) {
        this.rotation = 70 * (Math.PI / 180);
      }
    }

    this.animateWings();
  }

  jump() {
    this.velocity = this.jumpForce;
  }

  animateWings() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameInterval) {
      this.frame = (this.frame + 1) % 3;
      this.frameTimer = 0;
    }
  }

  draw() {
    if (this.sprites.length < 3) return;

    this.ctx.save();
    this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    this.ctx.rotate(this.rotation);

    const currentSprite = this.sprites[this.frame];
    this.ctx.drawImage(
      currentSprite,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    this.ctx.restore();
  }
}