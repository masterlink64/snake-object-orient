SCALE = 20;
WIDTH = 30;
HEIGHT = 30;
SPEED = 400;

/** One-time setup: find HTML canvas element */

const canvas = document.getElementById('board');
canvas.setAttribute('height', HEIGHT * SCALE);
canvas.setAttribute('width', WIDTH * SCALE);
const ctx = canvas.getContext('2d');

/** Point: */

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x * SCALE, this.y * SCALE, SCALE / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  static newRandom() {
    const randRange = (low, hi) => low + Math.floor(Math.random() * (hi - low));
    return new Point(randRange(1, WIDTH), randRange(1, HEIGHT));
  }

  isOutOfBound() {
    return this.x <= 0 || this.x >= WIDTH || this.y <= 0 || this.y >= HEIGHT;
  }
}

/** Food pellet */

class Pellet {
  constructor(x, y) {
    this.pt = new Point(x, y);
  }

  static newRandom() {
    const pt = Point.newRandom();
    return new Pellet(pt.x, pt.y);
  }

  draw() {
    this.pt.draw('green');
  }
}

/** Snake */

class Snake {
  constructor(keymap, start, dir, clr) {
    this.keymap = keymap; // mapping of keys to directions
    this.parts = [start]; // list of x-y coordinates of parts
    this.dir = dir; // dir to move on next move
    this.growBy = 0; // how many to grow by (goes up after eating)
    // color of snake
    this.snakeColor = clr;
  }
  // TODO: allow color to be passed in, instead of hard coding orange - DONE
  draw() {
    // change color later
    for (const p of this.parts) p.draw(this.snakeColor);
  }

  // function to check if pt coordiantes is contained in some parts
  contains(pt) {
    return this.parts.some(me => me.x === pt.x && me.y === pt.y);
  }
  // console.log('CONTAINS' contains(pt))
  crashIntoSelf() {
    // TODO- DONE
    // call head to give us x and y coordinates and will call crash into self
    // checks if coordinates are the same as array

    return this.parts
      .slice(1)
      .some(me => me.x === this.head().x && me.y === this.head().y);
  }

  crashIntoWall() {
    // this.head() gives you instance of Point
    return this.head().isOutOfBound();
  }

  // TODO: a crash into another snake function where it returns a boolean to see if it crashed
  // into another snake

  // so you don't want other class to know about the .parts, abstract the details away
  head() {
    return this.parts[0];
  }

  // how the snake moves
  move() {
    // TODO: need to not allow the snake to move backwards
    // console.log('DIRECTION in MOVE', this.dir);
    const { x, y } = this.head();
    let pt;
    if (this.dir === 'left') pt = new Point(x - 1, y);
    if (this.dir === 'right') pt = new Point(x + 1, y);
    if (this.dir === 'up') pt = new Point(x, y - 1);
    if (this.dir === 'down') pt = new Point(x, y + 1);
    this.parts.unshift(pt);
  }

  handleKey(key) {
    // if not 180 direction
    // key = 'ArrowUp', 'ArrowRight', etc
    // keymap = {ArrowUp: 'up'}
    // try to MOVE logic down to changeDir
    if (this.keymap[key] !== undefined) this.changeDir(this.keymap[key]);
  }

  // handle logic to change direction
  // dir is the NEW direction
  // this.dir is current direction
  changeDir(dir) {
    if (
      (dir === 'left' && this.dir !== 'right') ||
      (dir === 'right' && this.dir !== 'left') ||
      (dir === 'up' && this.dir !== 'down') ||
      (dir === 'down' && this.dir !== 'up')
    ) {
      this.dir = dir;
    }
  }

  grow() {
    this.growBy += 2;
  }

  truncate() {
    if (this.growBy === 0) this.parts.pop();
    else this.growBy--;
  }

  eats(food) {
    const head = this.head();
    return food.find(f => f.pt.x === head.x && f.pt.y === head.y);
  }
}

/** Overall game. */

class Game {
  // to make multiplayer will need an ARRAY of snakes passed in
  constructor(snakes) {
    this.snakes = snakes;
    this.food = [];
    this.numFood = 3;

    this.interval = null;
    // need to bind onkey to the RIGHT object/class otherwise it will not have the right this
    this.keyListener = this.onkey.bind(this);
  }

  // TODO: fix refill food so that it does not refill on the snake- DONE
  refillFood() {
    // somehow check if new pt is NOT on snake if on make then make new one 
    while (this.food.length < this.numFood) {
      const newFood = Pellet.newRandom(); // [x, y]
      // check each snake coordinates if it does not match newFood coordinates
      if (this.snakes.every(snake => !snake.contains(newFood))) this.food.push(newFood);
    }
  }

  play() {
    document.addEventListener('keydown', this.keyListener);
    this.interval = window.setInterval(this.tick.bind(this), SPEED);
  }

  onkey(e) {
    // this.snake.handleKey(e.key);
    // handles multiplayer bind
    this.snakes.forEach(snake => snake.handleKey(e.key));
  }

  removeFood(pellet) {
    this.food = this.food.filter(
      f => f.pt.x !== pellet.pt.x && f.pt.y !== pellet.pt.y
    );
  }
  // moveSnakes has been abstracted from TICK
  moveSnakes() {
    for (let snake of this.snakes) {
      snake.move();
      snake.truncate();
      snake.draw();
      let eaten;
      if ((eaten = snake.eats(this.food))) {
        this.removeFood(eaten);
        snake.grow();
      }
    }
  }
  // return true if any snakes are dead
  // has been abstracted from TICK
  deadSnakes() {
    for (let snake of this.snakes) {
      if (snake.crashIntoSelf() || snake.crashIntoWall()) return true;
    }
    return false;
  }

  tick() {
    console.log('tick');
    // map over array of objs of snakes, and each snake is an obj
    // saying that there are NO dead snakes

    // will need to handle snake crashing into each other
    if (!this.deadSnakes()) {
      ctx.clearRect(0, 0, SCALE * WIDTH, SCALE * HEIGHT);
      for (const f of this.food) {
        f.draw();
      }
      this.moveSnakes();
      this.refillFood();
    } else {
      window.clearInterval(this.interval);
      window.removeEventListener('keydown', this.keyListener);
    }
  }
}

const snake = new Snake(
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' },
  new Point(20, 20),
  'right',
  'blue'
);

const snake1 = new Snake(
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' },
  new Point(20, 20),
  'right',
  'blue'
);

const snake2 = new Snake(
  { a: 'left', d: 'right', w: 'up', s: 'down' },
  new Point(10, 10),
  'right',
  'red'
);

const snakes = [snake1, snake2];
// single player
const game = new Game(snake);
// multiplayer
const gameMulti = new Game(snakes);
// game.play();
gameMulti.play();
