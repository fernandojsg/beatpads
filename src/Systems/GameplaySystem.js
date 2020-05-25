import { System, Not } from "ecsy";
import {
  Element,
  Collided,
  Transform,
  GLTFModel,
  Missed
} from "../Components/components.js";

/**
 * @todo Move it to ElementSystem ?
 */
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
    components: [Element, Transform, GLTFModel, Not(Missed), Not(Collided)]
  }
};
