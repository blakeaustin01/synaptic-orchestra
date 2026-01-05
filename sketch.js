let nodes = [];
let ambientSynth;
let scale = [0,2,4,5,7,9,11]; // C major
let tempo = 80; 
let clusters = []; // clusters for layered chords
let recordMode = false;
let recorder, recordingBuffer;

// Initialize instruments
let instruments = ['sine', 'triangle', 'square', 'sawtooth'];

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('z-index','-1'); 
    noStroke();

    // Create nodes (6 instruments + 2 ambient + 2 glitch)
    for(let i=0;i<6;i++) nodes.push(createNode('instrument'));
    for(let i=0;i<2;i++) nodes.push(createNode('ambient'));
    for(let i=0;i<2;i++) nodes.push(createNode('glitch'));

    ambientSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack:1, release:2 }
    }).toDestination();

    Tone.Transport.bpm.value = tempo;
    Tone.Transport.start();

    // Schedule notes for all nodes
    nodes.forEach(scheduleNode);

    // Setup basic recorder
    recorder = new Tone.Recorder();
    Tone.Destination.connect(recorder);
}

function createNode(type){
    let node = {
        x: random(width*0.2,width*0.8),
        y: random(height*0.3,height*0.7),
        vx: random(-0.2,0.2),
        vy: random(-0.2,0.2),
        size: type==='ambient'?60:50,
        color: color(random(100,255),random(100,255),random(100,255)),
        pitchBase: 60 + floor(random(-3,3)),
        type: type,
        synth: type==='instrument'?new Tone.Synth({
            oscillator:{ type: random(instruments)},
            envelope:{attack:0.1, decay:0.2, sustain:0.5, release:0.5}
        }).toDestination():null
    };
    return node;
}

function scheduleNode(node){
    if(node.type==='instrument'){
        Tone.Transport.scheduleRepeat((time)=>{
            let pitch = node.pitchBase + scale[floor(random(scale.length))];
            node.synth.triggerAttackRelease(Tone.Frequency(pitch,"midi"),"8n",time);
        },"0.5");
    } else if(node.type==='ambient'){
        Tone.Transport.scheduleRepeat((time)=>{
            let pitch = node.pitchBase + scale[floor(random(scale.length))];
            ambientSynth.triggerAttackRelease([pitch,pitch+7],"1n",time);
        },"2");
    } else if(node.type==='glitch'){
        Tone.Transport.scheduleRepeat((time)=>{
            let pitch = node.pitchBase + floor(random(-12,12));
            node.synth = new Tone.Synth({oscillator:{type:'square'},envelope:{attack:0.01,release:0.2}}).toDestination();
            node.synth.triggerAttackRelease(Tone.Frequency(pitch,"midi"),"16n",time);
        },"1");
    }
}

// Draw nodes and clusters
function draw(){
    background(17);

    // Move nodes
    nodes.forEach(node=>{
        node.x += node.vx;
        node.y += node.vy;
        if(node.x<0 || node.x>width) node.vx*=-1;
        if(node.y<0 || node.y>height) node.vy*=-1;

        // Color evolution
        if(node.type==='instrument') node.color = color((red(node.color)+0.1)%255,(green(node.color)+0.1)%255,(blue(node.color)+0.1)%255);

        fill(node.color);
        ellipse(node.x,node.y,node.size);
    });

    detectClusters();
}

// Cluster detection for layered chords
function detectClusters(){
    clusters = [];
    for(let i=0;i<nodes.length;i++){
        let node = nodes[i];
        let cluster = [node];
        for(let j=0;j<nodes.length;j++){
            if(i===j) continue;
            let other = nodes[j];
            let d = dist(node.x,node.y,other.x,other.y);
            if(d<80) cluster.push(other);
        }
        if(cluster.length>1) clusters.push(cluster);
    }

    // Play layered chords for each cluster
    clusters.forEach(cluster=>{
        let pitches = cluster.map(n=>n.pitchBase + scale[floor(random(scale.length))]);
        if(cluster[0].type==='instrument') ambientSynth.triggerAttackRelease(pitches,"8n");
    });
}

// Interaction: drag nudges nodes & modulates pitch slightly
function mouseDragged(){
    let dx = (mouseX-pmouseX)*0.05;
    let dy = (mouseY-pmouseY)*0.05;
    nodes.forEach(node=>{
        node.vx += dx;
        node.vy += dy;
        node.pitchBase += dx*0.5;
        node.pitchBase = constrain(node.pitchBase,48,72);
    });
}

// Tap node: emphasize note
function mousePressed(){
    nodes.forEach(node=>{
        let d = dist(mouseX,mouseY,node.x,node.y);
        if(d<node.size/2){
            if(node.type==='instrument') node.synth.triggerAttackRelease(Tone.Frequency(node.pitchBase,"midi"),"4n");
            else if(node.type==='ambient') ambientSynth.triggerAttackRelease([node.pitchBase,node.pitchBase+7],"1n");
            else if(node.type==='glitch') node.synth.triggerAttackRelease(Tone.Frequency(node.pitchBase,"midi"),"16n");
        }
    });
}

// Swipe vertically → change scale key
function touchMoved(){
    if(touches.length===1){
        let dy = touches[0].y - pmouseY;
        if(abs(dy)>10){
            scale = scale.map(s=>s+ (dy>0?1:-1)); // shift scale
            scale = scale.map(s=>s%12);
        }
    }

    // Two-finger pinch → adjust tempo
    if(touches.length===2){
        let dx = abs(touches[0].x-touches[1].x);
        let dy = abs(touches[0].y-touches[1].y);
        let dist = sqrt(dx*dx + dy*dy);
        tempo = map(dist,50,width,60,140);
        Tone.Transport.bpm.value = constrain(tempo,60,140);
    }
}

// Window resize
function windowResized(){ resizeCanvas(windowWidth,windowHeight); }

// Recording
function keyPressed(){
    if(key==='r'){ // start/stop recording
        if(!recordMode){
            recorder.start();
            recordMode=true;
            console.log("Recording started");
        } else {
            recorder.stop().then(function(recorded){
                const url = URL.createObjectURL(recorded);
                let a = document.createElement('a');
                a.href = url;
                a.download = 'orchestra_loop.webm';
                a.click();
            });
            recordMode=false;
            console.log("Recording stopped");
        }
    }
}
