import { System, Not } from "ecsy";
import * as THREE from "three";
import { levels } from "../levels.js";
import { Active, Lane, Object3D, Dissolve } from "../Components/components";

export class LaneSystem extends System {
  execute(delta, time) {
    this.queries.lanes.added.forEach(entity => {
      const object = entity.getComponent(Object3D);
      object.value.visible = false;
    });

    this.queries.activeLanes.added.forEach(entity => {
      const object = entity.getComponent(Object3D);
      object.value.visible = true;
    });
    this.queries.activeLanes.results.forEach(entity => {
      const object = entity.getComponent(Object3D);
      object.value.material.map.offset.y += -delta;
    });

    this.queries.inactiveLanes.added.forEach(entity => {
      console.log("Hidding inactive lane");
      const object = entity.getComponent(Object3D);
      object.value.visible = false;
    });

    var dissolvingLanes = this.queries.dissolvingLanes.results;
    for (let i = 0; i < dissolvingLanes.length; i++) {
      var entity = dissolvingLanes[i];
      var dissolve = entity.getMutableComponent(Dissolve);
      var mesh = entity.getComponent(Object3D).value;
      let material = mesh.material;
      if (!material) {
        continue;
      }

      if (dissolve.type === 0) {
        if (material.dissolve) {
          material.emissive.r = dissolve.value;
        }
      } else {
        if (material.dissolve) {
          material.emissive.g = dissolve.value;
        }
      }

      mesh.material.opacity = dissolve.value * 2;
      mesh.material.transparent = true;

      dissolve.value -= delta * dissolve.speed;
      if (dissolve.value <= 0) {
        mesh.material.opacity = 1;
        entity.removeComponent(Dissolve);
        entity.removeComponent(Active);
        mesh.material.transparent = false;
        mesh.visible = false;
      }
    }
  }
}

LaneSystem.queries = {
  lanes: {
    components: [Lane, Object3D],
    listen: {
      added: true
    }
  },
  activeLanes: {
    components: [Lane, Object3D, Active],
    listen: {
      added: true
    }
  },
  inactiveLanes: {
    components: [Lane, Object3D, Not(Active)],
    listen: {
      added: true
    }
  },
  dissolvingLanes: {
    components: [Lane, Dissolve, Object3D, Active]
  }
};
