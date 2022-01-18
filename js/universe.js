
const N_ROWS = 32
const N_COLS = 32
const N_ROIDS = N_ROWS * N_COLS

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

    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y)
    
    this.prevPos = this.pos.copy()
  }
}

class Sun {
  constructor(x, y, m, sinOff) {
    this.pos = createVector(x, y)
    this.m = m
    this.sinOff = sinOff
  }

  draw() {
    fill(255)
    ellipse(this.pos.x, this.pos.y, 25, 25)
  }

  update() {
    // this.pos.x = Math.sin(frameCount / 25 + this.sinOff) * 50
    // this.pos.y = Math.cos(frameCount / 25 + this.sinOff) * 50
  }
}


const generateAsteroids = () => {
  const asteroids = []
  for (let i = 0; i < N_ROWS; i++) {
    asteroids.push([])
    for (let j = 0; j < N_COLS; j ++) {
      const idx = (i*N_COLS)+j
      const angle = map(idx, 0, N_ROIDS, 0, TWO_PI)
      const r = 200 + map(Math.random(), 0, 1, 0, 20)
      const m = 100

      const x = Math.sin(angle)*r
      const y = Math.cos(angle)*r

      const velVec = createVector(x, y).mult(.004).rotate(PI/2)
      // const velVec = createVector(0.1, 0)

      const a = new Asteroid(x,y,velVec.x, velVec.y, 10)
      asteroids[i].push(a)
    }
  }
  return asteroids
}

class Universe {
  constructor() {
    this.asteroids = generateAsteroids()
    this.sun = new Sun()
  }

  toMatrix(asteroids) {
    if (!this.asteroids) return null

    const matrix = this.asteroids.map(row => row.map(a => {
      return [a.pos.x, a.pos.y, a.m]
    }))

    return matrix
  }

  computeGravityFrame() {
    // console.log(this.toMatrix())
    const asteroidMatrix = this.toMatrix();
    const result = gravityComputer(asteroidMatrix)
    

    for (let i = 0; i < N_ROWS; i++) {
      for (let j = 0; j < N_COLS; j++) {

        const resultForce = result[i][j];
        const forceVector = createVector(...resultForce)
        this.asteroids[i][j].applyForce(forceVector)
        this.asteroids[i][j].update()
      }
    }

    
  }

  draw() {
    this.sun.draw()

    for (const row of this.asteroids) {
      for (const a of row) {
        a.draw()
      }
    }
  }
}

const gpu = new GPU();
const gravityComputer = gpu.createKernel(function (asteroids) {
  const G = 6.67 * 0.00005

  const asteroid = asteroids[this.thread.y][this.thread.x];
  // const [x,y,m] = asteroid
  const x = asteroid[0]
  const y = asteroid[1]
  const m = asteroid[2]

  const d = Math.sqrt(x * x + y * y); // distance from 0, 0 where sun is
  
  const massProduct = (m * 100000*10);
  const gravity = (G * massProduct) / (d*d);

  const vecX = (-x/d) * gravity / m;
  const vecY = (-y/d) * gravity / m;

  return [vecX, vecY];
  // return [0, 0];
}, { argumentTypes: { asteroids: 'Array2D(3)'} }).setOutput([N_COLS, N_ROWS])



// const gravityMatrix = 

// const matrices = generateMatrices()
// const out = multiplyMatrix(matrices[0], matrices[1])