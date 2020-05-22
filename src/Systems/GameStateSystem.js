import { System } from "ecsy";
import { levels } from "../levels.js";
import { Text } from "ecsy-three";
import * as THREE from "three";
import {
  BallGenerator,
  Dissolve,
  Sound,
  Stop,
  Object3D,
  Raycaster,
  Play,
  Visible,
  Target,
  Cleared,
  Active,
  Level,
  Ball,
  FloorCollided,
  GameState
} from "../Components/components.js";
import { LevelManager } from "../Systems/systems.mjs";

export class GameStateSystem extends System {
  setVisibilityByName(name, value) {
    let entity = this.world.entityManager.getEntityByName(name);
    if (entity) {
      entity.getMutableComponent(Visible).value = value;
    }
  }

  finish() {
    this.stopGame();
    // Remove level
    this.setVisibilityByName("startbutton", true);
    this.setVisibilityByName("finished", true);
    this.setVisibilityByName("playingGroup", false);
    this.world.getSystem(LevelManager).clearCurrentLevel();
    this.world.entityManager
      .getEntityByName("singleton")
      .getMutableComponent(Level).value = 1;

    this.queries.raycasters.results.forEach(entity => {
      entity.getMutableComponent(Raycaster).layerMask = 4;
    });
/*
    let panelInfoEntity = this.world.entityManager.getEntityByName("panelInfo");
    panelInfoEntity.addComponent(Play);
    let panel = panelInfoEntity.getComponent(Object3D).value.children[0];

    if (!panel.userData.oldPosition) {
      panel.userData.oldPosition = new THREE.Vector3();
    }
    panel.userData.oldPosition.copy(panel.position);
    panel.position.set(0, 1.6, -2);
    panel.scale.set(3, 3, 3);
    */
  }

  playGame() {
    let gameState = this.queries.gameState.results[0].getMutableComponent(
      GameState
    );

    if (gameState.playing) {
      return;
    }

    this.setVisibilityByName("help", false);
    this.setVisibilityByName("startbutton", false);
    this.setVisibilityByName("finished", false);
    this.setVisibilityByName("playingGroup", true);
    //this.setVisibilityByName("panelInfo", true);

    this.queries.raycasters.results.forEach(entity => {
      entity.getMutableComponent(Raycaster).layerMask = 2;
    });

    gameState.playing = true;
    gameState.numBallsFailed = 0;
    gameState.numBallsTotal = 0;
    gameState.levelStartTime = performance.now();
    gameState.gameStartTime = performance.now();

    this.updateTexts(gameState);

    this.queries.ballGenerators.results.forEach(generator => {
      generator.addComponent(Active);
    });
/*
    let panelInfoEntity = this.world.entityManager.getEntityByName("panelInfo");
    panelInfoEntity.addComponent(Stop);
    let panel = panelInfoEntity.getComponent(Object3D);
    if (panel) {
      panel = panel.value.children[0];
      if (panel.userData.oldPosition) {
        panel.position.copy(panel.userData.oldPosition);
      }
      panel.scale.set(1, 1, 1);
    }
*/
  }

  updateTexts(gameState) {
    let entity = this.world.entityManager.getEntityByName("numberBalls");

    if (entity) {
      entity.getMutableComponent(
        Text
      ).text = `${gameState.numBallsFailed}/${gameState.numBallsTotal}`;
    }
  }

  stopGame() {
    this.queries.gameState.results[0].getMutableComponent(
      GameState
    ).playing = false;
  }

  execute() {
    var gameState = this.queries.gameState.results[0].getComponent(GameState);
    if (!gameState.playing) {
      return;
    }

    let elapsedTimeCurrent = performance.now() - gameState.levelStartTime;
    let elapsedTimeTotal = performance.now() - gameState.gameStartTime;

    let worldSingleton = this.world.entityManager.getEntityByName("singleton");

    let timer = this.world.entityManager.getEntityByName("timer");
    if (timer) {
      timer.getMutableComponent(Text).text = new Date(elapsedTimeCurrent)
        .toISOString()
        .substr(14, 5);
    }

    let timerTotal = this.world.entityManager.getEntityByName("timerTotal");
    if (timerTotal) {
      timerTotal.getMutableComponent(Text).text = new Date(elapsedTimeTotal)
        .toISOString()
        .substr(14, 5);
    }

    // If a ball collided with the floor, reactivate the generator to throw another ball
    this.queries.ballFloorCollided.added.forEach(ball => {
      // @todo this.component.numBallsFailed++
      gameState.numBallsFailed++;

      this.world.entityManager
        .getEntityByName("numberBalls")
        .getMutableComponent(
          Text
        ).text = `${gameState.numBallsFailed}`;

      // @todo here we should just activate the collided ball's generator
      // Wait 2s before reactivating the ball generator
      let currentLevel = worldSingleton.getComponent(Level).value;

      this.queries.ballGenerators.results.forEach(generator => {
        generator.addComponent(Play);
      });

      setTimeout(() => {
        if (worldSingleton.getComponent(Level).value !== currentLevel) {
          return;
        }
        this.queries.ballGenerators.results.forEach(generator => {
          generator.addComponent(Active);
        });
      }, 1900);

      setTimeout(() => {
        if (
          !ball ||
          !ball.alive ||
          worldSingleton.getComponent(Level).value !== currentLevel
        ) {
          return;
        }
      }, 2000);

      ball.addComponent(Dissolve);
    });

    this.queries.targetCleared.added.forEach(entity => {
      entity.getComponent(Sound).sound.play();

      setTimeout(() => {
        var levelComponent = worldSingleton.getMutableComponent(Level);
        if (levelComponent.value === levels.length - 1) {
          levelComponent.value = 1;
          this.finish();
        } else {
          levelComponent.value++;
          gameState.levelStartTime = performance.now();

          gameState.levelFinished = false;
        }
      }, 2000);

      // threeContext.scene.background.set(0x00ff00);
      gameState.levelFinished = true;
    });
  }
}

GameStateSystem.queries = {
  ballGenerators: { components: [BallGenerator] },
  gameState: {
    components: [GameState],
    listen: {
      changed: true
    }
  },
  ballFloorCollided: {
    components: [Ball, FloorCollided],
    listen: {
      added: true
    }
  },
  targetCleared: {
    components: [Target, Cleared],
    listen: {
      added: true
    }
  },
  raycasters: {
    components: [Raycaster]
  }
};
