const { Room } = require('colyseus')
const { Schema, MapSchema, type } = require('@colyseus/schema');
const { JSDOM } = require('jsdom');

// Set up a mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const LittleJS = require('../lib/server-littlejs.js');
const { EngineObject, vec2, Timer, engineObjects } = LittleJS
// Disable WebGL, audio, and input on the server
LittleJS.setGlEnable(false);
LittleJS.setSoundEnable(false);
LittleJS.setGamepadsEnable(false);


class TankSchema extends Schema {
  @type('number') x;
  @type('number') y;
  @type('number') angle;
  @type('number') r;
  @type('number') g;
  @type('number') b;
}

class BulletSchema extends Schema {
  @type('number') x;
  @type('number') y;
  @type('number') direction;
  @type('string') ownerId;
  @type('string') id;
}

class ObstacleSchema extends Schema {
  @type('number') x;
  @type('number') y;
}

class TankRoomState extends Schema {
  @type({ map: TankSchema }) tanks = new MapSchema();
  @type({ map: BulletSchema }) bullets = new MapSchema();
  @type({ map: ObstacleSchema }) obstacles = new MapSchema();
}

const CANVAS_SIZE = vec2(720);
const LEVEL_SIZE = LittleJS.vec2(100);
const TANK_SIZE = LittleJS.vec2(7);
const TANK_SPEED = 0.25;
const ROTATION_SPEED = 0.05;
const MAX_HITS = 3
const BULLET_SIZE = vec2(2);
const BULLET_SPEED = 2;
const spawnQueue = {}

class Tank extends LittleJS.EngineObject {
  constructor(pos, color, id) {
    super(pos, TANK_SIZE);
    this.color = color;
    this.id = id;
    this.angle = 0;
    this.fireCooldown = 0;
    this.hits = 0
    this.input = { left: false, right: false, up: false, shoot: false }
    this.setCollision();
    this.stuck = false;
    this.targetPos = null;
    this.renderOrder = 1
    this.particle = null;
  }

  update() {
    super.update();
    this.velocity = this.velocity.scale(0.9);
    this.fireCooldown -= LittleJS.timeDelta;

    this.handleInput();
    this.checkBoundaries();
  }

  render() { }

  handleInput() {
    const { left, right, up, shoot } = this.input
    // Rotate the tank
    if (left) this.angle += ROTATION_SPEED; // Left arrow (rotate counterclockwise)
    if (right) this.angle -= ROTATION_SPEED; // Right arrow (rotate clockwise)

    // Move tank forward
    if (up && !this.stuck) { // Z key
      const direction = LittleJS.vec2(1, 0).rotate(this.angle);
      this.velocity = direction.scale(TANK_SPEED);
    }

    // Player shoot with X key
    if (shoot && !this.stuck && this.fireCooldown <= 0) { // X key for shooting
      this.shoot();
      this.fireCooldown = 1.5;
    }
  }

  angleDifference(angleA, angleB) {
    let diff = (angleB - angleA + Math.PI) % (2 * Math.PI) - Math.PI;
    return diff < -Math.PI ? diff + 2 * Math.PI : diff;
  }

  shoot() {
    const bulletPos = this.pos.add(vec2(TANK_SIZE.x * 0.6, 0).rotate(this.angle));
    const dir = vec2(1, 0).rotate(this.angle)
    this.applyForce(dir.scale(-1))
    new Bullet(this.id, Date.now().toString(), bulletPos, dir, this);
  }

  checkBoundaries() {
    this.pos.x = LittleJS.clamp(this.pos.x, TANK_SIZE.x / 2, LEVEL_SIZE.x - TANK_SIZE.x / 2);
    this.pos.y = LittleJS.clamp(this.pos.y, TANK_SIZE.y / 2, LEVEL_SIZE.y - TANK_SIZE.y / 2);
    this.angle = (2 * LittleJS.PI + this.angle) % (2 * LittleJS.PI)
  }

  kill() {
    const id = this.id
    spawnQueue[id] = 5
    this.destroy()
  }
}

class Bullet extends EngineObject {
  constructor(ownerId, id, pos, direction, owner) {
    super(pos, BULLET_SIZE);
    this.ownerId = ownerId
    this.id = id
    this.direction = direction;
    this.owner = owner;
    this.velocity = this.direction.scale(BULLET_SPEED);
    this.elasticity = 1
    this.setCollision()
    this.cooldown = new Timer(0.05)
  }

  update() {
    super.update();

    // Check if bullet goes out of bounds
    if (this.pos.x < 0 || this.pos.x > LEVEL_SIZE.x || this.pos.y < 0 || this.pos.y > LEVEL_SIZE.y) {
      this.destroy();
    }
  }

  render() { }

  collideWithObject(object) {
    if (object instanceof Bullet || this.cooldown.active()) return false
    if (object instanceof Tank) {
      if (!this.cooldown.active()) {
        object.hits += 1
        if (object.hits >= MAX_HITS) {
          object.kill()
        }
        this.destroy()
      }
      return false;
    }
    return true
  }
}

class Obstacle extends EngineObject {
  constructor(id, pos) {
    super(pos, vec2(9));  // Static size for obstacles
    this.setCollision()
    this.mass = 0
    this.id = id
  }

