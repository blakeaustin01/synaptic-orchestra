let melodySynth, chordSynth, bassSynth, percussionSynth;
let melodyNotes = [];
let chordRoots = [];
let bassNotes = [];
let percussionPattern = [];
let scale = ["C4", "D4", "E4", "G4", "A4"];
let tempo = 120;
let dragStart = null;

function setup() {
    createCanvas(windowWidth, windowHeight);

    // Synth setup
    melodySynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.05, release: 0.3 }
    }).toDestination();

    chordSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.1, release: 0.5 }
    }).toDestination();

    bassSynth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.05, release: 0.4 }
    }).toDestination();

    percussionSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
    }).toDestination();

    // Initialize arrays
    for (let i = 0; i < 8; i++) {
        melodyNotes.push(random(scale));
        chordRoots.push(random(scale));
        bassNotes.push(random(["C2","D2","E2","G2","A2"]));
        percussionPattern.push(random([0,1])); // 0 = silent, 1 = hit
    }

    Tone.Transport.bpm.value = tempo;
    Tone.Transport.start();

    scheduleMusic();
}

// Schedule the repeating loops
function scheduleMusic() {
    Tone.Transport.scheduleRepeat(playMelody, "4n");
    Tone.Transport.scheduleRepeat(playChords, "1n");
    Tone.Transport.scheduleRepeat(playBass, "2n");
    Tone.Transport.scheduleRepeat(playPercussion, "8n");
}

function playMelody(time){
    let note = random(melodyNotes);
    melodySynth.triggerAttackRelease(note, "8n", time);
}

function playChords(time){
    let root = random(chordRoots);
    chordSynth.triggerAttackRelease([root, Tone.Frequency(root).transpose(4), Tone.Frequency(root).transpose(7)], "1n", time);
}

function playBass(time){
    let note = random(bassNotes);
    bassSynth.triggerAttackRelease(note, "4n", time);
}

function playPercussion(time){
    if (random() > 0.5) percussionSynth.triggerAttackRelease("C2", "8n", time);
}

// USER INTERACTIONS
function mousePressed() {
    dragStart = {x: mouseX, y: mouseY};
    // accent/percussion
    melodySynth.triggerAttackRelease(random(scale), "16n");
    percussionSynth.triggerAttackRelease("C2", "16n");
}

function mouseDragged() {
    if (!dragStart) return;

    let dx = mouseX - dragStart.x;
    let dy = mouseY - dragStart.y;

    // Horizontal drag -> transpose melody
    if (Math.abs(dx) > 5) {
        melodyNotes = melodyNotes.map(n => Tone.Frequency(n).transpose(dx > 0 ? 1 : -1).toNote());
        dragStart.x = mouseX;
    }

    // Vertical drag -> tempo
    if (Math.abs(dy) > 5) {
        tempo += dy > 0 ? -1 : 1;
        Tone.Transport.bpm.value = constrain(tempo, 60, 200);
        dragStart.y = mouseY;
    }
}

// VISUALS
function draw() {
    background(17, 17, 17, 50);

    noStroke();
    fill(255, 100, 150, 100);
    ellipse(random(width), random(height), random(5,20));
}

document.getElementById("startBtn").addEventListener("click", async () => {
    await Tone.start();
    document.getElementById("startScreen").style.display = "none";
});
