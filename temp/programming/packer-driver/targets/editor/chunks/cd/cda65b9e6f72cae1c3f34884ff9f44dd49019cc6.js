System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, input, Input, EventMouse, Collider2D, Vec3, Camera, Graphics, Color, UITransform, Node, Prefab, instantiate, director, ball, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _crd, ccclass, property, control;

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
      input = _cc.input;
      Input = _cc.Input;
      EventMouse = _cc.EventMouse;
      Collider2D = _cc.Collider2D;
      Vec3 = _cc.Vec3;
      Camera = _cc.Camera;
      Graphics = _cc.Graphics;
      Color = _cc.Color;
      UITransform = _cc.UITransform;
      Node = _cc.Node;
      Prefab = _cc.Prefab;
      instantiate = _cc.instantiate;
      director = _cc.director;
    }, function (_unresolved_2) {
      ball = _unresolved_2.ball;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "795a0C+E15IQ54pzoNMPIih", "Control", undefined);

      __checkObsolete__(['_decorator', 'Component', 'input', 'Input', 'EventMouse', 'Collider2D', 'Vec3', 'Camera', 'Graphics', 'Color', 'UITransform', 'Node', 'Prefab', 'instantiate', 'director']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("control", control = (_dec = ccclass('control'), _dec2 = property({
        type: [Prefab],
        tooltip: "球预制体列表"
      }), _dec3 = property(Camera), _dec4 = property({
        tooltip: "发射速度"
      }), _dec5 = property({
        tooltip: "准星 + 虚线 同比例缩放"
      }), _dec(_class = (_class2 = class control extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "balls", _descriptor, this);

          _initializerDefineProperty(this, "mainCam", _descriptor2, this);

          _initializerDefineProperty(this, "shootSpeed", _descriptor3, this);

          _initializerDefineProperty(this, "lineScale", _descriptor4, this);

          this.mouseWorld = new Vec3();
          this.hasMouseEntered = false;
          this.drawNode = null;
          this.graphics = null;
          this.activeBalls = [];
          this.previewNode = null;
          this.previewIndex = -1;
        }

        onLoad() {
          input.on(Input.EventType.MOUSE_MOVE, this.setMousePos, this);
          input.on(Input.EventType.MOUSE_DOWN, this.shootBall, this);
          this.drawNode = new Node("AimLine");
          this.node.parent.addChild(this.drawNode);
          this.drawNode.addComponent(UITransform);
          this.graphics = this.drawNode.addComponent(Graphics); // 在鼠标点击之前先随机生成一个预览的球体，放在发射器位置

          this.spawnPreview();
        } // 生成下一个预览球体并放置在发射器位置


        spawnPreview() {
          if (this.balls.length === 0) return;
          this.previewIndex = Math.floor(Math.random() * this.balls.length);
          const prefab = this.balls[this.previewIndex];
          if (!prefab) return;

          if (this.previewNode && this.previewNode.isValid) {
            this.previewNode.destroy();
          }

          this.previewNode = instantiate(prefab);
          const col = this.previewNode.getComponent(Collider2D);
          col.group = 1 << 2;
          this.previewNode.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball).setBullet(true);
          this.node.parent.addChild(this.previewNode);
          this.previewNode.setWorldPosition(this.node.worldPosition.x, this.node.worldPosition.y - 2, 0);
        }

        update() {
          // 🔥 更新所有发射出的小球位置
          const dt = director.getDeltaTime();

          for (let i = this.activeBalls.length - 1; i >= 0; i--) {
            const ball = this.activeBalls[i];

            if (ball.node.isValid) {
              const pos = ball.node.position;
              ball.node.setPosition(pos.x + ball.dir.x * this.shootSpeed * dt, pos.y + ball.dir.y * this.shootSpeed * dt, pos.z); // 超出一定范围后自动销毁，防止内存泄漏

              if (pos.length() > 3000) {
                ball.node.destroy();
                this.activeBalls.splice(i, 1);
              }
            } else {
              this.activeBalls.splice(i, 1);
            }
          }

          if (!this.mainCam || !this.hasMouseEntered) return;
          const selfPos = this.node.worldPosition;
          const dx = this.mouseWorld.x - selfPos.x;
          const dy = this.mouseWorld.y - selfPos.y;
          let angle = Math.atan2(dy, dx) * 180 / Math.PI;
          this.node.angle = angle - 90;

          if (this.graphics && this.drawNode.parent) {
            this.graphics.clear();
            this.graphics.strokeColor = new Color(128, 0, 128, 255); // 🔥 线条粗细跟随比例

            this.graphics.lineWidth = 2 * this.lineScale;
            const uiTransform = this.drawNode.parent.getComponent(UITransform);

            if (uiTransform) {
              const localSelf = uiTransform.convertToNodeSpaceAR(selfPos);
              const localMouse = uiTransform.convertToNodeSpaceAR(this.mouseWorld); // 🔥 虚线样式全部按比例缩放

              const dashLen = 15 * this.lineScale;
              const spaceLen = 10 * this.lineScale;
              let currentLen = 0;
              const dir = new Vec3();
              Vec3.subtract(dir, localMouse, localSelf);
              dir.normalize();
              const distance = Vec3.distance(localSelf, localMouse);

              while (currentLen < distance) {
                const fromPos = new Vec3();
                const toPos = new Vec3();
                Vec3.scaleAndAdd(fromPos, localSelf, dir, currentLen);
                const nextLen = Math.min(currentLen + dashLen, distance);
                Vec3.scaleAndAdd(toPos, localSelf, dir, nextLen);
                this.graphics.moveTo(fromPos.x, fromPos.y);
                this.graphics.lineTo(toPos.x, toPos.y);
                currentLen += dashLen + spaceLen;
              }

              const crossSize = 10 * this.lineScale;
              this.graphics.moveTo(localMouse.x - crossSize, localMouse.y);
              this.graphics.lineTo(localMouse.x + crossSize, localMouse.y);
              this.graphics.moveTo(localMouse.x, localMouse.y - crossSize);
              this.graphics.lineTo(localMouse.x, localMouse.y + crossSize);
              this.graphics.stroke();
            }
          }
        }

        removeActiveBall(targetNode) {
          for (let i = this.activeBalls.length - 1; i >= 0; i--) {
            if (this.activeBalls[i].node === targetNode) {
              this.activeBalls.splice(i, 1);
              break;
            }
          }
        }

        setMousePos(e) {
          this.hasMouseEntered = true;
          this.mainCam.screenToWorld(this.mouseWorld.set(e.getLocationX(), e.getLocationY(), 0), this.mouseWorld);
        }

        shootBall(e) {
          if (e.getButton() !== EventMouse.BUTTON_LEFT || this.balls.length === 0) return; // 获取发射方向 (鼠标方向)

          const selfPos = this.node.worldPosition;
          const targetWorld = new Vec3();
          this.mainCam.screenToWorld(targetWorld.set(e.getLocationX(), e.getLocationY(), 0), targetWorld);
          const dx = targetWorld.x - selfPos.x;
          const dy = targetWorld.y - selfPos.y;
          const dir = new Vec3(dx, dy, 0);
          dir.normalize(); // 如果存在预览节点，则将其作为发射球使用，否则随机实例化一个

          let ballNode;

          if (this.previewNode) {
            ballNode = this.previewNode;
            this.previewNode = null;
          } else {
            const index = Math.floor(Math.random() * this.balls.length);
            const prefab = this.balls[index];
            if (!prefab) return;
            ballNode = instantiate(prefab);
            this.node.parent.addChild(ballNode);
            ballNode.setWorldPosition(selfPos);
          }

          ballNode.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball).setBullet(true); //console.log(ballNode.getComponent(ball)!.BallColor);
          // 记录到数组中进行移动控制

          this.activeBalls.push({
            node: ballNode,
            dir: dir
          }); // 发射后立即随机并生成下一个预览球体

          this.spawnPreview();
        }

        onDestroy() {
          input.off(Input.EventType.MOUSE_MOVE, this.setMousePos, this);
          input.off(Input.EventType.MOUSE_DOWN, this.shootBall, this);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "balls", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "mainCam", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "shootSpeed", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 800;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "lineScale", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 1;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=cda65b9e6f72cae1c3f34884ff9f44dd49019cc6.js.map