  render() { }
}


export class TankRoom extends Room {
  maxClients = 4;
  fixedTimeStep = 1000 / 60;

  onCreate(options) {
    this.setState(new TankRoomState());

    this.onMessage(0, (client, input) => {
      const tank = LittleJS.engineObjects.find(
        o => o instanceof Tank && o.id === client.sessionId
      )
      if (tank) {
        tank.input = input
      }
    });

    LittleJS.engineInit(
      () => this.gameInit(),
      () => this.gameUpdate(),
      () => { },
      () => { },
      () => { }
    );
  }

  gameInit() {
    LittleJS.setCanvasFixedSize(CANVAS_SIZE);
    LittleJS.setCameraPos(LEVEL_SIZE.scale(0.5));
    LittleJS.setCameraScale(CANVAS_SIZE.x / LEVEL_SIZE.x);

    new Obstacle(LittleJS.rand().toString(), vec2(50, 50))
    new Obstacle(LittleJS.rand().toString(), vec2(30, 70))
    new Obstacle(LittleJS.rand().toString(), vec2(70, 30))
  }

  gameUpdate() {
    // Create sets to store IDs of objects in engineObjects
    const tankIds = new Set();
    const bulletIds = new Set();
    const obstacleIds = new Set();

    LittleJS.engineObjects.forEach(o => {
      if (o instanceof Tank) {
        const t = new TankSchema()
        t.x = o.pos.x
        t.y = o.pos.y
        t.angle = o.angle
        t.r = o.color.r
        t.g = o.color.g
        t.b = o.color.b
        this.state.tanks.set(o.id, t)
        tankIds.add(o.id);
      }
      if (o instanceof Bullet) {
        const b = new BulletSchema()
        b.x = o.pos.x
        b.y = o.pos.y
        b.directionX = o.direction.x
        b.directionY = o.direction.y
        b.ownerId = o.ownerId
        b.id = o.id
        this.state.bullets.set(o.id, b)
        bulletIds.add(o.id);
      }
      if (o instanceof Obstacle) {
        const b = new ObstacleSchema()
        b.x = o.pos.x
        b.y = o.pos.y
        this.state.obstacles.set(o.id, b)
        obstacleIds.add(o.id)
      }
    })

    // Remove tanks that are not in engineObjects
    for (const [id, tank] of this.state.tanks) {
      if (!tankIds.has(id)) {
        this.state.tanks.delete(id);
      }
    }

    // Remove bullets that are not in engineObjects
    for (const [id, bullet] of this.state.bullets) {
      if (!bulletIds.has(id)) {
        this.state.bullets.delete(id);
      }
    }

    // Remove obstacles that are not in engineObjects
    for (const [id, obs] of this.state.obstacles) {
      if (!obstacleIds.has(id)) {
        this.state.obstacles.delete(id);
      }
    }

    for (const id of [...Object.keys(spawnQueue)]) {
      spawnQueue[id] -= LittleJS.timeDelta
      if (spawnQueue[id] <= 0) {
        const pos = getTankPos()
        new Tank(pos, LittleJS.randColor(), id)
        delete spawnQueue[id]
      }
    }
  }

  onJoin(client) {
    const pos = getTankPos()
    new Tank(pos, LittleJS.randColor(), client.sessionId)
  }

  onLeave(client) {
    const id = client.sessionId
    if (id in spawnQueue) {
      delete spawnQueue[id]
    }
    this.state.tanks.delete(id);
    LittleJS.engineObjects.find(o => o instanceof Tank && o.id === id)?.destroy()
  }
}

function getTankPos() {
  const minDistanceFromTanks = 20; // Minimum distance from other tanks
  const maxAttempts = 100; // Maximum number of attempts to find a suitable position

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a random position within the level bounds
    const pos = vec2(
      LittleJS.rand(TANK_SIZE.x / 2, LEVEL_SIZE.x - TANK_SIZE.x / 2),
      LittleJS.rand(TANK_SIZE.y / 2, LEVEL_SIZE.y - TANK_SIZE.y / 2)
    );

    // Check if the position is far enough from other tanks
    const farEnoughFromTanks = LittleJS.engineObjects.every(o => {
      if (o instanceof Tank) {
        return o.pos.distance(pos) >= minDistanceFromTanks;
      }
      return true;
    });

    // Check if the position doesn't overlap with obstacles
    const noObstacleOverlap = LittleJS.engineObjects.every(o => {
      if (o instanceof Obstacle) {
        return !LittleJS.isOverlapping(pos, TANK_SIZE, o.pos, o.size);
      }
      return true;
    });

    // If the position is suitable, return it
    if (farEnoughFromTanks && noObstacleOverlap) {
      return pos;
    }
  }

  // If no suitable position found after max attempts, return a random position
  // This is a fallback to ensure we always return a position
  return vec2(
    LittleJS.rand(TANK_SIZE.x / 2, LEVEL_SIZE.x - TANK_SIZE.x / 2),
    LittleJS.rand(TANK_SIZE.y / 2, LEVEL_SIZE.y - TANK_SIZE.y / 2)
  );
}