System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Collider2D, Contact2DType, director, ball, ZumaCurvePath, control, _dec, _class, _crd, ccclass, BallCollision;

  function _reportPossibleCrUseOfball(extras) {
    _reporterNs.report("ball", "./ball", _context.meta, extras);
  }

  function _reportPossibleCrUseOfZumaCurvePath(extras) {
    _reporterNs.report("ZumaCurvePath", "./ZumaCurvePath", _context.meta, extras);
  }

  function _reportPossibleCrUseOfcontrol(extras) {
    _reporterNs.report("control", "./Control", _context.meta, extras);
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
      Collider2D = _cc.Collider2D;
      Contact2DType = _cc.Contact2DType;
      director = _cc.director;
    }, function (_unresolved_2) {
      ball = _unresolved_2.ball;
    }, function (_unresolved_3) {
      ZumaCurvePath = _unresolved_3.ZumaCurvePath;
    }, function (_unresolved_4) {
      control = _unresolved_4.control;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "a87bbdHcyBF57gThWPlZjqa", "BallCollision", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Collider2D', 'Contact2DType', 'director', 'Node']);

      ({
        ccclass
      } = _decorator);

      _export("BallCollision", BallCollision = (_dec = ccclass('BallCollision'), _dec(_class = class BallCollision extends Component {
        onLoad() {
          const collider = this.getComponent(Collider2D);
          collider == null || collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }

        onBeginContact(_, other) {
          var _director$getScene, _director$getScene2, _bulletNode$getCompon;

          console.log("碰撞发生了");
          const selfBall = this.node.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball);
          const otherBall = other.node.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball);
          const selfIsBullet = !!(selfBall != null && selfBall.isbullet);
          const otherIsBullet = !!(otherBall != null && otherBall.isbullet);

          if (selfIsBullet === otherIsBullet) {
            return;
          } //好垃圾的代码可读性，说白了就是确定哪个是轨道球，哪个是子弹


          const bulletNode = selfIsBullet ? this.node : other.node;
          const hitNode = selfIsBullet ? other.node : this.node;
          const path = (_director$getScene = director.getScene()) == null ? void 0 : _director$getScene.getComponentInChildren(_crd && ZumaCurvePath === void 0 ? (_reportPossibleCrUseOfZumaCurvePath({
            error: Error()
          }), ZumaCurvePath) : ZumaCurvePath);
          const shooter = (_director$getScene2 = director.getScene()) == null ? void 0 : _director$getScene2.getComponentInChildren(_crd && control === void 0 ? (_reportPossibleCrUseOfcontrol({
            error: Error()
          }), control) : control);
          shooter == null || shooter.removeActiveBall(bulletNode);
          path == null || path.handleBulletCollision(bulletNode, hitNode);
          (_bulletNode$getCompon = bulletNode.getComponent(_crd && ball === void 0 ? (_reportPossibleCrUseOfball({
            error: Error()
          }), ball) : ball)) == null || _bulletNode$getCompon.setBullet(false);
        }

        onDestroy() {
          const collider = this.getComponent(Collider2D);
          collider == null || collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=ada23b974e8a065d1d231e26150813354d287256.js.map