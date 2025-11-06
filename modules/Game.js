import * as THREE from 'three';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 0, 150);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = 10;
        this.camera.position.z = 10;

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        this.clock = new THREE.Clock();
        this.players = {};
        this.clientId = null;

        this.setupLighting();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setClientId(id) {
        this.clientId = id;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(-30, 50, -30);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    addPlayer(id, username) {
        if (this.players[id] || id === this.clientId) return; // Don't add self as a remote player

        const geometry = new THREE.CapsuleGeometry(0.4, 0.8);
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const playerMesh = new THREE.Mesh(geometry, material);
        playerMesh.position.set(0, -100, 0); // Start off-screen
        this.scene.add(playerMesh);

        // Add username tag
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 20px Arial';
        context.fillStyle = 'rgba(0,0,0,0.8)';
        context.fillText(username, 0, 20);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.y = 1.2;
        playerMesh.add(sprite);

        this.players[id] = playerMesh;
    }

    removePlayer(id) {
        if (this.players[id]) {
            this.scene.remove(this.players[id]);
            delete this.players[id];
        }
    }

    updatePlayer(id, presence) {
        if (this.players[id] && presence.position) {
            this.players[id].position.lerp(new THREE.Vector3(presence.position.x, presence.position.y, presence.position.z), 0.1);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render(player, camera) {
        // Center camera on player object
        this.camera.position.copy(camera.position);
        this.camera.rotation.copy(camera.rotation);

        this.renderer.render(this.scene, this.camera);
    }
}

export default Game;