// 🎼 Ultimate Generative AI Orchestra
let melodySynth, chordSynth, bassSynth, padSynth, percSynth;
let melodyPattern = [], chordPattern = [], bassPattern = [], percPattern = [];
let scale = [0,2,4,5,7,9,11]; // C major
let rootMidi = 60;
let bpm = 90;

function setup(){
    createCanvas(windowWidth, windowHeight);
    noStroke();

    Tone.start(); // user gesture required

    // === Synth Layers ===
    melodySynth = new Tone.Synth({oscillator:{type:'triangle'},envelope:{attack:0.05,release:0.3}}).toDestination();
    chordSynth = new Tone.PolySynth(Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:0.2,release:1}}).toDestination();
    bassSynth = new Tone.MonoSynth({oscillator:{type:'square'},filter:{Q:2,type:'lowpass',rolloff:-24},envelope:{attack:0.01,decay:0.3,sustain:0.8,release:0.5}}).toDestination();
    padSynth = new Tone.PolySynth(Tone.Synth,{oscillator:{type:'sawtooth'},envelope:{attack:2,release:4}}).toDestination();
    percSynth = new Tone.MembraneSynth({pitchDecay:0.05,octaves:4,envelope:{attack:0.001,decay:0.2,sustain:0,release:0.1}}).toDestination();

    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();

    // === Generate Patterns ===
    generateMelody();
    generateChords();
    generateBass();
    generatePercussion();

    // === Schedule Patterns ===
    scheduleMelody();
    scheduleChords();
    scheduleBass();
    schedulePads();
    schedulePercussion();
}

// --- Pattern Generators ---
function generateMelody(){
    for(let i=0;i<32;i++){
        let note = rootMidi + scale[floor(random(scale.length))] + floor(random(-1,2))*12;
        melodyPattern.push(note);
    }
}

function generateChords(){
    for(let i=0;i<16;i++){
        let root = rootMidi + scale[floor(random(scale.length))];
        chordPattern.push([root,root+4,root+7]);
    }
}

function generateBass(){
    for(let i=0;i<16;i++){
        bassPattern.push(rootMidi - 12 + scale[floor(random(3))]);
    }
}

function generatePercussion(){
    for(let i=0;i<16;i++){
        percPattern.push(random() < 0.3); // probability for a hit
    }
}

// --- Scheduling Functions ---
function scheduleMelody(){
    let idx = 0;
    Tone.Transport.scheduleRepeat(time=>{
        melodySynth.triggerAttackRelease(melodyPattern[idx],'8n',time);
        idx = (idx+1)%melodyPattern.length;
    },'8n');
}

function scheduleChords(){
    let idx = 0;
    Tone.Transport.scheduleRepeat(time=>{
        chordSynth.triggerAttackRelease(chordPattern[idx],'1n',time);
        idx = (idx+1)%chordPattern.length;
    },'1n');
}

function scheduleBass(){
    let idx = 0;
    Tone.Transport.scheduleRepeat(time=>{
        bassSynth.triggerAttackRelease(bassPattern[idx],'2n',time);
        idx = (idx+1)%bassPattern.length;
    },'2n');
}

function schedulePads(){
    let idx = 0;
    Tone.Transport.scheduleRepeat(time=>{
        let root = rootMidi + scale[floor(random(scale.length))];
        padSynth.triggerAttackRelease([root,root+7,root+12],'4n',time);
    },'4n');
}

function schedulePercussion(){
    let idx = 0;
    Tone.Transport.scheduleRepeat(time=>{
        if(percPattern[idx]){
            percSynth.triggerAttackRelease('C2','16n',time);
        }
        idx = (idx+1)%percPattern.length;
    },'16n');
}

// --- User Interaction ---
// Click or drag to subtly shift melodies and chords
function mouseDragged(){
    let delta = (mouseX-pmouseX)*0.05;
    melodyPattern = melodyPattern.map(n=>n + floor(delta));
    chordPattern = chordPattern.map(chord=>chord.map(n=>n + floor(delta/2)));
}

function mousePressed(){
    // Accent hit: short notes in melody or percussion
    melodySynth.triggerAttackRelease(rootMidi + scale[floor(random(scale.length))],'8n');
    percSynth.triggerAttackRelease('C2','8n');
}

// --- Optional visual feedback ---
function draw(){
    background(17);
    fill(100,200,255,50);
    ellipse(width/2,height/2,300,300);
}
