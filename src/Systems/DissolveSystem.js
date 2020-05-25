import { System } from "ecsy";
import { Element, Dissolve, Object3D } from "../Components/components.js";

export class DissolveSystem extends System {
  execute(delta) {
    var entities = this.queries.entities.results;

    //Queries
    for (let i = 0; i < entities.length; i++) {
      var entity = entities[i];
      var dissolve = entity.getMutableComponent(Dissolve);
      var object = entity.getComponent(Object3D).value;
      let material = object.material;
      if (!material) {
        continue;
      }

      let dissolve01 = 1 - dissolve.value;

      let s = 1 + dissolve01;

      if (dissolve.type === 0) {
        material.emissive.r = dissolve.value;
        object.scale.set(s,s,s);
      } else {
        material.emissive.g = dissolve.value;
        s = 1/s;
        object.scale.set(s,s,s);
      }

      object.material.opacity = dissolve.value;
      object.material.transparent = true;

      dissolve.value -= delta * dissolve.speed;
      if (dissolve.value <= 0) {
        entity.remove();
      }
    }
  }
}

DissolveSystem.queries = {
  entities: {
    components: [Element, Dissolve, Object3D],
    listen: {
      added: true
    }
  }
};
