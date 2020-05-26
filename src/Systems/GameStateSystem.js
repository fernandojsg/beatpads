import { System } from "ecsy";
import { Text } from "ecsy-three";
import TWEEN from "../vendor/tween.module.min.js";
import {
  Dissolve,
  Sounds,
  Raycaster,
  Object3D,
  Visible,
  Collided,
  Missed,
  Level,
  GameState,
  Active
} from "../Components/components.js";
import { LevelManager } from "../Systems/systems.mjs";

/**
 * All the game state is controlled here:
 * - the change between game states: start, playing and game over
 * - update the score
 * - compute the score and reaction when a pads is missed or collided
 */
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
    let entity = this.world.entityManager.getEntityByName("stats");

    if (entity) {
      entity.getMutableComponent(
        Text
      ).text = `Life: ${gameState.life}\nPoints: ${gameState.points}\nCombo: ${gameState.combo}x\nFailures: ${gameState.failures}`;
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

    this.queries.padsCollided.added.forEach(pad => {
      pad.addComponent(Dissolve, {
        type: 1,
        speed: 2
      });

      let sounds = pad.getComponent(Sounds);
      sounds.playSound("hit");

      let gameState = this.queries.gameState.results[0].getMutableComponent(
        GameState
      );

      gameState.life++;
      gameState.points += gameState.combo;
      gameState.combo++;
      if (gameState.combo > 8) {
        gameState.combo = 8;
      }

      this.updateTexts(gameState);
    });

    this.queries.padsMissed.added.forEach(pad => {
      pad.addComponent(Dissolve, {
        type: 0,
        speed: 2
      });

      let sounds = pad.getComponent(Sounds);
      if (sounds) {
        sounds.playSound("miss");
      }

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
        this.finish();
      }

      this.updateTexts(gameState);
    });
  }
}

GameStateSystem.queries = {
  padsMissed: {
    components: [Missed],
    listen: {
      added: true
    }
  },
  padsCollided: {
    components: [Collided],
    listen: {
      added: true
    }
  },
  gameState: {
    components: [GameState],
    listen: {
      changed: true
    }
  },
  raycasters: {
    components: [Raycaster]
  }
};
