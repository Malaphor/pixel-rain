const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const image = new Image();
image.src = "img/" + document.getElementById("imageList").value;
ctx.lineWidth = 1;

let particleArray = [];
const numParticles = 5000;
let mappedImageForRain = [];
let hasColor = false;
document.getElementById("hasColor").checked = hasColor;
let effectType = document.getElementById("effectList").value;
if (document.getElementById("imageList").value === "witch.jpg") {
  document.getElementById("hasColor").disabled = true;
}

class FlowFieldParticle {
  constructor(effect) {
    this.effect = effect;
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.speedX;
    this.speedY;
    this.speedModifier = Math.random() * 5 + 1;
    this.history = [{ x: this.x, y: this.y }];
    this.maxLength = Math.floor(Math.random() * 200 + 10);
    this.angle = 0;
    this.newAngle;
    this.angleModifier = Math.random() * 0.5 + 0.5;
    this.timer = this.maxLength * 2;
    this.color = "#4c026b";
  }

  update() {
    this.timer--;
    if (this.timer >= 1) {
      let x = Math.floor(this.x / this.effect.cellSize);
      let y = Math.floor(this.y / this.effect.cellSize);
      let index = x + y * this.effect.cols; //which cell

      if (this.effect.flowField[index]) {
        this.newAngle = this.effect.flowField[index].colorAngle;
        if (this.angle < this.newAngle) {
          this.angle += this.angleModifier;
        } else if (this.angle > this.newAngle) {
          this.angle -= this.angleModifier;
        } else {
          this.angle = this.newAngle;
        }
      }

      this.speedX = Math.cos(this.angle);
      this.speedY = Math.sin(this.angle);
      this.x += this.speedX * this.speedModifier;
      this.y += this.speedY * this.speedModifier;

      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.maxLength) {
        this.history.shift();
      }
    } else if (this.history.length > 1) {
      this.history.shift();
    } else {
      this.reset();
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    ctx.stroke();
  }

  reset() {
    let attempts = 0;
    let resetSuccess = false;

    while (attempts < 5 && !resetSuccess) {
      attempts++;
      let testIndex = Math.floor(Math.random() * this.effect.flowField.length);

      if (this.effect.flowField[testIndex].grayscale > 120) {
        this.x = this.effect.flowField[testIndex].x;
        this.y = this.effect.flowField[testIndex].y;
        this.history = [{ x: this.x, y: this.y }];
        this.timer = this.maxLength * 2;
        resetSuccess = true;
      }
    }
    if (!resetSuccess) {
      this.x = Math.floor(Math.random() * this.effect.width);
      this.y = Math.floor(Math.random() * this.effect.height);
      this.history = [{ x: this.x, y: this.y }];
      this.timer = this.maxLength * 2;
    }
  }
}

class FlowFieldEffect {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.particles = [];
    this.numberOfParticles = 1500;
    this.cellSize = 20;
    this.rows;
    this.cols;
    this.flowField = [];
    this.curve = 2.5;
    this.zoom = 0.2;
    this.debug = false;
    this.imagePattern;

    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "d") this.debug = !this.debug;
    });
  }

  init(pixels) {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    //create flow field
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);
    this.flowField.length = 0;

    //scan pixel data
    for (let y = 0; y < this.height; y += this.cellSize) {
      for (let x = 0; x < this.width; x += this.cellSize) {
        const index = (x + y * this.width) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        //const alpha = pixels[index + 3];
        const weightedGrayscale = 0.299 * red + 0.587 * green + 0.114 * blue;
        const grayscale = (red + green + blue) / 3;
        const colorAngle = ((weightedGrayscale / 255) * 6.28).toFixed(2);
        this.flowField.push({
          x: x,
          y: y,
          grayscale: grayscale,
          colorAngle: colorAngle,
          color: `hsl(${calcHue(red, green, blue)}, 100%, 50%)`,
        });
      }
    }

    //create particles
    this.particles.length = 0;
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new FlowFieldParticle(this));
    }
  }

  drawGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 0.3;
    for (let c = 0; c < this.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.cellSize, 0);
      this.ctx.lineTo(c * this.cellSize, this.height);
      this.ctx.stroke();
    }
    for (let r = 0; r < this.rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.cellSize);
      this.ctx.lineTo(this.width, r * this.cellSize);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  render() {
    if (this.debug) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      this.drawGrid();
    }
    this.particles.forEach((particle) => {
      particle.update();
      particle.draw(this.ctx);
    });
  }
}

const flowField = new FlowFieldEffect(canvas, ctx);

