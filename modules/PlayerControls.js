import * as THREE from 'three';
import nipplejs from 'nipplejs';

class PlayerControls {
    constructor(camera) {
        this.camera = camera;
        this.player = new THREE.Object3D();
        this.player.position.set(0, 0.5, 5);

        this.velocity = new THREE.Vector3();
        this.speed = 5.0;

        this.pitch = 0;
        this.yaw = 0;

        this.keys = {};
        this.touchMove = { x: 0, y: 0 };
        this.isPointerDown = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;

        this.initDesktopControls();
        this.initMobileControls();
    }

    initDesktopControls() {
        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('pointerdown', (e) => { if(e.pointerType === 'mouse') this.isPointerDown = true; });
        document.addEventListener('pointerup', (e) => { if(e.pointerType === 'mouse') this.isPointerDown = false; });
        document.addEventListener('pointermove', (e) => this.onPointerMove(e));
    }

    initMobileControls() {
        const joystickZone = document.getElementById('joystick-zone');
        const options = {
            zone: joystickZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white'
        };
        const manager = nipplejs.create(options);

        manager.on('move', (evt, data) => {
            if (data.vector) {
                this.touchMove.x = data.vector.x;
                this.touchMove.y = -data.vector.y; // Invert Y
            }
        });

        manager.on('end', () => {
            this.touchMove.x = 0;
            this.touchMove.y = 0;
        });

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => {
             if (e.target === canvas) this.isPointerDown = true;
        });
        canvas.addEventListener('touchend', (e) => {
            if (e.target === canvas) this.isPointerDown = false;
        });
        canvas.addEventListener('touchmove', (e) => this.onPointerMove(e));
    }

    onPointerMove(event) {
        if (!this.isPointerDown) return;

        const movementX = event.movementX || event.touches?.[0]?.pageX - (this.lastTouchX || event.touches?.[0]?.pageX) || 0;
        const movementY = event.movementY || event.touches?.[0]?.pageY - (this.lastTouchY || event.touches?.[0]?.pageY) || 0;

        this.yaw -= movementX * 0.002;
        this.pitch -= movementY * 0.002;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        if (event.touches) {
            this.lastTouchX = event.touches[0].pageX;
            this.lastTouchY = event.touches[0].pageY;
        }
    }

    update(deltaTime) {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        let moveDirection = new THREE.Vector3();

        // Keyboard input
        if (this.keys['KeyW']) moveDirection.add(forward);
        if (this.keys['KeyS']) moveDirection.sub(forward);
        if (this.keys['KeyA']) moveDirection.sub(right);
        if (this.keys['KeyD']) moveDirection.add(right);

        // Touch input
        if (this.touchMove.y) moveDirection.add(forward.clone().multiplyScalar(this.touchMove.y));
        if (this.touchMove.x) moveDirection.add(right.clone().multiplyScalar(this.touchMove.x));

        moveDirection.normalize();

        this.velocity.lerp(moveDirection.multiplyScalar(this.speed), 0.1);

        this.player.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Update camera
        this.camera.position.copy(this.player.position).add(new THREE.Vector3(0, 1.6, 0));
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }
}

export default PlayerControls;