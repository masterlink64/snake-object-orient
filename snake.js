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
  constructor(keymap, start, dir) {
    this.keymap = keymap; // mapping of keys to directions
    this.parts = [start]; // list of x-y coordinates of parts
    this.dir = dir; // dir to move on next move
    this.growBy = 0; // how many to grow by (goes up after eating)
  }

  draw() {
    // change color later
    for (const p of this.parts) p.draw('orange');
  }

  contains(pt) {
    return this.parts.some(me => me.x === pt.x && me.y === pt.y);
  }
  // console.log('CONTAINS' contains(pt))
  crashIntoSelf() {
    // TODO
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
  
  // so you don't want other class to know about the .parts, abstract the details away
  head() {
    return this.parts[0];
  }

  // how the snake moves
  // TODO: need to not allow the snake to move backwards
  move() {
    const { x, y } = this.head();
    let pt;
    if (this.dir === 'left') pt = new Point(x - 1, y);
    if (this.dir === 'right') pt = new Point(x + 1, y);
    if (this.dir === 'up') pt = new Point(x, y - 1);
    if (this.dir === 'down') pt = new Point(x, y + 1);
    this.parts.unshift(pt);
  }

  handleKey(key) {
    if (this.keymap[key] !== undefined) this.changeDir(this.keymap[key]);
  }

  changeDir(dir) {
    this.dir = dir;
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
  constructor(snake) {
    this.snake = snake;
    this.food = [];
    this.numFood = 3;

    this.interval = null;
    // need to bind onkey to the RIGHT object/class otherwise it will not have the right this
    this.keyListener = this.onkey.bind(this);
  }

  refillFood() {
    while (this.food.length < this.numFood) {
      this.food.push(Pellet.newRandom());
    }
  }

  play() {
    document.addEventListener('keydown', this.keyListener);
    this.interval = window.setInterval(this.tick.bind(this), SPEED);
  }

  onkey(e) {
    this.snake.handleKey(e.key);
  }

  removeFood(pellet) {
    this.food = this.food.filter(
      f => f.pt.x !== pellet.pt.x && f.pt.y !== pellet.pt.y
    );
  }

  tick() {
    console.log('tick');

    const dead = this.snake.crashIntoSelf() || this.snake.crashIntoWall();

    if (!dead) {
      ctx.clearRect(0, 0, SCALE * WIDTH, SCALE * HEIGHT);
      for (const f of this.food) {
        f.draw();
      }
      let eaten;
      this.snake.move();
      this.snake.truncate();
      this.snake.draw();
      if ((eaten = this.snake.eats(this.food))) {
        this.removeFood(eaten);
        this.snake.grow();
      }
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
  'right'
);

const game = new Game(snake);
game.play();
