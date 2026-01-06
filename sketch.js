let melodySynth, chordSynth, bassSynth, percSynth;
let melodyNotes = [];
let chordRoots = [];
let scale = [0,2,4,5,7,9,11]; // C major
let rootMidi = 60;             // C4
let bpm = 90;

let playing = false;

function setup(){
    createCanvas(windowWidth, windowHeight);
    noLoop();

    document.getElementById("startBtn").addEventListener("click", async ()=>{
        await Tone.start();
        startOrchestra();
    });
}

function startOrchestra(){
    document.getElementById("startUI").style.display = "none";
    loop();
    playing = true;

    // Synth Layers
    melodySynth = new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.05,release:0.25}}).toDestination();
    chordSynth = new Tone.PolySynth(Tone.Synth,{oscillator:{type:"sine"},envelope:{attack:0.2,release:1}}).toDestination();
    bassSynth = new Tone.MonoSynth({oscillator:{type:"square"},envelope:{attack:0.01,release:0.3}}).toDestination();
    percSynth = new Tone.MembraneSynth({pitchDecay:0.05,octaves:3,envelope:{attack:0.001,decay:0.2,release:0.2}}).toDestination();

    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();

    // Generate Patterns
    generateMelody();
    generateChords();

    // Schedule Loops
    scheduleMelody();
    scheduleBass();
    scheduleChords();
    schedulePercussion();
}

// === Pattern Generators ===
function generateMelody(){
    melodyNotes = [];
    for(let i=0;i<32;i++){
        let step = scale[floor(random(scale.length))];
        let octave = floor(random(0,2))*12;
        melodyNotes.push(rootMidi + step + octave);
    }
}

function generateChords(){
    chordRoots = [];
    for(let i=0;i<16;i++){
        chordRoots.push(rootMidi + scale[floor(random(scale.length))]);
    }
}

// === Scheduling Loops ===
function scheduleMelody(){
    let idx=0;
    Tone.Transport.scheduleRepeat(time=>{
        melodySynth.triggerAttackRelease(melodyNotes[idx],"8n",time);
        idx = (idx+1) % melodyNotes.length;
    },"8n");
}

function scheduleBass(){
    Tone.Transport.scheduleRepeat(time=>{
        let bassNote = rootMidi-12 + scale[floor(random(3))];
        bassSynth.triggerAttackRelease(bassNote,"2n",time);
    },"2n");
}

function scheduleChords(){
    let idx=0;
    Tone.Transport.scheduleRepeat(time=>{
        let root = chordRoots[idx];
        chordSynth.triggerAttackRelease([root, root+4, root+7],"1n",time);
        idx = (idx+1) % chordRoots.length;
    },"1n");
}

function schedulePercussion(){
    Tone.Transport.scheduleRepeat(time=>{
        if(random()<0.35) percSynth.triggerAttackRelease("C2","16n",time);
    },"8n");
}

// === Interaction ===
function mouseDragged(){
    if(!playing) return;
    let dx = mouseX-pmouseX;
    let dy = mouseY-pmouseY;

    // Horizontal drag shifts melody
    if(abs(dx) > abs(dy)){
        let shift = dx>0 ? 1 : -1;
        melodyNotes = melodyNotes.map(n=>n+shift);
    }
    // Vertical drag changes tempo
    else{
        bpm = constrain(bpm + dy*0.2, 60, 160);
        Tone.Transport.bpm.value = bpm;
    }
}

function mousePressed(){
    if(!playing) return;
    // Accent hit
    melodySynth.triggerAttackRelease(rootMidi+scale[floor(random(scale.length))],"8n");
    percSynth.triggerAttackRelease("C2","8n");
}

// === Minimal visuals ===
function draw(){
    if(!playing) return;
    background(17);
    fill(100,200,255,50);
    ellipse(width/2, height/2, 150+sin(frameCount*0.05)*50, 150+sin(frameCount*0.05)*50);
}
