import Game from './modules/Game.js';
import World from './modules/World.js';
import PlayerControls from './modules/PlayerControls.js';
import Network from './modules/Network.js';
import UI from './modules/UI.js';

class App {
    constructor() {
        this.game = new Game();
        this.network = new Network();
        this.world = new World(this.game.scene, this.network);
        this.controls = new PlayerControls(this.game.camera);
        this.ui = new UI(this.world, this.network);

        this.init();
    }

    async init() {
        await this.network.initialize();
        this.game.setClientId(this.network.getClientId());

        this.network.onPlayerJoined = (id, username, isMe) => {
            console.log('Player joined:', username, id);
            this.game.addPlayer(id, username);
            if (isMe) {
                const initialPresence = this.network.getPresence(id);
                if (initialPresence && initialPresence.position) {
                    this.controls.player.position.copy(initialPresence.position);
                    this.game.camera.position.copy(initialPresence.position);
                    this.game.camera.position.y += 2;
                }
            }
        };

        this.network.onPlayerLeft = (id) => {
            console.log('Player left:', id);
            this.game.removePlayer(id);
        };

        this.network.onPlayerUpdate = (id, presence) => {
            this.game.updatePlayer(id, presence);
        };

        this.network.onWorldUpdate = (chunks) => {
            this.world.handleNetworkUpdate(chunks);
        };
        
        this.ui.onCommand = (command) => {
            this.world.processCommand(command, this.controls.player.position);
        };

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.game.clock.getDelta();
        this.controls.update(deltaTime);

        const playerPosition = this.controls.player.position;
        this.network.updateMyPresence({ position: playerPosition });

        this.world.update(playerPosition);
        this.ui.updatePlayerCoords(playerPosition);
        
        this.game.render(this.controls.player, this.controls.camera);
    }
}

window.addEventListener('load', () => new App());

