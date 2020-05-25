import { System } from "ecsy";
import * as THREE from "three";
import { Sound } from "ecsy-three";
import TWEEN from "../vendor/tween.module.min.js";

import { FTTAnalizable, FTTUpdatable } from "../Components/components";

export class AudioGeneratorSystem extends System {
    init() {
        console.log("init");  
        this.analyser = null;
        // this.analyserMid = null;
        // this.analyserHigh = null;
        this.ftt = null;
        this.minDb = 0;
        this.prevAvg = 0;
        this.count = 0;
    }

    execute(delta, time) {
        this.queries.sounds.added.forEach(entity => {     
            const soundComp = entity.getMutableComponent(FTTAnalizable);

            this.minDb = soundComp.minDb;

            var AudioContext = window.AudioContext || window.webkitAudioContext;
            var audioCtx = new AudioContext();

            var mediaElement = new Audio(soundComp.url);
            mediaElement.loop = true;
            mediaElement.listener = this.listener;

            var delay = new DelayNode(audioCtx, {
                delayTime: 0,
                maxDelayTime: 1
            });

            var source = audioCtx.createMediaElementSource(mediaElement);
            this.analyser = audioCtx.createAnalyser();
            this.analyser.fftSize = soundComp.size;
            source.loop = true;
            source.connect(this.analyser);

            // Attempt to filter frequency ranges
            // var filterLow = new BiquadFilterNode(audioCtx, {
            //     type: "bandpass",
            //     frequency: 400,
            //     Q: 100
            // });
            // var filterMid = new BiquadFilterNode(audioCtx, {
            //     type: "bandpass",
            //     frequency: 12000,
            //     Q: 100
            // });
            // var filterHigh = new BiquadFilterNode(audioCtx, {
            //     type: "bandpass",
            //     frequency: 20000,
            //     Q: 100
            // });
            // this.analyser.fftSize = soundComp.size;
            // this.analyserMid = audioCtx.createAnalyser();
            // this.analyserMid.fftSize = soundComp.size;
            // this.analyserHigh = audioCtx.createAnalyser();
            // this.analyserHigh.fftSize = soundComp.size;
            // source.connect(filterMid).connect(this.analyserMid);
            // source.connect(filterHigh).connect(this.analyserHigh);

            source.connect(delay).connect(audioCtx.destination);
            source.mediaElement.play();
        });
        this.queries.sounds.removed.forEach(entity => {
            this.analyser = null;
        });

        this.queries.pads.added.forEach(entity => {
            const mesh = entity.getComponent(FTTUpdatable).mesh;
            mesh.visible = false;
            window.scene.add(mesh);
        });
        this.queries.pads.removed.forEach(entity => {
            const mesh = entity.getComponent(FTTUpdatable).mesh;
            window.scene.remove(mesh);
        });

        var data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        this.processPass(data);  
    }

    // http://stackoverflow.com/questions/962802#962890
    shuffle(array) {
        var tmp, current, top = array.length;
        if(top) while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }
        return array;
    }

    processPass(data) {   
        const sum = data.reduce((a, b) => a + b, 0);
        const avg = (sum / data.length) || 0; 
        if (this.prevAvg > avg && avg > this.minDb) {
            if (this.count % 10 == 0) {
                var pads = this.queries.pads.results;
                pads = this.shuffle(pads);

                var component = null;
                pads.find(entity => {
                    component = entity.getMutableComponent(FTTUpdatable);
                    return !component.moving;
                });
                component.mesh.visible = true;

                console.log("PEAK!");

                component.moving = true;
                setTimeout((component) => {
                    component.moving = false;
                    component.mesh.visible = false;
                }, 500, component);

                // var targetPosition = component.mesh.position.clone();
                // component.mesh.translateZ(-10);
                // component.moving = true;
                // new TWEEN.Tween(mesh.position)
                //     .to(targetPosition, 1000)
                //     .onComplete(() => {
                //         component.mesh.visible = false;
                //         component.moving = false;
                //         component.mesh.position.copy(component.initialPos);
                //     })
                //     .start();
            }
            this.count++;
        }
        this.prevAvg = avg;
    }
}

AudioGeneratorSystem.queries = {
    sounds: {
      components: [FTTAnalizable],
      listen: {
        added: true,
        removed: true,
        changed: true
      }
    },
    pads: {
        components: [FTTUpdatable],
        listen: {
          added: true,
          removed: true,
          changed: true
        }
      }
  };