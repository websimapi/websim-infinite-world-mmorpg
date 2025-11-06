import * as THREE from 'three';

const CHUNK_SIZE = 32;
const VIEW_DISTANCE = 3; // in chunks

class World {
    constructor(scene, network) {
        this.scene = scene;
        this.network = network;
        this.chunks = {};
    }

    getChunkKey(x, z) {
        return `${Math.floor(x / CHUNK_SIZE)},${Math.floor(z / CHUNK_SIZE)}`;
    }

    update(playerPosition) {
        const currentChunkX = Math.floor(playerPosition.x / CHUNK_SIZE);
        const currentChunkZ = Math.floor(playerPosition.z / CHUNK_SIZE);

        // Load new chunks
        for (let x = currentChunkX - VIEW_DISTANCE; x <= currentChunkX + VIEW_DISTANCE; x++) {
            for (let z = currentChunkZ - VIEW_DISTANCE; z <= currentChunkZ + VIEW_DISTANCE; z++) {
                const key = `${x},${z}`;
                if (!this.chunks[key]) {
                    this.loadChunk(x, z);
                }
            }
        }

        // Unload old chunks (optional, for performance)
        for (const key in this.chunks) {
            const [x, z] = key.split(',').map(Number);
            if (Math.abs(x - currentChunkX) > VIEW_DISTANCE || Math.abs(z - currentChunkZ) > VIEW_DISTANCE) {
                this.unloadChunk(key);
            }
        }
    }

    async loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;

        // Mark as loading to prevent multiple loads
        this.chunks[key] = { loading: true, mesh: null, blocks: {} };

        const chunkData = await this.network.getChunkData(key);

        const groundGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.set(chunkX * CHUNK_SIZE + CHUNK_SIZE/2, 0, chunkZ * CHUNK_SIZE + CHUNK_SIZE/2);
        groundMesh.receiveShadow = true;

        const chunkGroup = new THREE.Group();
        chunkGroup.add(groundMesh);

        this.chunks[key] = {
            loading: false,
            mesh: chunkGroup,
            blocks: chunkData?.blocks || {}
        };

        this.rebuildChunkMesh(key);
        this.scene.add(chunkGroup);
    }

    rebuildChunkMesh(key) {
        const chunk = this.chunks[key];
        if (!chunk || !chunk.mesh) return;

        // Clear old blocks
        while(chunk.mesh.children.length > 1) {
            chunk.mesh.remove(chunk.mesh.children[1]);
        }

        const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
        const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        for (const blockKey in chunk.blocks) {
            const pos = chunk.blocks[blockKey];
            const blockMesh = new THREE.Mesh(blockGeometry, blockMaterial);
            blockMesh.position.set(pos.x, pos.y, pos.z);
            blockMesh.castShadow = true;
            blockMesh.receiveShadow = true;
            chunk.mesh.add(blockMesh);
        }
    }

    unloadChunk(key) {
        if (this.chunks[key] && this.chunks[key].mesh) {
            this.scene.remove(this.chunks[key].mesh);
        }
        delete this.chunks[key];
    }

    handleNetworkUpdate(chunkRecords) {
        for (const key in chunkRecords) {
            if (this.chunks[key]) {
                this.chunks[key].blocks = chunkRecords[key]?.blocks || {};
                this.rebuildChunkMesh(key);
            }
        }
    }

    async processCommand(command, playerPosition) {
        if (command.startsWith('/add block at ')) {
            const coords = command.replace('/add block at ', '').split(',').map(s => parseInt(s.trim()));
            if (coords.length === 2) {
                const [x, z] = coords;
                const worldX = Math.round(playerPosition.x) + x;
                const worldZ = Math.round(playerPosition.z) + z;

                const key = this.getChunkKey(worldX, worldZ);
                if (this.chunks[key]) {
                    const blockKey = `${worldX},0,${worldZ}`;
                    const newBlock = { x: worldX, y: 0.5, z: worldZ };
                    this.chunks[key].blocks[blockKey] = newBlock;
                    this.rebuildChunkMesh(key);
                    await this.network.updateChunk(key, this.chunks[key].blocks);
                }
            }
        }
    }
}

export default World;