// utils
function wrapText(text, maxWidth, fontSize, seperator = ' ') {
    const words = text.split(seperator);
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = getTextWidth(currentLine + word, fontSize);

        if (width < maxWidth) {
            currentLine += seperator + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);

    return lines.join('\n');
}

// Helper function to estimate text width
function getTextWidth(text, fontSize) {
    // This is a rough estimate. You might need to adjust the multiplier
    // based on your specific font and canvas settings
    return text.length * fontSize * 0.25;
}

////////////////////////////////////////////////////////////////////////////////
function particleSplat(pos, size, num = 50, color) {
    for (let i = 0; i < num; i++) {
        createParticles(getRandomPosition(pos, size), color ?? visibleRandBlue());
    }
}

function createParticles(pos, color) {
    const particle = new ParticleEmitter(
        pos, 0,                          // pos, angle
        1, .1, 100, PI,                  // emitSize, emitTime, emitRate, emiteCone
        0,                               // tileIndex
        color, color,                    // colorStartA, colorStartB
        color.scale(1, 0), color.scale(1, 0), // colorEndA, colorEndB
        .2, 2, .2, .1, .05,              // time, sizeStart, sizeEnd, speed, angleSpeed
        .99, 1, .5, PI,                  // damping, angleDamping, gravity, cone
        .1, 0, 0, 0,                     // fadeRate, randomness, collide, additive
        0, 10, 0                         // randomColorLinear, renderOrder, localSpace
    );
    particle.renderOrder = 10
}

function visibleRandBlue() {
    const h = 0.6; // 216 degrees in the range [0, 1]
    const s = rand(0.5, 1.0);
    const l = rand(0.2, 0.8);
    return new Color().setHSLA(h, s, l);
}

function createFireworkParticles(pos, color) {
    new ParticleEmitter(
        pos, 0,                          // pos, angle
        1, .1, 100, PI,                  // emitSize, emitTime, emitRate, emiteCone
        0,                               // tileIndex
        color, color,                    // colorStartA, colorStartB
        color.scale(1, 0.5), color.scale(1, 0.5), // colorEndA, colorEndB
        .3, 2.4, .1, 0.5, .2,                // time, sizeStart, sizeEnd, speed, angleSpeed
        .95, .5, .5, PI,                 // damping, angleDamping, gravity, cone
        .2, .8, 0, 1,                    // fadeRate, randomness, collide, additive
        0, 20, 0                         // randomColorLinear, renderOrder, localSpace
    );
}

function getRandomPosition(pos, size) {
    const randomX = pos.x + (Math.random() - 0.5) * size.x;
    const randomY = pos.y + (Math.random() - 0.5) * size.y;
    return vec2(randomX, randomY)
}

function shuffle(array) {
    const cpy = structuredClone(array)
    for (let i = cpy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cpy[i], cpy[j]] = [cpy[j], cpy[i]];
    }
    return cpy
}
////////////////////////////////////////////////////////////////////////////////
function checkIsMobile() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

////////////////////////////////////////////////////////////////////////////////
function nextValidIndex(list, completedIndices) {
    if (completedIndices.includes("all")) return -1;
    const arr = [...Array(list.length).keys()].filter((i) => !completedIndices.includes(i));
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : -1;
}

////////////////////////////////////////////////////////////////////////////////
function save(game, currentLevel, completed) {
    localStorage.setItem(`${game}_completed_${currentLevel}`, JSON.stringify(completed));
}

function load(game, level) {
    try {
        return JSON.parse(localStorage.getItem(`${game}_completed_${level}`) || '[]');
    } catch {
        return [];
    }
}

function clearSave(game, currentLevel) {
    completed = []
    localStorage.removeItem(`${game}_completed_${currentLevel}`);
}

function drawCircle(pos, radius, color) {
    drawCanvas2D(
        pos,
        vec2(radius * 2),
        0,
        false,
        (context) => {
            context.fillStyle = color.toString();
            context.beginPath();
            context.arc(0, 0, radius, 0, 2 * Math.PI);
            context.fill();
        },
        false,
        overlayContext
    );
}

function randElement(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function vec2Equal(v1, v2) {
    return v1.x === v2.x && v1.y === v2.y
}
