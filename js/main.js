let universe;
function setup() {
  createCanvas(800, 800);

  universe = new Universe();

  // console.log(universe.toMatrix())
}

function draw() {
  console.log(frameRate())
  translate(width/2, height/2)
  background(0)
  universe.computeGravityFrame()
  universe.draw()
}




