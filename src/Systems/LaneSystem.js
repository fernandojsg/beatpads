import { System, Not } from "ecsy";
import * as THREE from "three";
import { levels } from "../levels.js";
import { Active, Lane, Object3D } from "../Components/components";

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
      const object = entity.getComponent(Object3D);
      object.value.visible = false;
    });
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
      added: true,
      removed: true
    }
  },
  inactiveLanes: {
    components: [Lane, Object3D, Not(Active)],
    listen: {
      added: true,
      removed: true
    }
  }
};
