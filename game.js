import { Client } from 'colyseus.js';
import {
    EngineObject, vec2, rgb, drawRect, drawLine, drawTextScreen,
    keyIsDown, keyWasPressed, setCanvasFixedSize, setCameraPos,
    setCameraScale, engineInit, ParticleEmitter, lerpAngle, Color,
    PI, cameraPos, drawText, Timer, mobileGamepad
} from './littlejs.js';

// const client = new Client('ws://localhost:2567');
const client = new Client('wss://soapy-elated-marble.glitch.me/');

let clientId
let room;
let tanks = new Map();
let bullets = new Map();
let obstacles = new Map();
const spawnTimer = new Timer

const CANVAS_SIZE = vec2(720);
const LEVEL_SIZE = vec2(100);
const TANK_SIZE = vec2(7);
const BULLET_SIZE = vec2(2);

class Cannon extends EngineObject {
    constructor(tank, length = 7, width = 5, color = new Color(0, 0, 0)) {
        super(tank.pos.copy(), vec2(length, width));
        this.tank = tank;
        this.length = length;
        this.width = width;
        this.color = color;
        this.renderOrder = 1;
    }

    update() {
        this.pos = this.tank.pos.add(vec2(this.length * 0.6, 0).rotate(this.tank.angle));
    }

    render() {
        // Render the cannon as a line extending from the tank
        const cannonEnd = this.tank.pos.add(vec2(this.length, 0).rotate(this.tank.angle));
        drawLine(this.tank.pos, cannonEnd, this.width, this.color);
    }
}

class Tank extends EngineObject {
    constructor(id, x, y) {
        super(vec2(x, y), TANK_SIZE);
        this.id = id;
        this.targetPos = this.pos.copy();
        this.targetAngle = 0
        this.health = 3;
        this.angle = 0;
        this.particle;
        this.cannon = new Cannon(this, TANK_SIZE.x, 3, this.color);
        this.addChild(this.cannon)
        this.renderOrder = 1;
    }

    update() {
        this.pos = this.pos.lerp(this.targetPos, 0.2);
        this.angle = lerpAngle(0.2, this.angle, this.targetAngle)
    }

    render() {
        drawRect(this.pos, TANK_SIZE, this.color);
    }

    updateFromServer(data) {
        if ('x' in data && 'y' in data)
            this.targetPos = vec2(data.x, data.y);
        if ('angle' in data)
            this.targetAngle = data.angle
        if ('r' in data && 'g' in data && 'b' in data) {
            const { r, g, b } = data
            const color = new Color(r, g, b)
            this.color = color
            this.cannon.color = color
        }
    }

    destroy() {
        const color = this.color;
        if (!this.particle) {
            this.particle = new ParticleEmitter(
                this.pos, 0,                          // pos, angle
                30, 0.5, 100, PI,                  // emitSize, emitTime, emitRate, emiteCone
                0,                               // tileIndex
                color, color,                    // colorStartA, colorStartB
                color.scale(1, 0), color.scale(1, 0), // colorEndA, colorEndB
                .2, 10, .2, .1, .05,              // time, sizeStart, sizeEnd, speed, angleSpeed
                .99, 1, .5, PI,                  // damping, angleDamping, gravity, cone
                .1, .5, 0, 0,                     // fadeRate, randomness, collide, additive
                0, 10, 0                         // randomColorLinear, renderOrder, localSpace
            );
            this.particle.renderOrder = 10
        }
        super.destroy()

        if (this.id === clientId)
            spawnTimer.set(5)
    }
}

class Bullet extends EngineObject {
    constructor(ownerId, id, x, y, direction) {
        super(vec2(x, y), BULLET_SIZE);
        this.ownerId = ownerId
        this.id = id
        this.direction = direction;
        this.elasticity = 1
    }

    update() {
        super.update()
        this.pos = this.pos.lerp(this.targetPos, 0.2);
    }

    render() {
        drawRect(this.pos, this.size, new Color(1, 1, 0));
    }

