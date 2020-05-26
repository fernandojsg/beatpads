import { System } from "ecsy";
import * as THREE from "three";
import { Text, Position, Object3D } from "ecsy-three";
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
  FTTUpdatable,
  Pad
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

    let level = levels[levelId];

    let levelLabel = this.world.entityManager.getEntityByName("level");
    if (levelLabel) {
      levelLabel.getMutableComponent(Text).text = levelId;
    }

    let levelGroup = this.world.entityManager.getEntityByName("levelGroup");

    this.clearCurrentLevel();

    // Create the pads pool
    let poolSize = level.sizeX * level.sizeY;
    for (var i = 0; i < poolSize; i++) {
      this.world
        .createEntity()
        .addComponent(FTTUpdatable)
        .addComponent(Element, {
          type: 3
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
