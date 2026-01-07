const TILE_SIZE = 80;
const SPEED = 250;
let namaUser = localStorage.getItem('hoax_name') || "Player";
let currentLevel = 1;
let skor = 0;
let sedangKuis = false;
let avatarIndex = 0; 
let joystickData = null;
let targetGate = null;
let player, walls, gates, playerText, bg, keys;

const levelData = {
    1: { map: [[1,1,1,1,1,1,1,1,1],[0,0,0,2,0,0,0,2,1],[1,1,1,1,1,1,1,0,1],[1,1,1,1,1,1,1,1,1]] },
    2: { map: [[1,1,1,1,1,1,1,1,1],[0,2,0,0,1,0,0,2,1],[1,1,1,0,1,0,1,1,1],[1,2,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1]] },
    3: { map: [[1,1,1,1,1,1,1,1,1],[0,0,2,0,1,2,0,0,1],[1,0,1,0,1,1,1,0,1],[1,2,1,0,0,0,2,0,1],[1,1,1,1,1,1,1,1,1]] },
    4: { map: [[1,1,1,1,1,1,1,1,1,1,1],[0,0,1,2,0,0,1,0,2,0,1],[1,0,1,1,1,0,1,0,1,0,1],[1,2,0,0,0,0,2,0,0,0,1],[1,1,1,1,1,1,1,1,1,1,1]] },
    5: { map: [[1,1,1,1,1,1,1,1,1,1,1],[0,2,1,0,0,2,0,0,1,2,1],[1,0,1,0,1,1,1,0,1,0,1],[1,2,0,0,2,0,2,0,0,2,1],[1,1,1,1,1,1,1,1,1,1,1]] }
};

const poolKuis = [
    { text: "Berita hoaks biasanya memakai judul provokatif.", jawaban: "fakta" },
    { text: "Situs pemerintah Indonesia berakhiran .go.id", jawaban: "fakta" },
    { text: "Memasukkan HP ke microwave bisa mengisi baterai.", jawaban: "hoax" },
    { text: "Air garam bisa menyembuhkan virus corona.", jawaban: "hoax" },
    { text: "Phising adalah pencurian data melalui link palsu.", jawaban: "fakta" }
];

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade' },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('bg-game', 'background rumput.jpg'); 
    this.load.image('wall', 'Wall maze.png');
    this.load.image('gate', 'question box.png'); 
    this.load.spritesheet('hero0', 'player cowo.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('hero1', 'player cewe.png', { frameWidth: 32, frameHeight: 32 });
}

function create() {
    // SYSTEM: INFINITE BACKGROUND
    bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg-game').setOrigin(0, 0).setScrollFactor(0); 
    
    walls = this.physics.add.staticGroup();
    gates = this.physics.add.staticGroup();
    player = this.physics.add.sprite(140, 140, 'hero0').setScale(1.5).setDepth(10);
    playerText = this.add.text(player.x, player.y - 45, namaUser, { 
        fontSize: '14px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 
    }).setOrigin(0.5).setDepth(100);

    createHeroAnims(this, 0); createHeroAnims(this, 1);
    this.cameras.main.startFollow(player, true, 0.1, 0.1).setZoom(2.5);
    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, gates, (p, g) => { if (!sedangKuis) { targetGate = g; bukaKuis(); } });
    
    keys = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });

    // FIX WASD
    const nameInput = document.getElementById('input-nama');
    nameInput.addEventListener('focus', () => { this.input.keyboard.enabled = false; });
    nameInput.addEventListener('blur', () => { this.input.keyboard.enabled = true; });

    setupJoystick();
    buatLabirin(currentLevel);
}

function update() {
    // SYSTEM: INFINITE BACKGROUND FOLLOW CAMERA
    bg.tilePositionX = this.cameras.main.scrollX;
    bg.tilePositionY = this.cameras.main.scrollY;

    if (sedangKuis || !this.input.keyboard.enabled) { 
        player.setVelocity(0); player.anims.stop(); return; 
    }

    let vx = 0, vy = 0;
    if (keys.left.isDown) vx = -SPEED; else if (keys.right.isDown) vx = SPEED;
    if (keys.up.isDown) vy = -SPEED; else if (keys.down.isDown) vy = SPEED;
    
    if (joystickData && joystickData.distance > 0) {
        vx = Math.cos(joystickData.angle.radian) * SPEED; vy = -Math.sin(joystickData.angle.radian) * SPEED;
    }

    player.setVelocity(vx, vy);
    let p = "h" + avatarIndex + "_";
    if (vx < 0) player.play(p+'left', true); else if (vx > 0) player.play(p+'right', true);
    else if (vy < 0) player.play(p+'up', true); else if (vy > 0) player.play(p+'down', true);
    else player.anims.stop();
    playerText.setPosition(player.x, player.y - 45);
}

