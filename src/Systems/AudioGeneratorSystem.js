import { System, Not } from "ecsy";
import * as THREE from "three";
import { levels } from "../levels.js";
import {
  FFTAnalizable,
  FFTUpdatable,
  FFTVisualizable,
  Level,
  Active,
  Object3D,
  GameState,
  Moving,
  Lane,
  Pad
} from "../Components/components";

export class AudioGeneratorSystem extends System {
  init() {
    this.source = null;
    this.analyser = null;
    this.prevAvg = 0;
    this.deltaAccum = 0;
    this.level = null;
    this.angleY = 0;
    this.playing = false;
    this.data = null;
    this.fft = null;
  }

  execute(delta) {
    this.queries.levels.added.forEach(entity => {
      this.level = levels[entity.getComponent(Level).value];
      this.angleY = Math.PI / (this.level.sizeX * 2) / 2;
    });

    this.queries.ffts.added.forEach(entity => {
      this.fft = entity.getMutableComponent(FFTAnalizable);
    });
    this.queries.ffts.removed.forEach(() => {
      this.analyser = null;
    });

    this.queries.gameState.changed.forEach(entity => {
      let gameState = entity.getComponent(GameState);
      if (!this.playing && gameState.playing && this.fft) {
        this.playing = true;

        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioCtx = new AudioContext();

        var mediaElement = new Audio(this.level.song);
        mediaElement.loop = true;
        mediaElement.listener = this.listener;

        var delay = new DelayNode(audioCtx, {
          delayTime: 1,
          maxDelayTime: 1
        });

        this.source = audioCtx.createMediaElementSource(mediaElement);
        this.analyser = audioCtx.createAnalyser();
        this.analyser.fftSize = this.fft.value;
        this.data = new Uint8Array(this.analyser.frequencyBinCount);
        this.source.loop = true;
        this.source.connect(this.analyser);
        this.source.connect(delay).connect(audioCtx.destination);
        this.source.mediaElement.play();
      } else if (!gameState.playing) {
        this.playing = false;
        this.source.mediaElement.pause();
      }
    });

    if (this.playing) {
      this.analyser.getByteFrequencyData(this.data);
      this.processPass(delta, this.data);
      this.updateVisualiser(delta, this.data);
    }
  }

  // Process the FFT data and starts the pads animation.
  // An inactive Pad from the pool is used, we should never hit the pool bottom?
  processPass(delta, data) {
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length || 0;
    if (this.prevAvg > avg && avg > this.level.avgDb) {
      if (this.deltaAccum > 1 / this.level.speed) {
        this.deltaAccum = 0;
        console.log(
          "Pads pool size: " + this.queries.availablePads.results.length
        );
        var entity = this.queries.availablePads.results[0];
        var lane = this.queries.availableLanes.results[0];
        if (!entity || !lane) {
          return;
        }

        entity.addComponent(Active);
        lane.addComponent(Active);

        var laneObject = lane.getMutableComponent(Object3D);
        laneObject.value.visible = true;

        var object = entity.getMutableComponent(Object3D);
        object.value.visible = true;

        var randX = Math.round(Math.random() * this.level.sizeX - 1);
        var randY = Math.round(Math.random() * this.level.sizeY - 1);

        const hue = (randX * randY) / (this.level.sizeX * this.level.sizeY);
        const color = new THREE.Color();
        color.setHSL(hue, 1.0, 0.5);
        object.value.material.color.set(color);
        object.value.material.emissive.set(color);
        laneObject.value.material.color.set(color);

        const posY = 1 + randY * this.level.padSize;
        const posZ = -this.level.speed;
        const rotY =
          this.angleY * (this.level.sizeX / 2) - (randX + 1) * this.angleY;

        object.value.position.set(0, 0, 2);
        object.value.rotation.set(0, 0, 0);
        object.value.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotY);
        object.value.translateY(posY);
        object.value.translateZ(posZ);
        entity.addComponent(Moving, { value: new THREE.Vector3(0, 0, 0) });

        laneObject.value.position.set(0, 0, 2);
        laneObject.value.rotation.set(0, 0, 0);
        laneObject.value.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotY);
        laneObject.value.translateY(posY - this.level.padSize / 2);
        laneObject.value.translateZ(posZ);
        laneObject.value.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

        var pad = entity.getMutableComponent(Pad);
        pad.lane = lane;
      }
      this.deltaAccum += delta;
    }
    this.prevAvg = avg;
  }

  updateVisualiser(delta, data) {
    this.queries.visualizer.results.forEach(entity => {
      let visualizer = entity.getComponent(FFTVisualizable);
      let object = entity.getComponent(Object3D);
      const context = visualizer.context;
      const width = visualizer.width;
      const height = visualizer.height;
      context.clearRect(0, 0, width, height);
      const barWidth = width / data.length;
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * height;
        const hue = Math.round((i / data.length) * 360);
        context.globalAlpha = 1;
        context.fillStyle = `hsl(${hue}, 100%, 50%)`;
        context.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
      }
      object.value.material.map.needsUpdate = true;
    });
  }
}

AudioGeneratorSystem.queries = {
  ffts: {
    components: [FFTAnalizable],
    listen: {
      added: true,
      removed: true,
      changed: true
    }
  },
  availablePads: {
    components: [FFTUpdatable, Not(Moving), Not(Active)]
  },
  availableLanes: {
    components: [Lane, Not(Active)]
  },
  levels: {
    components: [Level],
    listen: {
      added: true
    }
  },
  gameState: {
    components: [GameState],
    listen: {
      changed: true
    }
  },
  visualizer: {
    components: [FFTVisualizable],
    listen: {
      added: true,
      removed: true,
      changed: true
    }
  },
};
