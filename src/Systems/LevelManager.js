import { System } from "ecsy";
import * as THREE from "three";
import { Text, Position } from "ecsy-three";
import {
  Level,
  Transform,
  GLTFLoader,
  GameState,
  Active,
  Parent,
  Animation,
  LevelItem,
  Element,
  FTTAnalizable,
  FTTUpdatable
} from "../Components/components.js";
import { levels } from "../levels.js";

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

    let levelLabel = this.world.entityManager.getEntityByName("level");
    if (levelLabel) {
      levelLabel.getMutableComponent(Text).text = levelId;
    }

    let levelGroup = this.world.entityManager.getEntityByName("levelGroup");

    this.clearCurrentLevel();

    const SIZE = 5;
    const ANGLE = Math.PI / 10;
    var index = 0;
    for (var x = 0; x < SIZE; x++) {
      for (var y = 0; y < SIZE; y++) {
        var geometry = new THREE.PlaneGeometry(1.5, 1.5, 1);
        const color = new THREE.Color();
        const h = index / (SIZE * SIZE);
        color.setHSL(h, 1.0, 0.5);
        var material = new THREE.MeshBasicMaterial({
          color: color,
          side: THREE.DoubleSide
        });
        var plane = new THREE.Mesh(geometry, material);
        plane.rotateOnAxis(new THREE.Vector3(0, 1, 0), 2 * ANGLE - x * ANGLE);
        plane.translateY(1 + y * 2);
        plane.translateZ(-10);
        plane.visible = false;
        const pad = this.world.createEntity().addComponent(FTTUpdatable, {
          mesh: plane,
          index: index,
          initialPos: plane.position.clone()
        });
        index++;
      }
    }

    let radius = 10;

    let N = 20;
    for (var i = 0; i < N; i++) {
      let w = 2;
      let h = 2;
      let x = w / 2 - Math.random() * w;
      let y = h / 2 - Math.random() * h + 2;

      let element = {
        type: 3, //Math.floor(Math.random() * 4),
        position: new THREE.Vector3(x, y, -radius - Math.random() * 10 - i),
        rotation: new THREE.Vector3(0, 0, 0)
      };

      this.world
        .createEntity()
        .addComponent(Element, {
          type: element.type
        })
        .addComponent(Transform, {
          position: element.position,
          rotation: element.rotation
        })
        .addComponent(LevelItem)
        .addComponent(Parent, { value: levelGroup });
    }
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
