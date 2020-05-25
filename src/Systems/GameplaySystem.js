import { System } from "ecsy";
import * as THREE from "three";
import {
  Element,
  Shape,
  Sounds,
  GameState,
  Object3D,
  Transform,
  GLTFModel,
  Dissolve
} from "../Components/components.js";

export class GameplaySystem extends System {
  execute(delta, time) {
    const entities = this.queries.entities.results;
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const transform = entity.getMutableComponent(Transform);
      const element = entity.getMutableComponent(Element);

      const object3D = entity.getMutableComponent(Object3D).value;

      transform.position.z += delta * 2;
      if (transform.position.z > 0.2 && !entity.getComponent(Dissolve)) {
        entity.addComponent(Dissolve, {
          type: 0,
          speed: 2
        });

        let sounds = entity.getComponent(Sounds);
        sounds.playSound("miss");

        let gameState = this.queries.gameState.results[0].getMutableComponent(
          GameState
        );

        gameState.failures++;
        gameState.life -= 2;
        gameState.combo--;
        if (gameState.combo < 1) {
          gameState.combo = 1;
        }

        if (gameState.life <= 0) {
          console.log("Game over!");
        }

        console.log(gameState);
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
  },
  gameState: {
    components: [GameState]
  }
};
