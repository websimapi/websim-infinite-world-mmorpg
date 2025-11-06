class Network {
    constructor() {
        this.room = new WebsimSocket();
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onPlayerUpdate = null;
        this.onWorldUpdate = null;
        this.useLocalStorage = false;
        this.chunkCollectionName = 'world_chunks_v1';
    }

    async initialize() {
        await this.room.initialize();
        console.log("Network initialized. My client ID:", this.room.clientId);

        this.room.subscribePresence((presence) => {
            const currentPlayers = Object.keys(this.room.peers);
            const knownPlayers = Object.keys(presence);

            // Player joined
            knownPlayers.forEach(id => {
                if (this.onPlayerJoined) {
                    this.onPlayerJoined(id, this.room.peers[id]?.username || 'Player', id === this.room.clientId);
                }
            });

            // Player left
            // This is implicitly handled by the presence object no longer containing the player

            // Player updates
            for (const id in presence) {
                if (this.onPlayerUpdate) {
                    this.onPlayerUpdate(id, presence[id]);
                }
            }
        });

        this.room.collection(this.chunkCollectionName).subscribe((chunks) => {
            if (this.useLocalStorage) return; // Ignore database if local storage is active
            const chunkMap = {};
            chunks.forEach(c => {
                chunkMap[c.chunkKey] = c;
            });
            if (this.onWorldUpdate) {
                this.onWorldUpdate(chunkMap);
            }
        });
    }

    getClientId() {
        return this.room.clientId;
    }

    getPresence(clientId) {
        return this.room.presence[clientId];
    }

    updateMyPresence(data) {
        this.room.updatePresence(data);
    }

    toggleLocalStorage(enabled) {
        this.useLocalStorage = enabled;
        if (enabled) {
            this.loadFromLocalStorage();
        } else {
            // This will trigger a re-sync from the database via the subscription
            const chunks = this.room.collection(this.chunkCollectionName).getList();
            const chunkMap = {};
            chunks.forEach(c => { chunkMap[c.chunkKey] = c; });
            if (this.onWorldUpdate) this.onWorldUpdate(chunkMap);
        }
    }

    async getChunkData(key) {
        if (this.useLocalStorage) {
            const data = localStorage.getItem(this.chunkCollectionName);
            const allChunks = data ? JSON.parse(data) : {};
            return allChunks[key];
        } else {
            const records = this.room.collection(this.chunkCollectionName).filter({ chunkKey: key }).getList();
            return records.length > 0 ? records[0] : null;
        }
    }

    async updateChunk(key, blocks) {
        const payload = {
            chunkKey: key,
            blocks: blocks
        };
        if (this.useLocalStorage) {
            const data = localStorage.getItem(this.chunkCollectionName);
            const allChunks = data ? JSON.parse(data) : {};
            allChunks[key] = payload;
            localStorage.setItem(this.chunkCollectionName, JSON.stringify(allChunks));
        } else {
            const existing = await this.getChunkData(key);
            if (existing) {
                await this.room.collection(this.chunkCollectionName).update(existing.id, payload);
            } else {
                await this.room.collection(this.chunkCollectionName).create(payload);
            }
        }
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem(this.chunkCollectionName);
        const allChunks = data ? JSON.parse(data) : {};
        if (this.onWorldUpdate) {
            this.onWorldUpdate(allChunks);
        }
    }

    deleteLocalStorage() {
        localStorage.removeItem(this.chunkCollectionName);
    }
}

export default Network;