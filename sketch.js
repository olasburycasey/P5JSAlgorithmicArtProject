let skyBlue, skyWhite;
let sunYellow, sunWhite;
let rayOrange, rayWhite;
let mic;
let maxVol = 0.001;
let smoothInter = 0;
let whiteSeconds = 0;
let lastMillis = 0;
let lString = "F";
let lDepth = 0;
let drops = [];

function setup() {
  createCanvas(800, 800);
  angleMode(DEGREES);
  
  mic = new p5.AudioIn();
  
  skyBlue = color(135, 206, 235);
  skyWhite = color(255);
  sunYellow = color(255, 223, 0);
  sunWhite = color(255);
  rayOrange = color("orange");
  rayWhite = color(255);
  
  for (let i = 0; i < 100; i++) {
    drops.push({ x: random(width), y: random(height), speed: random(8, 16) });
  }

    // In setup(), add a styled start button:
  let btn = createButton('🎤 Click to Start');
  btn.position(350, 380);
  btn.mousePressed(async () => {
    await userStartAudio();
    mic.start();
    btn.remove();
  });
}

function mousePressed() {
  userStartAudio();
  mic.start();
}

function draw() {
  let vol = mic.getLevel();
  
  maxVol = max(maxVol * 0.99, vol);
  
  let inter = vol / maxVol;
  inter = constrain(inter, 0, 1);
  inter = pow(inter, 0.3);
  
  smoothInter = lerp(smoothInter, inter, 0.15);
  
  let now = millis();
  let dt = (now - lastMillis) / 1000;
  lastMillis = now;
  if (smoothInter > 0.85) {
    whiteSeconds += dt;
  }
  
  // --- SKY ---
  let currentSky = lerpColor(skyBlue, skyWhite, smoothInter);
  background(currentSky);
  
  // grass
  stroke(0, 100, 0);
  fill(144, 238, 144);
  rect(0, 700, 800, 100);
  
  // dirt
  stroke(101, 67, 33);
  fill(139, 90, 43);
  rect(0, 720, 800, 80);
  
  // --- RAIN ---
  if (smoothInter > 0.75) {
    let rainAlpha = map(smoothInter, 0.75, 1, 0, 200, true);
    stroke(150, 200, 255, rainAlpha);
    strokeWeight(1);
    for (let d of drops) {
      line(d.x, d.y, d.x, d.y + 20);
      d.y += d.speed;
      if (d.y > 720) {
        d.y = 0;
        d.x = random(width);
      }
    }
  }
  
  // --- RECURSIVE TREE (left) ---
  let treeDepth = floor(map(whiteSeconds, 0, 10, 1, 8, true));
  let treeLength = map(whiteSeconds, 0, 10, 20, 120, true);
  let treeDir = createVector(0, -1);
  drawTree(200, 700, treeDir, treeLength, treeDepth);
  
  // --- L-SYSTEM TREE (right) ---
  let newLDepth = floor(map(whiteSeconds, 0, 10, 0, 5, true));
  if (newLDepth > lDepth) {
    lDepth = newLDepth;
    lString = "F";
    for (let i = 0; i < lDepth; i++) {
      lString = expandLSystem(lString);
    }
  }
  let lLength = map(lDepth, 0, 5, 24, 12, true);
  drawLSystem(lString, lLength);
  
  // --- SUN RAYS ---
  push();
  translate(120, 120);
  
  let currentRay = lerpColor(rayOrange, rayWhite, smoothInter);
  fill(currentRay);
  strokeWeight(1);
  let smoothSec = millis() / 50;
  let angle = map(smoothSec, 0, 60, 0, 360);
  rotate(angle);
  for (let i = 0; i < 8; i++) {
    push();
    rotate(i * 360 / 8);
    triangle(-20, -70, 20, -70, 0, -110);
    pop();
  }
  pop();
  
  // --- SUN ---
  let currentSun = lerpColor(sunYellow, sunWhite, smoothInter);
  fill(currentSun);
  ellipse(120, 120, 120, 120);
}

function drawTree(x, y, direction, length, depth) {
  if (depth === 0) return;

  let dir = direction.copy();
  dir.setMag(length);
  
  let start = createVector(x, y);
  let end = p5.Vector.add(start, dir);
  
  stroke(101, 67, 33);
  strokeWeight(depth);
  line(start.x, start.y, end.x, end.y);
  
  let leftDir = direction.copy();
  leftDir.rotate(-25);
  
  let rightDir = direction.copy();
  rightDir.rotate(25);
  
  drawTree(end.x, end.y, leftDir, length * 0.7, depth - 1);
  drawTree(end.x, end.y, rightDir, length * 0.7, depth - 1);
}

function expandLSystem(s) {
  let result = "";
  for (let c of s) {
    if (c === "F") result += "F[-F]F[+F][F]";
    else result += c;
  }
  return result;
}

function drawLSystem(s, length) {
  let stack = [];
  let pos = createVector(600, 700);
  let dir = createVector(0, -1);

  for (let c of s) {
    if (c === "F") {
      let next = p5.Vector.add(pos, p5.Vector.mult(dir, length));
      stroke(101, 67, 33);
      strokeWeight(1);
      line(pos.x, pos.y, next.x, next.y);
      pos = next;
    } else if (c === "+") {
      dir.rotate(25);
    } else if (c === "-") {
      dir.rotate(-25);
    } else if (c === "[") {
      stack.push({ pos: pos.copy(), dir: dir.copy() });
    } else if (c === "]") {
      let state = stack.pop();
      pos = state.pos;
      dir = state.dir;
    }
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    maxVol = 0.001;
    whiteSeconds = 0;
    lDepth = 0;
    lString = "F";
  }
}