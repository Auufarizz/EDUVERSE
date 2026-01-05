const daftarKuis = [
    { text: "Berita: Minum air garam bisa mendeteksi virus secara instan.", jawaban: "hoax", info: "Hanya tes medis resmi yang bisa mendeteksi virus." },
    { text: "Berita: Domain .go.id adalah milik situs resmi pemerintah.", jawaban: "fakta", info: "Benar! Selalu cek domain ini untuk info resmi." }
];

let kuisIndex = 0, player, gate, keys, sedangKuis = false;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    pixelArt: true,
    physics: { default: 'arcade' },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('bg-game', 'lobby-forest.jpg');
    this.load.image('hero', 'player cowo.png');
    this.load.image('gate', 'question box.png');
}

function create() {
    // BG DI DALAM GAME
    let bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'bg-game');
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height).setDepth(-1);

    // Player (Ukuran Dikecilkan)
    player = this.physics.add.sprite(100, 100, 'hero').setScale(0.1);
    player.setCollideWorldBounds(true).setDepth(10);

    // Pagar
    gate = this.physics.add.staticGroup();
    gate.create(500, 300, 'gate').setScale(0.15).refreshBody();

    this.physics.add.collider(player, gate, () => {
        if (!sedangKuis) window.bukaKuis();
    });

    keys = this.input.keyboard.addKeys({
        up: 'W', down: 'S', left: 'A', right: 'D',
        upA: 'UP', downA: 'DOWN', leftA: 'LEFT', rightA: 'RIGHT',
        space: 'SPACE'
    });

    setupMobileControls();
}

function update() {
    if (!player || sedangKuis) { if(player) player.setVelocity(0); return; }
    const speed = 250;
    player.setVelocity(0);
    if (keys.left.isDown || keys.leftA.isDown) player.setVelocityX(-speed);
    else if (keys.right.isDown || keys.rightA.isDown) player.setVelocityX(speed);
    if (keys.up.isDown || keys.upA.isDown) player.setVelocityY(-speed);
    else if (keys.down.isDown || keys.downA.isDown) player.setVelocityY(speed);
    if (Phaser.Input.Keyboard.JustDown(keys.space)) window.loncatVisual();
}

window.mulaiGame = function() { document.getElementById('lobby-screen').classList.add('hidden'); }

window.bukaKuis = function() {
    if (kuisIndex >= daftarKuis.length) { alert("Hutan Bersih dari Hoax!"); return; }
    sedangKuis = true;
    document.getElementById('q-text').innerText = daftarKuis[kuisIndex].text;
    document.getElementById('quiz-modal').classList.remove('hidden');
}

window.jawab = function(p) {
    const s = daftarKuis[kuisIndex];
    document.getElementById('feedback-text').innerHTML = (p === s.jawaban) ? "✅ BENAR!" : "❌ SALAH!";
    document.getElementById('feedback').classList.remove('hidden');
}

window.lanjutJalan = function() {
    document.getElementById('quiz-modal').classList.add('hidden');
    document.getElementById('feedback').classList.add('hidden');
    gate.clear(true, true); kuisIndex++; sedangKuis = false;
}

window.loncatVisual = function() {
    game.scene.scenes[0].tweens.add({ targets: player, scaleX: player.scaleX*1.5, scaleY: player.scaleY*1.5, yoyo: true, duration: 200 });
}

function setupMobileControls() {
    ['up','down','left','right'].forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.onpointerdown = () => { if(!sedangKuis) { 
                if(id==='up') player.setVelocityY(-250); if(id==='down') player.setVelocityY(250);
                if(id==='left') player.setVelocityX(-250); if(id==='right') player.setVelocityX(250);
            }};
            btn.onpointerup = () => player.setVelocity(0);
        }
    });

}
