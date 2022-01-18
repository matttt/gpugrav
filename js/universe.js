
// const N_ROWS = 32
// const N_COLS = 32
const N_ROIDS = 500

class Asteroid {
  constructor(x, y, vx, vy, m, r) {
    this.pos = createVector(x, y)
    this.prevPos = this.pos.copy()
    this.vel = createVector(vx, vy)
    this.acc = createVector()
    this.m = m
    this.r = r
  }



  // applyGravity(body) {
  //   const forceVec = p5.Vector.sub(body.pos, this.pos).normalize()
  //   const dist = body.pos.dist(this.pos);

  //   const massProduct = (this.m * body.m);
  //   const gravity = (G * massProduct  * guiOpts.gravity) / (Math.pow(dist, 2)) / this.m;
  //   const gravityScaled = gravity;

  //   forceVec.setMag(gravity/this.m)

  //   // forceVec.limit(0.5)

  //   this.acc.add(forceVec)
  // }

  applyForce(force) {
    this.acc.add(force)
  }

  update() {
    this.vel.add(this.acc)
    this.pos.add(this.vel)

    this.acc = createVector()
  }

  draw() {
    stroke(255)
    fill(255)

    // I draw a line from the previous pos 
    // to the current pos. this way if a particle
    // moving quickly, we see a  line showing how 
    // far it moved that frame 

    // point(this.pos.x, this.pos.y)

    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y)
    this.prevPos = this.pos.copy()
  }
}

class Sun {
  constructor(x, y, m, sinOff) {
    this.pos = createVector(x, y)
    this.m = m
    this.sinOff = sinOff || 0
  }

  draw() {
    fill(255)
    ellipse(this.pos.x, this.pos.y, 25, 25)
  }

  toArray() {
    return [this.pos.x, this.pos.y, this.m]
  }

  update() {
    this.pos.x = Math.sin(frameCount / 25 + this.sinOff) * 50
    this.pos.y = Math.cos(frameCount / 25 + this.sinOff) * 50
  }
}


const generateAsteroids = () => {
  const asteroids = []
  for (let i = 0; i < N_ROIDS; i++) {
      const angle = map(i, 0, N_ROIDS, 0, TWO_PI)
      const roff = (Math.sin(angle*4)*3)
      const r = 200 + map(Math.random(), 0, 1, 0, 20)+ roff
      const m = 100

      const x = Math.sin(angle) * r
      const y = Math.cos(angle) * r
      const velVec = createVector(x, y).mult(.015).rotate(PI / 2)
      // const velVec = createVector(0, 0)

      const a = new Asteroid(x, y, velVec.x, velVec.y, 10)
      // asteroids[i].push(a)
      asteroids.push(a)
  }
  return asteroids
}

// const thresh = .1
// const noiseScale = .00001
// const gridSize = 8
// const generateAsteroids = () => {
//   const asteroids = []
//   for (let i = -width/2; i < width/2; i += gridSize) {
//     for (let j = -height/2; j < height/2; j += gridSize) {

//       const x = i;
//       const y = j;

//       const prob = noise(x*noiseScale,y*noiseScale)

//       if (prob > thresh) {
//         // const velVec = createVector(x, y).mult(.005).rotate(PI / 2)
//         const velVec = createVector(-5,0).rotate(Math.random()/3)


//         const a = new Asteroid(x, y, velVec.x, velVec.y, 10)
//         // asteroids[i].push(a)
//         asteroids.push(a)
//       }
     
//     }
//   }
//   return asteroids
// }
class Universe {
  constructor() {
    this.asteroids = generateAsteroids()
    this.sun = new Sun(0,0,10000000)

    this.initGravityComputer()

  }

  initGravityComputer () {
    const gpu = new GPU();
    this.gravityComputer = gpu.createKernel(function (asteroids, sun) {
      const G = 6.67 * 0.00003

      const asteroid = asteroids[this.thread.x];
      const [x, y, m] = asteroid
      const [sx, sy, sm] = sun

      const dx = sx - x
      const dy = sy - y

      const d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy + 5, 2)); // distance from 0, 0 where sun is

      const massProduct = (m * sm);
      const gravity = (G * massProduct) / (d * d) / m;

      const vecX = (-x / d) * gravity;
      const vecY = (-y / d) * gravity;

      return [vecX, vecY];
      // return [0, 0];
    }, { 
    argumentTypes: { 
      asteroids: 'Array1D(3)',
      sun: 'Array(3)' 
    }, returnType: 'Array(2)' 
  
  }).setOutput([this.asteroids.length])

  }

  toMatrix() {
    if (!this.asteroids) return null

    const matrix = this.asteroids.map(row => row.map(a => {
      return [a.pos.x, a.pos.y, a.m]
    }))

    return matrix
  }

  toFlatArray() {
    return this.asteroids.map(a => [a.pos.x, a.pos.y, a.m])
  }

  computeGravityFrame() {

    // const asteroidMatrix = this.toMatrix();
    // const result = gravityComputer(asteroidMatrix)

    const sunArr = this.sun.toArray()
    const roids = this.toFlatArray()
    const result = this.gravityComputer(roids, sunArr)

    // const result = gravityComputer(GPU.input(this.toFlatArray(), [N_ROWS, N_COLS]));


    // for (let i = 0; i < N_ROWS; i++) {
    //   for (let j = 0; j < N_COLS; j++) {

    //     const resultForce = result[i][j];
    //     const forceVector = createVector(resultForce[0], resultForce[1])
    //     this.asteroids[i][j].applyForce(forceVector)
    //     this.asteroids[i][j].update()
    //   }
    // }

    for (let i = 0; i < this.asteroids.length; i++) {
      const resultForce = result[i];
      const forceVector = createVector(resultForce[0], resultForce[1])
      this.asteroids[i].applyForce(forceVector)
      this.asteroids[i].update()
    }


  }

  update() {
    this.sun.update()
  }

  draw() {
    this.sun.draw()

    // for (const row of this.asteroids) {
    //   for (const a of row) {
    //     a.draw()
    //   }
    // }
    for (const a of this.asteroids) {
      a.draw()
    }
  }
}




// const gravityMatrix =

// const matrices = generateMatrices()
// const out = multiplyMatrix(matrices[0], matrices[1])