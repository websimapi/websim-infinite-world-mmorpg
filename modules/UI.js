class UI {
    constructor(world, network) {
        this.world = world;
        this.network = network;
        this.onCommand = null;

        this.commandInput = document.getElementById('command-input');
        this.settingsToggle = document.getElementById('settings-toggle');
        this.settingsPanel = document.getElementById('settings-panel');
        this.localStorageToggle = document.getElementById('localstorage-toggle');
        this.deleteLocalStorageBtn = document.getElementById('delete-local-storage');
        this.playerCoords = document.getElementById('player-coords');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.micButton = document.getElementById('mic-button');

        this.initEventListeners();
    }

    initEventListeners() {
        this.commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.commandInput.value) {
                if (this.onCommand) {
                    this.onCommand(this.commandInput.value);
                }
                this.commandInput.value = '';
            }
        });

        this.settingsToggle.addEventListener('click', () => {
            this.settingsPanel.classList.toggle('hidden');
        });

        this.localStorageToggle.addEventListener('change', (e) => {
            this.network.toggleLocalStorage(e.target.checked);
        });

        this.deleteLocalStorageBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all local storage data? This cannot be undone.')) {
                this.network.deleteLocalStorage();
                alert('Local storage cleared.');
                 // Force a reload to clear world state
                window.location.reload();
            }
        });
        
        this.micButton.addEventListener('click', () => {
            alert('Microphone input is not yet implemented.');
        });
    }

    updatePlayerCoords(position) {
        const x = position.x.toFixed(1);
        const y = position.y.toFixed(1);
        const z = position.z.toFixed(1);
        this.playerCoords.textContent = `X: ${x}, Y: ${y}, Z: ${z}`;
    }

    showLoading(show) {
        if (show) {
            this.loadingSpinner.classList.remove('hidden');
        } else {
            this.loadingSpinner.classList.add('hidden');
        }
    }
}

export default UI;

