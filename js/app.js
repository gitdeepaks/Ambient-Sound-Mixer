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
    this.masterVolume = 100;
    this.isInilized = false;
  }

  init() {
    try {
      //INITILIZE UI
      this.ui.init();

      //render souncard using our sound data

      this.ui.renderSoundCards(sounds);
      this.setEventListners();
      //load all sound files
      this.loadAllSounds();

      this.isInilized = true;
    } catch (error) {
      console.error('Failed to initialize app', error);
    }
  }

  //setup all event listners
  setEventListners() {
    //hanlde all clicks with event deligation.
    document.addEventListener('click', async (e) => {
      //check if a play button was clicked.
      if (e.target.closest('.play-btn')) {
        const soundId = e.target.closest('.play-btn').dataset.sound;
        await this.toggleSound(soundId);
      }
    });

    //Handle volume slider changes
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('volume-slider')) {
        const soundId = e.target.dataset.sound;
        const volume = parseInt(e.target.value);
        this.setMasterVolume(volume);
        // console.log(soundId, volume);
      }
    });

    //Handle Master Volume slider
    const masterVolumeSlider = document.getElementById('masterVolume');
    if (masterVolumeSlider) {
      masterVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        this.setSoundVolume(volume);
      });
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
  //toggle individual sound
  async toggleSound(soundId) {
    const audio = this.soundManager.audioElement.get(soundId);
    if (!audio) {
      console.error(`Sound ${soundId} not found`);
      return false;
    }
    if (audio.paused) {
      //Get the current slider value
      const card = document.querySelector(`[data-sound="${soundId}"]`);
      const slider = card.querySelector('.volume-slider');
      let volume = parseInt(slider.value);
      //If slider is at 0 then set it to 70
      if (volume === 0) {
        volume = 70;
        this.ui.updateVolumeDisplay(soundId, volume);
      }
      //Set the volume
      this.soundManager.setVolume(soundId, volume);
      await this.soundManager.playSound(soundId);
      // Update play button
      this.ui.updateSoundPlayButton(soundId, true);
    } else {
      this.soundManager.pauseSound(soundId);
      this.ui.updateSoundPlayButton(soundId, false);
    }
  }

  //Set Sound Volume
  setSoundVolume(soundId, volume) {
    //calculate effective volume by master volume
    const effectiveVolume = (volume * this.masterVolume) / 100;
    //update the sound volume with the scaled volume
    const audio = this.soundManager.audioElement.get(soundId);

    if (audio) {
      audio.volume = effectiveVolume / 100;
    }

    //update visual display
    this.ui.updateVolumeDisplay(soundId, volume);
  }
  //set Master Volume
  setMasterVolume(volume) {
    this.masterVolume = volume;

    //update the display
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    if (masterVolumeValue) {
      masterVolumeValue.textContent = `${volume}%`;
    }
    //Apply master volume to all currently playing sounds
    this.applyMaterVolumeAll();
  }
  //Apply master volume to all sounds
  applyMaterVolumeAll() {
    for (const [soundId, audio] of this.soundManager.audioElement) {
      if (!audio.paused) {
        const card = document.querySelector(`[data-sound=${soundId}]`);
        const slider = card?.querySelector('.volumer-slider');
        if (slider) {
          const individualVolume = parseInt(slider.value);
          //Calculate effective volume (individial * master /100)

          const effectiveVolume = (individualVolume * this.masterVolume) / 100;
          //Apply to the actual audio Element
          audio.value = effectiveVolume / 100;
        }
      }
    }
  }
}

// Initialize app when app the ready
document.addEventListener('DOMContentLoaded', function () {
  const app = new AmbientMixer();
  app.init();
});
