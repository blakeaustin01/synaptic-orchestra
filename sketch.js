let nodes = [];
let instruments = ['sine', 'triangle', 'square', 'sawtooth'];
let ambientSynth;
let scale = [0,2,4,5,7,9,11]; // C major
let tempo = 80; 

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('z-index','-1'); 
    noStroke();

    // Create nodes: mix of instruments and ambient/glitch nodes
    for (let i = 0; i < 8; i++) {
        nodes.push(createNode('instrument'));
    }
    for (let i = 0; i < 2; i++) {
        nodes.push(createNode('ambient'));
    }
    
    // Ambient synth for background pads
    ambientSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 1, release: 2 }
    }).toDestination();

    // Start Transport
    Tone.Transport.bpm.value = tempo;
    Tone.Transport.start();

    // Schedule repeating notes
    nodes.forEach((node) => scheduleNode(node));
}

// Node factory
function createNode(type) {
    let node = {
        x: random(width*0.2, width*0.8),
        y: random(height*0.3, height*0.7),
        vx: random(-0.2,0.2),
        vy: random(-0.2,0.2),
        size: type==='ambient'?60:50,
        color: color(random(100,255), random(100,255), random(100,255)),
        pitchBase: 60 + floor(random(-3,3)),
        type: type,
        synth: type==='instrument'?new Tone.Synth({
            oscillator: { type: random(instruments) },
            envelope: { attack: 0.1, decay: 0.2, sustain:0.5, release:0.5 }
        }).toDestination():null
    };
    return node;
}

// Schedule node repeating notes
function scheduleNode(node) {
    if(node.type==='instrument'){
        Tone.Transport.scheduleRepeat((time)=>{
            let pitch = node.pitchBase + scale[floor(random(scale.length))];
            node.synth.triggerAttackRelease(Tone.Frequency(pitch,"midi"), "8n", time);
        }, "0.5");
    } else if(node.type==='ambient'){
        Tone.Transport.scheduleRepeat((time)=>{
            let pitch = node.pitchBase + scale[floor(random(scale.length))];
            ambientSynth.triggerAttackRelease([pitch, pitch+7], "1n", time); // long pad
        }, "2");
    }
}

function draw() {
    background(17);

    // Move nodes slowly, bounce off edges
    nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if(node.x<0 || node.x>width) node.vx*=-1;
        if(node.y<0 || node.y>height) node.vy*=-1;

        // Slight color evolution
        if(node.type==='instrument'){
            node.color = color(
                (red(node.color)+0.1)%255,
                (green(node.color)+0.1)%255,
                (blue(node.color)+0.1)%255
            );
        }

        fill(node.color);
        ellipse(node.x, node.y, node.size);
    });
}

// Interaction: drag nudges nodes, pinch/stretch adjusts tempo
function mouseDragged() {
    let dx = (mouseX - pmouseX) * 0.05;
    let dy = (mouseY - pmouseY) * 0.05;

    nodes.forEach(node=>{
        node.vx += dx;
        node.vy += dy;
        // Slight pitch shift
        node.pitchBase += dx*0.5;
        node.pitchBase = constrain(node.pitchBase, 48, 72);
    });
}

// Tap node: emphasize note
function mousePressed() {
    nodes.forEach(node=>{
        let d = dist(mouseX, mouseY, node.x, node.y);
        if(d<node.size/2){
            if(node.type==='instrument'){
                node.synth.triggerAttackRelease(Tone.Frequency(node.pitchBase,"midi"), "4n");
            } else if(node.type==='ambient'){
                ambientSynth.triggerAttackRelease([node.pitchBase,node.pitchBase+7],"1n");
            }
        }
    });
}

// Pinch gesture (multi-touch) adjusts tempo
function touchMoved(){
    if(touches.length===2){
        let dx = abs(touches[0].x - touches[1].x);
        let dy = abs(touches[0].y - touches[1].y);
        let dist = sqrt(dx*dx + dy*dy);
        tempo = map(dist, 50, width, 60, 140);
        Tone.Transport.bpm.value = constrain(tempo,60,140);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
