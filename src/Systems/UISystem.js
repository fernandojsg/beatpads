import { System } from "ecsy";
import * as THREE from "three";
import TWEEN from "../vendor/tween.module.min.js";

import { Position, Text } from "ecsy-three";
import {
  UI,
  Sound,
  Button,
  RaycastReceiver,
  Object3DComponent
} from "../Components/components.js";

function setColor(object, color) {
  object.traverse(child => {
    if (child.material) {
      child.material.color.setRGB(color, color, color);
    }
  });
}

export class UISystem extends System {
  execute() {
    TWEEN.update();

    const entities = this.queries.entities;

    for (let i = 0; i < entities.added.length; i++) {
      const entity = entities.added[i];
      const button = entity.getComponent(Button);

      //let child = this.world.createEntity();
      let child2 = this.world.createEntity();

      entity
        .addObject3DComponents(new THREE.Group())
        .addComponent(RaycastReceiver, {
          layerMask: 4,
          onHover: () => {},
          onEnter: () => {
            let obj = entity.getComponent(Object3DComponent).value;
            setColor(obj, 1);
            var tween = new TWEEN.Tween(obj.scale)
              .to(
                {
                  x: 1.1,
                  y: 1.1,
                  z: 1.1
                },
                500
              )
              .onUpdate(() => {})
              .easing(TWEEN.Easing.Quadratic.Out)
              .start();
          },
          onLeave: () => {
            let obj = entity.getComponent(Object3DComponent).value;
            setColor(obj, 0.7);
            var tween = new TWEEN.Tween(obj.scale)
              .to(
                {
                  x: 1,
                  y: 1,
                  z: 1
                },
                300
              )
              .onUpdate(() => {})
              .easing(TWEEN.Easing.Quadratic.Out)
              .start();
          },
          onSelectStart: () => {
            let obj = entity.getComponent(Object3DComponent).value;
            setColor(obj, 1);

            setTimeout(() => {
              setColor(obj, 0.7);
            }, 300);

            var tween = new TWEEN.Tween(obj.scale)
              .to(
                {
                  x: 1.2,
                  y: 1.2,
                  z: 1.2
                },
                100
              )
              .repeat(1)
              //.delay(500)
              .yoyo(true)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start()
              .onComplete(() => {
                button.onClick && button.onClick();
              });

            if (entity.hasComponent(Sound)) {
              entity.getComponent(Sound).sound.play();
            }
          }
        });

      child2
        .addComponent(Text, {
          color: "#999",
          font: "assets/fonts/WetinCaroWant.ttf",
          fontSize: 0.09,
          anchor: "center",
          textAlign: "center",
          baseline: "center",
          maxWidth: 10,
          lineHeight: 0,
          text: button.text
        })
        .addComponent(Position, { value: new THREE.Vector3(0, 0.03, 0.01) });
      //.addComponent(Parent, { value: entity });
    }
  }
}

UISystem.queries = {
  entities: {
    components: [UI, Button],
    listen: {
      added: true,
      removed: true,
      changed: true // [UI]
    }
  }
};