    updateFromServer(data) {
        if ('x' in data && 'y' in data)
            this.targetPos = vec2(data.x, data.y);
        if ('directionX' in data && 'directionY' in data) {
            this.direction = vec2(data.directionX, data.directionY)
        }
    }
}

class Obstacle extends EngineObject {
    constructor(x, y) {
        super(vec2(x, y), vec2(10, 10));  // Static size for obstacles
        this.setCollision()
        this.mass = 0
    }

    updateFromServer(data) {
        if ('x' in data && 'y' in data)
            this.targetPos = vec2(data.x, data.y);
    }

    render() {
        drawRect(this.pos, this.size, new Color(0.5, 0.5, 0.5));
    }
}

async function joinRoom() {
    try {
        room = await client.joinOrCreate('tank_room');
        clientId = room.sessionId
        window.id = clientId

        room.state.tanks.onAdd((tank, key) => {
            const newTank = new Tank(key, tank.x, tank.y);
            tanks.set(key, newTank);
        });
        room.state.tanks.onChange((tank, key) => {
            const localTank = tanks.get(key);
            if (localTank) {
                localTank.updateFromServer(tank);
            }
        });
        room.state.tanks.onRemove((_, key) => {
            const local = tanks.get(key);
            if (local) {
                local.destroy();
                tanks.delete(key);
            }
        });

        room.state.bullets.onAdd((bullet, key) => {
            const { ownerId, id, x, y, direction } = bullet
            const newBullet = new Bullet(ownerId, id, x, y, direction);
            bullets.set(key, newBullet);
        });
        room.state.bullets.onChange((bullet, key) => {
            const local = bullets.get(key);
            if (local) {
                local.updateFromServer(bullet);
            }
        });
        room.state.bullets.onRemove((_, key) => {
            const local = bullets.get(key);
            if (local) {
                local.destroy();
                bullets.delete(key);
            }
        });

        room.state.obstacles.onAdd((obstacle, key) => {
            const { x, y } = obstacle
            const newObstacle = new Obstacle(x, y);
            obstacles.set(key, newObstacle);
        });
        room.state.obstacles.onChange((obstacle, key) => {
            const local = obstacles.get(key);
            if (local) {
                local.updateFromServer(obstacle);
            }
        });
        room.state.obstacles.onRemove((_, key) => {
            const local = obstacles.get(key);
            if (local) {
                local.destroy();
                obstacles.delete(key);
            }
        });
    } catch (e) {
        console.error("JOIN ERROR", e);
    }
}

function gameInit() {
    setCanvasFixedSize(CANVAS_SIZE);
    setCameraPos(LEVEL_SIZE.scale(0.5));
    setCameraScale(CANVAS_SIZE.x / LEVEL_SIZE.x);
    mobileGamepad.show()
    mobileGamepad.registerDefaultButtons()
    joinRoom();
}

let lastInput
function gameUpdate() {
    if (room) {
        const input = {
            left: keyIsDown('ArrowLeft'),
            right: keyIsDown('ArrowRight'),
            up: keyIsDown('KeyZ'),
            shoot: keyIsDown('KeyX'),
        };
        if (!compareInput(input, lastInput)) {
            lastInput = input
            room.send(0, input);
        }
    }
}

function compareInput(a, b) {
    if (!a || !b) return false
    return Object.values(a).toString() === Object.values(b).toString()
}

function gameRender() {
    drawRect(LEVEL_SIZE.scale(0.5), LEVEL_SIZE, rgb(0.8, 0.8, 0.8));
    drawTextScreen("Arrow keys: Rotate, Z: Move, X: Shoot", vec2(360, 20), 20, rgb(0, 0, 0), 0, undefined, 'center');

    if (spawnTimer.active()) {
        const time = Math.floor(-1 * spawnTimer.get())
        drawText(time, cameraPos, 100, new Color(1, 0.1, 0))
    }
}

engineInit(gameInit, gameUpdate, () => { }, gameRender, () => { });