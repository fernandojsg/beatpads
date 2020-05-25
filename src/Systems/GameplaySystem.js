import { System, Not } from "ecsy";
import * as THREE from "three";
import {
  Element,
  Collided,
  Shape,
  Sounds,
  GameState,
  Object3D,
  Transform,
  GLTFModel,
  Missed,
  Dissolve
} from "../Components/components.js";

export class GameplaySystem extends System {
  execute(delta) {
    const entities = this.queries.entities.results;
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const transform = entity.getMutableComponent(Transform);

      transform.position.z += delta * 2;
      if (transform.position.z > 0.2) {
        entity.addComponent(Missed);
      }
    }
  }
}

GameplaySystem.queries = {
  entities: {
    components: [Element, Transform, GLTFModel, Not(Missed), Not(Collided)],
    listen: {
      added: true,
      removed: true,
      changed: true // [Component]
    }
  },
  gameState: {
    components: [GameState]
  }
};
