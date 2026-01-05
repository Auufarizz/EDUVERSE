const daftarKuis = [
    { text: "Berita: Minum kopi 10 gelas sehari bisa mencegah flu.", jawaban: "hoax" },
    { text: "Berita: Domain .go.id hanya digunakan oleh situs instansi pemerintah.", jawaban: "fakta" }
];

let kuisIndex = 0, player, gate, keys, sedangKuis = false;
let joystickActive = false; 
let sedangLompat = false; 
const UKURAN_NORMAL = 0.3; 

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
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
    let bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'bg-game');
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height).setDepth(-1);

    player = this.physics.add.sprite(100, 100, 'hero').setScale(0.1);
    player.setCollideWorldBounds(true).setDepth(10);

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

    setupVirtualJoystick();
}

function update() {
    if (!player || sedangKuis) { 
        if(player) player.setVelocity(0); 
        return; 
    }

    const speed = 250;

    // KONTROL KEYBOARD (Hanya jalan kalau joystick dilepas)
    if (!joystickActive) {
        let vx = 0;
        let vy = 0;

        if (keys.left.isDown || keys.leftA.isDown) vx = -speed;
        else if (keys.right.isDown || keys.rightA.isDown) vx = speed;

        if (keys.up.isDown || keys.upA.isDown) vy = -speed;
        else if (keys.down.isDown || keys.downA.isDown) vy = speed;

        player.setVelocity(vx, vy);
    }

    // Input Lompat Spasi
    if (Phaser.Input.Keyboard.JustDown(keys.space)) {
        window.loncatVisual();
    }
}

function setupVirtualJoystick() {
    const options = {
        zone: document.getElementById('joystick-container'),
        mode: 'static',
        position: { left: '75px', bottom: '75px' },
        color: 'white',
        size: 100
    };

    const manager = nipplejs.create(options);

    manager.on('start', () => { joystickActive = true; });

    manager.on('move', (evt, data) => {
        if (sedangKuis) return;
        const speed = 250;
        const force = data.force;
        const angle = data.angle.radian;
        player.setVelocityX(Math.cos(angle) * speed * Math.min(force, 1));
        player.setVelocityY(-Math.sin(angle) * speed * Math.min(force, 1));
    });

    manager.on('end', () => { 
        joystickActive = false;
        player.setVelocity(0); 
    });
}

window.mulaiGame = function() { document.getElementById('lobby-screen').classList.add('hidden'); }

window.bukaKuis = function() {
    if (kuisIndex >= daftarKuis.length) { alert("Game Selesai!"); return; }
    sedangKuis = true;
    player.setVelocity(0);
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
    gate.clear(true, true); 
    kuisIndex++; 
    sedangKuis = false;
}

// LOMPAT STABIL (Keyboard & HP)
window.loncatVisual = function() {
    if (sedangLompat || sedangKuis) return;

    sedangLompat = true;
    game.scene.scenes[0].tweens.add({
        targets: player,
        scaleX: UKURAN_NORMAL * 1.5,
        scaleY: UKURAN_NORMAL * 1.5,
        yoyo: true,
        duration: 150,
        onComplete: () => {
            player.setScale(UKURAN_NORMAL);
            sedangLompat = false;
        }
    });
}
