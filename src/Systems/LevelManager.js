import { System } from "ecsy";
import * as THREE from "three";
import { Text } from "ecsy-three";
import {
  Level,
  LevelItem,
  Element,
  FFTAnalizable,
  FFTUpdatable,
  ParentOnAdd,
  FFTVisualizable,
  Pad,
  Lane
} from "../Components/components.js";
import { levels } from "../levels.js";
import * as Materials from "../materials.js";

/**
 * This system initialize each level and transition between one to another
 * It creates the elements, load the songs and prepare the pads
 */
export class LevelManager extends System {
  execute() {
    this.queries.levels.added.forEach(entity => {
      this.initializeLevel(entity.getComponent(Level).value);
    });

    this.queries.levels.changed.forEach(entity => {
      this.initializeLevel(entity.getComponent(Level).value);
    });
  }

  clearCurrentLevel() {
    var items = this.queries.levelItems.results;
    for (var i = items.length - 1; i >= 0; i--) {
      items[i].remove();
    }
  }

  initializeLevel(levelId) {
    if (levelId > levels.length) {
      levelId = 0;
    }

    let level = levels[levelId];

    let levelLabel = this.world.entityManager.getEntityByName("level");
    if (levelLabel) {
      levelLabel.getMutableComponent(Text).text = levelId;
    }

    let levelGroup = this.world.entityManager.getEntityByName("levelGroup");

    this.clearCurrentLevel();

    this.initializeObjectPools(level, levelGroup);

    // Create the FFT analizable data
    // @todo remove this, can be replace by a global setting
    this.world
      .createEntity("AudioGeneratorSystem")
      .addComponent(FFTAnalizable, {
        value: 256
      });

    this.initializeVisualizer();
  }

  initializeObjectPools(level, parent) {
    // Create the pads pool
    let poolSize = level.sizeX * level.sizeY;
    for (var i = 0; i < poolSize; i++) {
      this.world
        .createEntity()
        .addComponent(Pad)
        .addComponent(FFTUpdatable)
        .addComponent(Element, {
          type: 3
        })
        .addComponent(LevelItem)
        .addComponent(ParentOnAdd, { value: parent });

      // Create the lanes pool
      var geometry = new THREE.PlaneGeometry(
        level.padSize * 2,
        level.padSize * 20,
        1
      );
      let texture = Materials.textures["arrow.png"];
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 10);
      var material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: texture,
        fog: false,
        transparent: true,
        alphaTest: 0.5
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;

      this.world
        .createEntity()
        .addComponent(Lane)
        .addComponent(LevelItem)
        .addObject3DComponents(mesh, parent);
    }
  }

  // Create a Frequency visualizer
  initializeVisualizer() {
    let radius = 10;
    let height = 7;
    var geometry = new THREE.CylinderBufferGeometry(
      radius,
      radius,
      height,
      30,
      20,
      true,
      0,
      Math.PI
    );
    var canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    var context = canvas.getContext("2d");
    let canvasTexture = new THREE.CanvasTexture(canvas);
    var material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: canvasTexture,
      fog: false,
      transparent: true
    });
    var mesh = new THREE.Mesh(geometry, material);

    this.world
      .createEntity()
      .addComponent(FFTVisualizable, {
        context: context,
        width: canvas.width,
        height: canvas.height
      })
      .addObject3DComponents(
        mesh,
        window.data.entities.scene // @fix!
      );

    mesh.position.y = height / 2;
    mesh.rotation.y = Math.PI;

    let mesh2 = mesh.clone();
    mesh2.scale.x = -1;
    window.mesh2 = mesh2;
    this.world
      .createEntity()
      .addComponent(FFTVisualizable, {
        context: context,
        width: canvas.width,
        height: canvas.height
      })
      .addObject3DComponents(
        mesh2,
        window.data.entities.scene // @fix!
      )

    mesh2.position.y = height / 2;
    mesh2.rotation.set(0, Math.PI, 0);
  }
}

LevelManager.queries = {
  /* @todo singleton */
  levels: {
    components: [Level],
    listen: {
      added: true,
      changed: true
    }
  },
  levelItems: {
    components: [LevelItem]
  }
};