function createHeroAnims(scene, idx) {
    let k = 'hero' + idx, p = 'h' + idx + '_';
    scene.anims.create({ key: p+'down', frames: scene.anims.generateFrameNumbers(k, { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
    scene.anims.create({ key: p+'left', frames: scene.anims.generateFrameNumbers(k, { start: 3, end: 5 }), frameRate: 10, repeat: -1 });
    scene.anims.create({ key: p+'right', frames: scene.anims.generateFrameNumbers(k, { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
    scene.anims.create({ key: p+'up', frames: scene.anims.generateFrameNumbers(k, { start: 9, end: 11 }), frameRate: 10, repeat: -1 });
}

function buatLabirin(lvl) {
    walls.clear(true, true); gates.clear(true, true);
    levelData[lvl].map.forEach((row, y) => {
        row.forEach((tile, x) => {
            let px = x * TILE_SIZE + 60, py = y * TILE_SIZE + 60;
            if (tile === 1) walls.create(px, py, 'wall').setScale(0.136).refreshBody();
            else if (tile === 2) gates.create(px, py, 'gate').setScale(0.15).refreshBody();
        });
    });
    player.setPosition(140, 140);
}

window.mulaiGame = () => {
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('top-nav-right').classList.remove('hidden');
    document.getElementById('ui-container-left').classList.remove('hidden');
};

// PORTAL LITERASI
window.bukaLiterasi = () => { document.getElementById('literasi-modal').classList.remove('hidden'); };
window.tutupLiterasi = () => { document.getElementById('literasi-modal').classList.add('hidden'); };
window.showWiki = (id) => {
    document.querySelectorAll('.wiki-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.wiki-menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById('content-' + id).classList.add('active');
    document.getElementById('menu-' + id).classList.add('active');
};

function bukaKuis() {
    sedangKuis = true;
    let k = poolKuis[Math.floor(Math.random() * poolKuis.length)];
    document.getElementById('q-text').innerText = k.text;
    document.getElementById('q-text').dataset.answer = k.jawaban;
    document.getElementById('quiz-options').classList.remove('hidden');
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('quiz-modal').classList.remove('hidden');
}

window.jawab = (p) => {
    const bnr = document.getElementById('q-text').dataset.answer;
    if (p === bnr) { skor += 20; document.getElementById('feedback-text').innerText = "BENAR! +20"; }
    else { document.getElementById('feedback-text').innerText = "SALAH!"; }
    document.getElementById('score-display').innerText = skor;
    document.getElementById('quiz-options').classList.add('hidden');
    document.getElementById('feedback').classList.remove('hidden');
};

window.tutupKuis = () => { document.getElementById('quiz-modal').classList.add('hidden'); if(targetGate) targetGate.destroy(); sedangKuis = false; };

window.bukaPeringkat = () => {
    const listDiv = document.getElementById('rank-list');
    const data = JSON.parse(localStorage.getItem('hoax_ranks')) || [];
    listDiv.innerHTML = data.length === 0 ? "<p>Belum ada data</p>" : data.map((x, i) => `
        <div class="rank-item">
            <b>#${i+1}</b>
            <img src="player ${x.avatar === 1 ? 'cewe' : 'cowo'}.png" style="width:30px; height:30px; margin-right:10px;">
            <div class="name">${x.name.toUpperCase()}</div>
            <div class="pts">⭐ ${x.score}</div>
        </div>
    `).join('');
    document.getElementById('leaderboard-modal').classList.remove('hidden');
};

window.tutupPeringkat = () => document.getElementById('leaderboard-modal').classList.add('hidden');
window.bukaEditProfil = () => document.getElementById('profile-modal').classList.remove('hidden');
window.tutupEditProfil = () => document.getElementById('profile-modal').classList.add('hidden');

window.pilihAvatar = (idx, el) => {
    avatarIndex = idx;
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
};

window.simpanProfil = () => {
    namaUser = document.getElementById('input-nama').value || "Player";
    localStorage.setItem('hoax_name', namaUser);
    playerText.setText(namaUser);
    player.setTexture('hero' + avatarIndex);
    tutupEditProfil();
};

window.pilihLevelManual = (v) => { currentLevel = parseInt(v); buatLabirin(currentLevel); sedangKuis = false; };

function setupJoystick() {
    const manager = nipplejs.create({ zone: document.getElementById('joystick-container'), mode: 'static', position: { left: '75px', bottom: '75px' }, size: 100 });
    manager.on('move', (e, data) => { joystickData = data; });
    manager.on('end', () => { joystickData = null; });
}