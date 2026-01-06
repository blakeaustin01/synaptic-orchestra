let melodySynth, chordSynth, bassSynth, percussionSynth, padSynth;
let reverb, delay, filter;

let melodyNotes = [], chordRoots = [], bassNotes = [], percussionPattern = [], padNotes = [];
let scale = ["C4","D4","E4","G4","A4"];
let tempo = 120;
let dragStart = null;

// --- MEMORY SYSTEM ---
let melodyHistory = [];
let chordHistory = [];
let bassHistory = [];
let percussionHistory = [];
const historyMax = 20; // number of past notes remembered

// --- SETUP ---
function setup() {
    createCanvas(windowWidth, windowHeight);

    // Effects
    reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).toDestination();
    delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.2, wet: 0.2 }).toDestination();
    filter = new Tone.Filter(1000, "lowpass").toDestination();

    // Synths
    melodySynth = new Tone.Synth({ oscillator:{type:"sine"}, envelope:{attack:0.05, release:0.3} }).connect(filter);
    chordSynth = new Tone.PolySynth(Tone.Synth, { oscillator:{type:"triangle"}, envelope:{attack:0.1, release:0.5} }).connect(reverb);
    bassSynth = new Tone.Synth({ oscillator:{type:"square"}, envelope:{attack:0.05, release:0.4} }).connect(filter);
    percussionSynth = new Tone.MembraneSynth({ pitchDecay:0.05, octaves:4, envelope:{attack:0.001, decay:0.2, sustain:0, release:0.2} }).toDestination();
    padSynth = new Tone.PolySynth(Tone.Synth, { oscillator:{type:"sawtooth"}, envelope:{attack:0.5, release:1.5} }).connect(reverb);

    // Initialize sequences
    for(let i=0;i<8;i++){
        melodyNotes.push(random(scale));
        chordRoots.push(random(scale));
        bassNotes.push(random(["C2","D2","E2","G2","A2"]));
        percussionPattern.push(random([0,1]));
        padNotes.push(random(scale.map(n=>Tone.Frequency(n).transpose(-12).toNote())));
    }

    Tone.Transport.bpm.value = tempo;
    Tone.Transport.start();

    scheduleMusic();
}

// --- MUSIC SCHEDULING ---
function scheduleMusic(){
    Tone.Transport.scheduleRepeat(playMelody,"4n");
    Tone.Transport.scheduleRepeat(playChords,"1n");
    Tone.Transport.scheduleRepeat(playBass,"2n");
    Tone.Transport.scheduleRepeat(playPercussion,"8n");
    Tone.Transport.scheduleRepeat(playPads,"2n");
}

// --- MEMORY-BASED SELECTION ---
function weightedChoice(arr, history){
    if(history.length === 0) return random(arr);
    let weighted = [];
    arr.forEach(n=>{
        let count = history.filter(h=>h===n).length + 1;
        for(let i=0;i<count;i++) weighted.push(n);
    });
    return random(weighted);
}

// --- PLAY FUNCTIONS ---
function playMelody(time){
    let note = weightedChoice(melodyNotes, melodyHistory);
    melodySynth.triggerAttackRelease(note,"8n",time);
    melodyHistory.push(note);
    if(melodyHistory.length>historyMax) melodyHistory.shift();
}

function playChords(time){
    let root = weightedChoice(chordRoots, chordHistory);
    chordSynth.triggerAttackRelease([root, Tone.Frequency(root).transpose(4), Tone.Frequency(root).transpose(7)], "1n", time);
    chordHistory.push(root);
    if(chordHistory.length>historyMax) chordHistory.shift();
}

function playBass(time){
    let note = weightedChoice(bassNotes, bassHistory);
    bassSynth.triggerAttackRelease(note,"4n",time);
    bassHistory.push(note);
    if(bassHistory.length>historyMax) bassHistory.shift();
}

function playPercussion(time){
    if(random()>0.4){
        percussionSynth.triggerAttackRelease("C2","8n",time);
        percussionHistory.push(1);
    } else {
        percussionHistory.push(0);
    }
    if(percussionHistory.length>historyMax) percussionHistory.shift();
}

function playPads(time){
    if(random()>0.5){
        let note = random(padNotes);
        padSynth.triggerAttackRelease([note, Tone.Frequency(note).transpose(4)], "2n", time);
    }
}

// --- USER INTERACTION ---
function mousePressed(){
    dragStart = {x:mouseX, y:mouseY};
    melodySynth.triggerAttackRelease(random(scale),"16n");
    percussionSynth.triggerAttackRelease("C2","16n");
}

function mouseDragged(){
    if(!dragStart) return;
    let dx = mouseX - dragStart.x;
    let dy = mouseY - dragStart.y;

    // Horizontal drag → transpose melody
    if(Math.abs(dx)>5){
        melodyNotes = melodyNotes.map(n=>Tone.Frequency(n).transpose(dx>0?1:-1).toNote());
        dragStart.x = mouseX;
    }

    // Vertical drag → tempo
    if(Math.abs(dy)>5){
        tempo += dy>0?-1:1;
        Tone.Transport.bpm.value = constrain(tempo,60,200);
        dragStart.y = mouseY;
    }

    // Horizontal drag also changes filter cutoff for dynamic sound
    filter.frequency.value = constrain(map(mouseX,0,width,200,2000),200,2000);
}

// --- VISUALS ---
function draw(){
    background(13,13,13,50);

    // Melody pulses
    noStroke();
    fill(255,100,150,80);
    for(let i=0;i<5;i++) ellipse(random(width), random(height/2), random(10,30));

    // Chord pulses
    fill(100,200,255,50);
    for(let i=0;i<3;i++) ellipse(random(width), random(height/2,height), random(20,50));

    // Pads
    fill(50,255,150,30);
    for(let i=0;i<2;i++) ellipse(random(width), random(height), random(50,100));
}

// --- START BUTTON ---
document.getElementById("startBtn").addEventListener("click", async ()=>{
    await Tone.start();
    document.getElementById("startScreen").style.display = "none";
});
