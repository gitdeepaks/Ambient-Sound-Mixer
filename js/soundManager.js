export class SoundManager {
  constructor() {
    this.audioElement = new Map();
    this.isPlaying = false;
  }

  // Load a sound file
  loadSound(soundId, filePath) {
    try {
      const audio = new Audio();
      audio.src = filePath;
      audio.loop = true;
      audio.preload = 'metadata';

      //Add sounds to audio elements map

      this.audioElement.set(soundId, audio);
      return true;
    } catch (error) {
      console.error(`Failed to load sound ${soundId}`);
      return false;
    }
  }
  //Play the specific sound
  async playSound(soundId) {
    const audio = this.audioElement.get(soundId);
    if (audio) {
      try {
        await audio.play();
        console.log(`Playing ${soundId}`);
        return true;
      } catch (error) {
        console.error(`Failed to play ${soundId}`, error);
        return false;
      }
    }
  }
  //Pause a specific sound

  pauseSound(soundId) {
    const audio = this.audioElement.get(soundId);
    if (audio && !audio.paused) {
      audio.pause();
      console.log(`Paused: ${soundId}`);
    }
  }
  //setVolume for specific sound
  setVolume(soundId, volume) {
    const audio = this.audioElement.get(soundId);

    if (!audio) {
      console.error(`Sound ${soundId} not found`);
    }

    // convert 0-100 to 0-1
    audio.volume = volume / 100;
    console.log(`Volume for ${soundId}: ${volume}`);
    return true;
  }
}
