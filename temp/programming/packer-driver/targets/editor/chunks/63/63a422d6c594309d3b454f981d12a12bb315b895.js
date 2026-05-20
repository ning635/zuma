System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Vec3, instantiate, Prefab, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _crd, ccclass, property, ZumaPathManager;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Node = _cc.Node;
      Vec3 = _cc.Vec3;
      instantiate = _cc.instantiate;
      Prefab = _cc.Prefab;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c64bfAVepdFfZiPtLS09w/w", "ZumaCurvePath.ts%2018-56-51-708", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'instantiate', 'Prefab']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("ZumaPathManager", ZumaPathManager = (_dec = ccclass('ZumaPathManager'), _dec2 = property(Node), _dec3 = property(Prefab), _dec(_class = (_class2 = class ZumaPathManager extends Component {
        constructor(...args) {
          super(...args);

          // 路径点列表（按顺序拖入）
          _initializerDefineProperty(this, "pathPoints", _descriptor, this);

          // 小球预制体
          _initializerDefineProperty(this, "ballPrefab", _descriptor2, this);

          // 一次生成多少个球
          //这里的数量以inspector中的数量为准
          _initializerDefineProperty(this, "spawnCount", _descriptor3, this);

          // 移动速度
          _initializerDefineProperty(this, "moveSpeed", _descriptor4, this);

          //0.005
          // 球之间间距
          _initializerDefineProperty(this, "ballSpacing", _descriptor5, this);

          //0.022
          this.balls = [];
          this.ballPositions = [];
        }

        start() {
          this.spawnBalls();
        } // 生成一串小球


        spawnBalls() {
          for (let i = 0; i < this.spawnCount; i++) {
            const ball = instantiate(this.ballPrefab[i % this.ballPrefab.length]);
            ball.setParent(this.node.parent); // 每个球错开位置，形成排队

            const startT = -i * this.ballSpacing;
            this.balls.push(ball);
            this.ballPositions.push(startT);
          }
        }

        update(dt) {
          for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            let t = this.ballPositions[i % this.balls.length];
            t += this.moveSpeed * dt * 60;
            if (t > 1) t = 0;
            this.ballPositions[i] = t;
            const pos = this.getPointByT(t);
            ball.setPosition(pos);
          }
        } // 核心：根据 t 获取路径上的坐标（支持无限点）


        getPointByT(t) {
          const segments = this.pathPoints.length - 1;
          if (segments < 1) return Vec3.ZERO; //只有一个点 那就放在原点

          const totalT = 1;
          const seg = Math.floor(t * segments);
          const localT = t * segments % 1;
          const p0 = this.pathPoints[seg].position; //这段代码是有bug的，但是t和seg与速度相关，当生成数量为5时，速度为0.005时，基本上不会出现越界问题，所以暂时不修复了

          const p1 = this.pathPoints[seg + 1].position;
          const dir = new Vec3();
          Vec3.subtract(dir, p1, p0);
          dir.multiplyScalar(localT);
          const result = new Vec3();
          Vec3.add(result, p0, dir);
          return result;
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
//# sourceMappingURL=63a422d6c594309d3b454f981d12a12bb315b895.js.map