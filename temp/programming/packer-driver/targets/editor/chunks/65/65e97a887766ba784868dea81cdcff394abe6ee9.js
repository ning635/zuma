System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Vec3, instantiate, Prefab, Collider2D, ball, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _crd, ccclass, property, ZumaCurvePath;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfball(extras) {
    _reporterNs.report("ball", "./ball", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Node = _cc.Node;
      Vec3 = _cc.Vec3;
      instantiate = _cc.instantiate;
      Prefab = _cc.Prefab;
      Collider2D = _cc.Collider2D;
    }, function (_unresolved_2) {
      ball = _unresolved_2.ball;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c64bfAVepdFfZiPtLS09w/w", "ZumaCurvePath", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'instantiate', 'Prefab', 'Color', 'Collider2D']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("ZumaCurvePath", ZumaCurvePath = (_dec = ccclass('ZumaCurvePath'), _dec2 = property(Node), _dec3 = property(Prefab), _dec(_class = (_class2 = class ZumaCurvePath extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "pathPoints", _descriptor, this);

          _initializerDefineProperty(this, "ballPrefab", _descriptor2, this);

          _initializerDefineProperty(this, "spawnCount", _descriptor3, this);

          _initializerDefineProperty(this, "moveSpeed", _descriptor4, this);

          _initializerDefineProperty(this, "ballSpacing", _descriptor5, this);

          this.balls = [];
          this.ballPositions = [];
          this.reconnecting = false;
          this.reconnectFrontEndIndex = -1;
          this.reconnectBackStartIndex = -1;
          this.pathDistances = [];
          this.totalPathLength = 0;
        }

        start() {
          this.calculatePathDistances();
          this.spawnBalls();
        }

        calculatePathDistances() {
          this.pathDistances = [0];
          let total = 0;

          for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p0 = this.pathPoints[i].position;
            const p1 = this.pathPoints[i + 1].position;
            const dist = Vec3.distance(p0, p1);
            total += dist;
            this.pathDistances.push(total);
          }

          this.totalPathLength = total;
        }

        spawnBalls() {
          for (let i = 0; i < this.spawnCount; i++) {
            const ball = instantiate(this.ballPrefab[i % this.ballPrefab.length]);
            ball.setParent(this.node.parent);
            ball.active = false;
            const col = ball.getComponent(Collider2D);
            col.group = 1 << 1;
            const startT = -i * this.ballSpacing;
            this.balls.push(ball);
            this.ballPositions.push(startT);
          }
        }

        update(dt) {
          for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            if (!ball.isValid) continue;
            let t = this.ballPositions[i];
            t += this.moveSpeed * dt * 60;

            while (t > 1) t -= 1;

            this.ballPositions[i] = t;
            if (t < 0) continue;
            const pos = this.getPointByT(t);
            ball.active = true;
            ball.setPosition(pos);
          }

          this.updateReconnectGap(dt);
        } //处理碰撞插入新球


        handleBulletCollision(bulletNode, hitNode) {
          var _this$ballPositions$h;

          const col = bulletNode.getComponent(Collider2D);
          col.group = 1 << 1;
          const hitIndex = this.balls.indexOf(hitNode);
          if (hitIndex < 0) return;
          const bulletBall = bulletNode.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball);
          const hitBall = hitNode.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball);
          if (!bulletBall || !hitBall) return;
          const insertT = (_this$ballPositions$h = this.ballPositions[hitIndex]) != null ? _this$ballPositions$h : 0; //0类型为插入

          this.balls.splice(hitIndex, 0, bulletNode);
          this.ballPositions.splice(hitIndex, 0, insertT); // 0 到 hitIndex 之前的球也要往前推一个身位

          for (let i = 0; i <= hitIndex; i++) {
            this.ballPositions[i] += this.ballSpacing;
          }

          this.syncBallNodesFromIndex(0);
          this.resolveMatchFromIndex(hitIndex);
        } //调整球的位置


        syncBallNodesFromIndex(startIndex) {
          for (let i = startIndex; i < this.balls.length; i++) {
            const node = this.balls[i];
            if (!node || !node.isValid) continue;
            node.setPosition(this.getPointByT(this.ballPositions[i]));
          }
        } //消除功能


        resolveMatchFromIndex(index) {
          let checkIndex = index;

          while (this.balls.length > 0 && checkIndex >= 0 && checkIndex < this.balls.length) {
            const runStart = this.findSameColorRunStart(checkIndex);
            if (runStart < 0) break;
            const runEnd = this.findSameColorRunEnd(checkIndex);
            const runCount = runEnd - runStart + 1;
            if (runCount < 3) break;

            for (let i = runStart; i <= runEnd; i++) {
              const node = this.balls[i];
              if (node && node.isValid) node.destroy();
            }

            this.balls.splice(runStart, runCount);
            this.ballPositions.splice(runStart, runCount); // for (let i = runStart; i < this.ballPositions.length; i++) {
            //     this.ballPositions[i] -= this.ballSpacing * runCount;
            // }

            if (runStart > 0 && runStart < this.balls.length) {
              this.beginReconnectGap(runStart - 1, runStart);
            } else {
              this.reconnecting = false;
              this.reconnectFrontEndIndex = -1;
              this.reconnectBackStartIndex = -1;
            }

            checkIndex = Math.max(0, runStart - 1);
          }
        }

        beginReconnectGap(frontEndIndex, backStartIndex) {
          this.reconnecting = true;
          this.reconnectFrontEndIndex = frontEndIndex;
          this.reconnectBackStartIndex = backStartIndex;
        }

        updateReconnectGap(dt) {
          if (!this.reconnecting) {
            return;
          }

          if (this.reconnectFrontEndIndex < 0 || this.reconnectBackStartIndex < 0) {
            this.reconnecting = false;
            return;
          }

          if (this.reconnectFrontEndIndex >= this.balls.length || this.reconnectBackStartIndex >= this.balls.length) {
            this.reconnecting = false;
            return;
          }

          const step = this.moveSpeed * dt * 60;

          for (let i = 0; i <= this.reconnectFrontEndIndex; i++) {
            this.ballPositions[i] -= step;
          } // 只通过 ballPositions 判断后半段是否追上前半段


          const frontPos = this.ballPositions[this.reconnectFrontEndIndex];
          const backPos = this.ballPositions[this.reconnectBackStartIndex];
          let distanceAhead = frontPos - backPos;

          if (distanceAhead < 0) {
            distanceAhead += 1;
          }

          if (distanceAhead < this.ballSpacing) {
            this.reconnecting = false;
            this.reconnectFrontEndIndex = -1;
            this.reconnectBackStartIndex = -1;
          }

          this.syncBallNodesFromIndex(0);
        }

        wrapT(value) {
          while (value < 0) value += 1;

          while (value > 1) value -= 1;

          return value;
        }

        findSameColorRunStart(index) {
          if (index < 0 || index >= this.balls.length) return -1;
          const c = this.getBallColor(this.balls[index]);
          if (!c) return -1;
          let start = index;

          while (start > 0 && this.isSameColor(this.balls[start - 1], c)) start--;

          return start;
        }

        findSameColorRunEnd(index) {
          if (index < 0 || index >= this.balls.length) return -1;
          const c = this.getBallColor(this.balls[index]);
          if (!c) return -1;
          let end = index;

          while (end + 1 < this.balls.length && this.isSameColor(this.balls[end + 1], c)) end++;

          return end;
        }

        getBallColor(node) {
          var _node$getComponent$Ba, _node$getComponent;

          return (_node$getComponent$Ba = (_node$getComponent = node.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball)) == null ? void 0 : _node$getComponent.BallColor) != null ? _node$getComponent$Ba : null;
        }

        isSameColor(node, target) {
          const c = this.getBallColor(node);
          if (!c || !target) return false;
          return c.r === target.r && c.g === target.g && c.b === target.b && c.a === target.a;
        }

        getPointByT(t) {
          const segments = this.pathPoints.length - 1;
          if (segments < 1) return Vec3.ZERO;
          if (this.totalPathLength === 0) return this.pathPoints[0].position.clone();
          const targetDist = t * this.totalPathLength;

          if (targetDist < 0) {
            const p0 = this.pathPoints[0].position;
            const p1 = this.pathPoints[1].position;
            const dir = Vec3.subtract(new Vec3(), p0, p1);
            dir.normalize().multiplyScalar(-targetDist);
            return Vec3.add(new Vec3(), p0, dir);
          }

          if (targetDist > this.totalPathLength) {
            const p0 = this.pathPoints[segments - 1].position;
            const p1 = this.pathPoints[segments].position;
            const dir = Vec3.subtract(new Vec3(), p1, p0);
            dir.normalize().multiplyScalar(targetDist - this.totalPathLength);
            return Vec3.add(new Vec3(), p1, dir);
          }

          for (let i = 0; i < segments; i++) {
            if (targetDist <= this.pathDistances[i + 1]) {
              const p0 = this.pathPoints[i].position;
              const p1 = this.pathPoints[i + 1].position;
              const dSeg = this.pathDistances[i + 1] - this.pathDistances[i];
              const localT = dSeg > 0 ? (targetDist - this.pathDistances[i]) / dSeg : 0;
              return Vec3.lerp(new Vec3(), p0, p1, localT);
            }
          }

          return this.pathPoints[segments].position.clone();
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "pathPoints", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "ballPrefab", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "spawnCount", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 5;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "moveSpeed", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.005;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "ballSpacing", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 0.022;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=65e97a887766ba784868dea81cdcff394abe6ee9.js.map