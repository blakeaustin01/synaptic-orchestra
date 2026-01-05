let nodes = [];
let instruments = ['sine', 'triangle', 'square', 'sawtooth'];
let synths = [];

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('z-index', '-1'); // canvas behind text
    noStroke();

    // Create 6 stable nodes (representing instruments)
    for (let i = 0; i < 6; i++) {
        let node = {
            x: random(width*0.2, width*0.8),
            y: random(height*0.3, height*0.7),
            vx: random(-0.3, 0.3),
            vy: random(-0.3, 0.3),
            size: 50,
            color: color(random(100,255), random(100,255), random(100,255)),
            pitchBase: 60 + i*2,  // different starting pitch for each instrument
            synth: new Tone.Synth({
                oscillator: { type: instruments[i % instruments.length] },
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.5 }
            }).toDestination()
        };
        nodes.push(node);
        synths.push(node.synth);
    }

    // Start Tone.js Transport for rhythm
    Tone.Transport.bpm.value = 80;
    Tone.Transport.start();

    // Schedule each node to play a repeating note
    nodes.forEach((node, idx) => {
        Tone.Transport.scheduleRepeat((time) => {
            let pitch = node.pitchBase + floor(random(-2,3)); // slight variations
            node.synth.triggerAttackRelease(Tone.Frequency(pitch,"midi"), "8n", time);
        }, "0.5"); // every half beat
    });
}

function draw() {
    background(17);

    nodes.forEach(node => {
        // Slow stable movement
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw node
        fill(node.color);
        ellipse(node.x, node.y, node.size);
    });
}

// Interaction: Slightly nudge nodes on drag
function mouseDragged() {
    let dx = (mouseX - pmouseX) * 0.1;
    let dy = (mouseY - pmouseY) * 0.1;

    nodes.forEach(node => {
        node.vx += dx;
        node.vy += dy;

        // Small pitch modulation based on drag
        let mod = map(abs(dx)+abs(dy),0,50,-2,2);
        node.pitchBase += mod;
        node.pitchBase = constrain(node.pitchBase, 48, 72);
    });
}

// Tap node to emphasize it (increase volume briefly)
function mousePressed() {
    nodes.forEach(node => {
        let d = dist(mouseX, mouseY, node.x, node.y);
        if (d < node.size/2) {
            node.synth.triggerAttackRelease(Tone.Frequency(node.pitchBase,"midi"), "4n");
        }
    });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