function calcHue(r, g, b) {
  // Make r, g, and b fractions of 1
  r /= 255;
  g /= 255;
  b /= 255;

  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0;

  // Calculate hue
  // No difference
  if (delta == 0) h = 0;
  // Red is max
  else if (cmax == r) h = ((g - b) / delta) % 6;
  // Green is max
  else if (cmax == g) h = (b - r) / delta + 2;
  // Blue is max
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  return h;
}

document.getElementById("imageList").addEventListener("change", () => {
  if (document.getElementById("imageList").value === "witch.jpg") {
    ctx.strokeStyle = "white";
    hasColor = false;
    document.getElementById("hasColor").checked = false;
    document.getElementById("hasColor").disabled = true;
  } else {
    document.getElementById("hasColor").disabled = false;
  }

  if (document.getElementById("effectList").value === "rain") {
    particleArray.length = 0;
    mappedImageForRain.length = 0;
  }

  image.src = "img/" + document.getElementById("imageList").value;
});

document.getElementById("effectList").addEventListener("change", () => {
  if (document.getElementById("effectList").value === "rain") {
    effectType = "rain";
    particleArray.length = 0;
    mappedImageForRain.length = 0;
  } else {
    effectType = "flowField";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = hasColor ? flowField.imagePattern : "white";
  }
  if (document.getElementById("imageList").value !== "witch.jpg") {
    document.getElementById("hasColor").disabled = false;
  } else {
    ctx.strokeStyle = "white";
    hasColor = false;
    document.getElementById("hasColor").disabled = true;
  }
  processImageData();
});

document.getElementById("hasColor").addEventListener("click", (e) => {
  hasColor = hasColor === false ? true : false;
  document.getElementById("hasColor").checked = hasColor;
  if (document.getElementById("imageList").value === "witch.jpg") {
    ctx.strokeStyle = "white";
  } else {
    ctx.strokeStyle = hasColor ? flowField.imagePattern : "white";
  }
});

image.addEventListener("load", () => {
  //check if image is divisible by cellSize
  const extraWidth = image.width % flowField.cellSize;
  const extraHeight = image.height % flowField.cellSize;
  //scale image to make divisible by cellSize
  canvas.width =
    extraWidth > flowField.cellSize / 2
      ? image.width + flowField.cellSize - extraWidth
      : image.width - extraWidth;
  canvas.height =
    extraHeight > flowField.cellSize / 2
      ? image.height + flowField.cellSize - extraHeight
      : image.height - extraHeight;

  processImageData();

  animate();
});

function processImageData() {
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (document.getElementById("effectList").value === "rain") {
    mapImage(pixels);
    initRain();
  } else {
    flowField.imagePattern = ctx.createPattern(image, "no-repeat");
    ctx.strokeStyle = hasColor ? flowField.imagePattern : "white";
    flowField.init(pixels);
  }
}

function mapImage(pixels) {
  for (let y = 0; y < canvas.height; y++) {
    let row = [];
    for (let x = 0; x < canvas.width; x++) {
      const red = pixels[y * 4 * canvas.width + x * 4];
      const green = pixels[y * 4 * canvas.width + (x * 4 + 1)];
      const blue = pixels[y * 4 * canvas.width + (x * 4 + 2)];
      const brightness = calcRelativeBrightness(red, green, blue);
      const cell = [brightness, `rgb(${red}, ${green}, ${blue})`];
      row.push(cell);
    }
    mappedImageForRain.push(row);
  }
}

function calcRelativeBrightness(r, g, b) {
  return Math.sqrt(r * r * 0.299 + g * g * 0.587 + b * b * 0.114) / 100;
}

class RainParticle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = 0;
    this.size = Math.random() * 1.5 + 1;
    this.speed = 0;
    this.velocity = Math.random() * 0.5;
    this.positionX = Math.floor(this.x);
    this.positionY = Math.floor(this.y);
  }

  update() {
    this.positionX = Math.floor(this.x);
    this.positionY = Math.floor(this.y);
    this.speed = mappedImageForRain[this.positionY][this.positionX][0];
    let movement = 2.55 - this.speed + this.velocity;

    this.y += movement;
    if (this.y >= canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = hasColor
      ? mappedImageForRain[this.positionY][this.positionX][1]
      : "white";
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initRain() {
  for (let i = 0; i < numParticles; i++) {
    particleArray.push(new RainParticle());
  }
}

function animate() {
  //if rain
  if (effectType == "rain") {
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.2;
    particleArray.forEach((particle) => {
      particle.update();
      ctx.globalAlpha = particle.speed * 0.5;
      particle.draw();
    });
  } else {
    //else flow field
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flowField.render();
  }
  requestAnimationFrame(animate);
}
