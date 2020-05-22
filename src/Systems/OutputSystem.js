/* global THREE */
import { System } from "ecsy";
import { Element, BallGenerator, Target, Object3D } from "../Components/components.js";

export class OutputSystem extends System {

  trimDecimals(v) {
    v.x = Math.floor(v.x * 10) / 10;
    v.y = Math.floor(v.y * 10) / 10;
    v.z = Math.floor(v.z * 10) / 10;
  }

  outputJSON() {
    var json = {
      targets: [],
      generators: [],
      elements: []
    };

    this.queries.elements.results.forEach(entity => {
      var item = {};
      var element = entity.getComponent(Element);
      item.type = element.type;

      var object = entity.getComponent(Object3D).value; // @todo Transform
      item.position = JSON.parse(JSON.stringify(object.position));
      item.rotation = {
        x: object.rotation._x,
        y: object.rotation._y,
        z: object.rotation._z
      };

      this.trimDecimals(item.position);
      this.trimDecimals(item.rotation);

      json.elements.push(item);
    });

    this.queries.targets.results.forEach(entity => {
      var item = {};
      var object = entity.getComponent(Object3D).value; // @todo Transform
      item.position = JSON.parse(JSON.stringify(object.position));
      item.rotation = {
        x: object.rotation._x,
        y: object.rotation._y,
        z: object.rotation._z
      };

      this.trimDecimals(item.position);
      this.trimDecimals(item.rotation);

      json.targets.push(item);
    });

    this.queries.generators.results.forEach(entity => {
      var item = {};
      var generator = entity.getComponent(BallGenerator);
      var object = entity.getComponent(Object3D).value; // @todo Transform
      item.position = JSON.parse(JSON.stringify(object.position));
      item.linearVelocity = generator.linearVelocity;

      this.trimDecimals(item.position);
      this.trimDecimals(item.linearVelocity);

      json.generators.push(item);
    });

    console.log(JSON.stringify(json, null, 2));
  }

  execute() {}
}

OutputSystem.queries = {
  elements: { components: [Element] },
  targets: { components: [Target] },
  generators: { components: [BallGenerator] }
};
