const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const image = new Image();
image.src = "img/" + document.getElementById("imageList").value;

let particleArray = [];
const numParticles = 5000;
let mappedImage = [];
let hasColor = false;
document.getElementById("hasColor").checked = hasColor;

let animationPaused = true;
let rafId = null;

document.getElementById("imageList").addEventListener("change", () => {
  animationPaused = true;
  cancelAnimationFrame(rafId);
  particleArray.length = 0;
  mappedImage.length = 0;
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  image.src = "img/" + document.getElementById("imageList").value;
});

document.getElementById("hasColor").addEventListener("click", (e) => {
  console.log(e.target);
  hasColor = hasColor === false ? true : false;
  document.getElementById("hasColor").checked = hasColor;
});

image.addEventListener("load", () => {
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    mappedImage.push(row);
  }

  function calcRelativeBrightness(r, g, b) {
    return Math.sqrt(r * r * 0.299 + g * g * 0.587 + b * b * 0.114) / 100;
  }

  class Particle {
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
      this.speed = mappedImage[this.positionY][this.positionX][0];
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
        ? mappedImage[this.positionY][this.positionX][1]
        : "white";
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const init = () => {
    for (let i = 0; i < numParticles; i++) {
      particleArray.push(new Particle());
    }
  };

  init();
  animationPaused = false;
  animate();
});

function animate() {
  if (animationPaused) return;
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.2;
  particleArray.forEach((particle) => {
    particle.update();
    ctx.globalAlpha = particle.speed * 0.5;
    particle.draw();
  });
  rafId = requestAnimationFrame(animate);
}
