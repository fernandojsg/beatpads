import { System } from "ecsy";
import * as THREE from "three";
import {
  Element,
  Shape,
  Sounds,
  Object3D,
  Transform,
  GLTFModel,
  Dissolve
} from "../Components/components.js";

export class GameplaySystem extends System {
  execute(delta, time) {
    const entities = this.queries.entities.results;
    analyser.getFrequencyData();
    let s = analyser.getAverageFrequency() / 256;

    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const transform = entity.getMutableComponent(Transform);
      const element = entity.getMutableComponent(Element);

      const object3D = entity.getMutableComponent(Object3D).value;

      let scale = 1 + s;
      object3D.scale.set(scale, scale, scale);


      transform.position.z += delta * 2;
      if (transform.position.z > 0.2 && !entity.getComponent(Dissolve)) {
        entity.addComponent(Dissolve, {
          type: 0,
          speed: 2
        });

        let sounds = entity.getComponent(Sounds);
        sounds.playSound("miss");
      }
    }
  }
}

GameplaySystem.queries = {
  entities: {
    components: [Element, Transform, GLTFModel],
    listen: {
      added: true,
      removed: true,
      changed: true // [Component]
    }
  }
};
