import { sounds, defaultPresets } from './soundData.js';
import { SoundManager } from './soundManager.js';
import { UI } from './ui.js';

class AmbientMixer {
  //Initialize dependencies nad default state

  constructor() {
    this.soundManager = new SoundManager();
    this.ui = new UI();
    this.presentManager = null;
    this.timer = null;
    this.currentSoundState = {};
    this.isInilized = false;
  }

  init() {
    try {
      //INITILIZE UI
      this.ui.init();

      //render souncard using our sound data

      this.ui.renderSoundCards(sounds);
      //load all sound files
      this.loadAllSounds();

      this.isInilized = true;
    } catch (error) {
      console.error('Failed to initialize app', error);
    }
  }
  // Load all sounds
  loadAllSounds() {
    sounds.forEach((sound) => {
      const audioUrl = `audio/${sound.file}`;
      const success = this.soundManager.loadSound(sound.id, audioUrl);
      if (!success) {
        console.warn(`Could not load sound: ${sound.name} from ${audioUrl}`);
      }
    });
  }
}

// Initialize app when app the ready
document.addEventListener('DOMContentLoaded', function () {
  const app = new AmbientMixer();
  app.init();
});
