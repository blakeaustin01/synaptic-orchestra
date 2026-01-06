// --- SYNTHS & EFFECTS (Ambient Breathing Version) ---
let melodySynth, chordSynth, bassSynth, percussionSynth, padSynth;
let reverb, delay, filter;
let padVolume = 0.3;

// --- MICRO-MODULATION VARIABLES ---
let melodyDetunePhase = 0;
let padDetunePhase = 0;
let padFilterPhase = 0;

// --- MUSIC DATA ---
let melodyNotes=[], chordRoots=[], bassNotes=[], percussionPattern=[], padNotes=[];
let scaleModes = [
    ["C4","D4","E4","G4","A4"],
    ["C4","D4","Eb4","G4","A4"],
    ["C4","D4","E4","F4","G4","A4","B4"],
    ["C4","D4","Eb4","F4","G4","Ab4","Bb4"]
];
let currentScale = scaleModes[0];
let tempo = 120;
let dragStart = null;

// --- MEMORY SYSTEM ---
let melodyHistory=[], chordHistory=[], bassHistory=[], percussionHistory=[];
const historyMax = 25; 

// --- LOAD MEMORY ---
if(localStorage.getItem("melodyHistory")) melodyHistory = JSON.parse(localStorage.getItem("melodyHistory"));
if(localStorage.getItem("chordHistory")) chordHistory = JSON.parse(localStorage.getItem("chordHistory"));
if(localStorage.getItem("bassHistory")) bassHistory = JSON.parse(localStorage.getItem("bassHistory"));
if(localStorage.getItem("percussionHistory")) percussionHistory = JSON.parse(localStorage.getItem("percussionHistory"));

// --- SETUP ---
function setup(){
    createCanvas(windowWidth, windowHeight);

    // Effects
    reverb = new Tone.Reverb({decay:6, wet:0.4}).toDestination();
    delay = new Tone.FeedbackDelay({delayTime:"8n", feedback:0.2, wet:0.2}).toDestination();
    filter = new Tone.Filter(1200,"lowpass").toDestination();

    // --- Ambient Synths ---
    melodySynth = new Tone.Synth({
        oscillator:{type:"triangle"},
        envelope:{attack:0.1, decay:0.1, sustain:0.5, release:0.6}
    }).connect(filter);

    chordSynth = new Tone.PolySynth(Tone.Synth,{
        oscillator:{type:"triangle"},
        envelope:{attack:0.2, decay:0.2, sustain:0.5, release:1.0}
    }).connect(reverb);

    bassSynth = new Tone.Synth({
        oscillator:{type:"sine"},
        envelope:{attack:0.2, decay:0.2, sustain:0.4, release:0.8}
    }).connect(filter);

    percussionSynth = new Tone.MembraneSynth({
        pitchDecay:0.05, octaves:3,
        envelope:{attack:0.01, decay:0.15, sustain:0, release:0.1}
    }).toDestination();

    padSynth = new Tone.PolySynth(Tone.Synth,{
        oscillator:{type:"fatsine", count:2, spread:10},
        envelope:{attack:0.5, decay:0.3, sustain:0.4, release:1.2}
    }).connect(reverb);

    // Initialize sequences
    for(let i=0;i<8;i++){
        melodyNotes.push(random(currentScale));
        chordRoots.push(random(currentScale));
        bassNotes.push(random(["C2","D2","E2","G2","A2"]));
        percussionPattern.push(random([0,1]));
        padNotes.push(random(currentScale.map(n=>Tone.Frequency(n).transpose(-12).toNote())));
    }

    Tone.Transport.bpm.value = tempo;
    Tone.Transport.start();

    scheduleMusic();

    setInterval(()=>{currentScale = random(scaleModes)}, 30000);

    // --- MODULATION LOOP ---
    new Tone.Loop(time=>{
        // slow breathing modulation
        melodyDetunePhase += 0.002;
        padDetunePhase += 0.0015;
        padFilterPhase += 0.001;

        melodySynth.detune.value = Math.sin(melodyDetunePhase * Math.PI*2) * 10; // ±10 cents
        padSynth.detune.value = Math.sin(padDetunePhase * Math.PI*2) * 2; // ±2 semitones
        filter.frequency.value = 1200 + Math.sin(padFilterPhase * Math.PI*2)*300;
    }, "16n").start(0);
}

// --- MUSIC SCHEDULING ---
function scheduleMusic(){
    Tone.Transport.scheduleRepeat(playMelody,"4n");
    Tone.Transport.scheduleRepeat(playChords,"1n");
    Tone.Transport.scheduleRepeat(playBass,"2n");
    Tone.Transport.scheduleRepeat(playPercussion,"8n");
    Tone.Transport.scheduleRepeat(playPads,"2n");
}

// --- MEMORY-WEIGHTED SELECTION ---
function weightedChoice(arr, history){
    if(history.length===0) return random(arr);
    let weighted=[];
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
    melodyHistory.push(note); if(melodyHistory.length>historyMax) melodyHistory.shift();
}

function playChords(time){
    let root = weightedChoice(chordRoots, chordHistory);
    chordSynth.triggerAttackRelease([root, Tone.Frequency(root).transpose(4), Tone.Frequency(root).transpose(7)], "1n", time);
    chordHistory.push(root); if(chordHistory.length>historyMax) chordHistory.shift();
}

function playBass(time){
    let note = weightedChoice(bassNotes, bassHistory);
    bassSynth.triggerAttackRelease(note,"4n",time);
    bassHistory.push(note); if(bassHistory.length>historyMax) bassHistory.shift();
}

function playPercussion(time){
    if(random()>0.5){ percussionSynth.triggerAttackRelease("C2","8n",time); percussionHistory.push(1); }
    else percussionHistory.push(0);
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
    melodySynth.triggerAttackRelease(random(currentScale),"16n");
    percussionSynth.triggerAttackRelease("C2","16n");
}

function mouseDragged(){
    if(!dragStart) return;
    let dx = mouseX - dragStart.x;
    let dy = mouseY - dragStart.y;

    if(Math.abs(dx)>5){
        melodyNotes = melodyNotes.map(n=>Tone.Frequency(n).transpose(dx>0?1:-1).toNote());
        dragStart.x = mouseX;
    }

    if(Math.abs(dy)>5){
        tempo += dy>0?-1:1;
        Tone.Transport.bpm.value = constrain(tempo,60,180);
        dragStart.y = mouseY;
    }

    padVolume = constrain(map(mouseX,0,width,0.1,0.5),0.1,0.5);
    padSynth.volume.value = Tone.gainToDb(padVolume);
}

// --- VISUALS ---
function draw(){
    background(13,13,13,50);
    noStroke();
    fill(255,100,150,80); for(let i=0;i<5;i++) ellipse(random(width), random(height/2), random(10,30));
    fill(100,200,255,50); for(let i=0;i<3;i++) ellipse(random(width), random(height/2,height), random(20,50));
    fill(50,255,150,30); for(let i=0;i<2;i++) ellipse(random(width), random(height), random(50,100));
}

// --- START BUTTON ---
document.getElementById("startBtn").addEventListener("click", async ()=>{
    await Tone.start();
    document.getElementById("startScreen").style.display = "none";
});

// --- SAVE MEMORY ---
setInterval(()=>{
    localStorage.setItem("melodyHistory", JSON.stringify(melodyHistory));
    localStorage.setItem("chordHistory", JSON.stringify(chordHistory));
    localStorage.setItem("bassHistory", JSON.stringify(bassHistory));
    localStorage.setItem("percussionHistory", JSON.stringify(percussionHistory));
},5000);

