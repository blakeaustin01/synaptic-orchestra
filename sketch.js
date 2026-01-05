let nodes = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    // Create random nodes
    for (let i = 0; i < 20; i++) {
        let types = ['attractor', 'repeller', 'oscillator', 'chameleon'];
        nodes.push(new Node(random(width), random(height), random(types)));
    }
}

// Node class
class Node {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.size = 20;
        this.color = color(random(255), random(255), random(255));
        this.pitch = 60 + floor(random(12)); // MIDI note
        this.timbre = ['sine', 'square', 'triangle'][floor(random(3))];
        this.sound = new Tone.Synth({
            oscillator: { type: this.timbre },
            envelope: { attack: 0.05, release: 0.3 }
        }).toDestination();
    }

    applyForce(fx, fy) {
        this.vx += fx;
        this.vy += fy;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.9;
        this.vy *= 0.9;

        // Keep nodes in canvas
        this.x = constrain(this.x, 0, width);
        this.y = constrain(this.y, 0, height);

        // Color change for chameleon
        if(this.type === 'chameleon') {
            this.color = color(random(255), random(255), random(255));
        }
    }

    display() {
        fill(this.color);
        ellipse(this.x, this.y, this.size);
    }

    playSound() {
        let midi = 60 + floor(map(this.y, 0, height, 0, 24));
        this.sound.triggerAttackRelease(Tone.Frequency(midi, "midi"), "8n");
    }
}

// Node interactions
function applyNodeInteractions() {
    for(let i = 0; i < nodes.length; i++) {
        let a = nodes[i];
        for(let j = i+1; j < nodes.length; j++) {
            let b = nodes[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let distSq = dx*dx + dy*dy;
            if(distSq === 0) distSq = 0.01;

            let force = 0;
            if(a.type === 'attractor') force = 50 / distSq;
            if(a.type === 'repeller') force = -100 / distSq;

            let fx = force * dx;
            let fy = force * dy;

            b.applyForce(fx, fy);
            a.applyForce(-fx, -fy);
        }
    }
}

// Main draw loop
function draw() {
    background(17);

    applyNodeInteractions();

    for(let node of nodes){
        node.update();
        node.display();
    }
}

// Interactions
function mousePressed() {
    for(let node of nodes){
        let d = dist(mouseX, mouseY, node.x, node.y);
        if(d < node.size){
            node.playSound();
        }
    }
}

function mouseDragged() {
    let dx = mouseX - pmouseX;
    let dy = mouseY - pmouseY;
    for(let node of nodes){
        node.applyForce(dx * 0.05, dy * 0.05);
    }
}

// Resize canvas
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

