import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { type ExpressionKey } from "../contexts/ExpressionContext";

interface ModelViewerProps {
  className: string;
  expression: ExpressionKey | null;
}

// カメラの初期位置を定数として定義
const INITIAL_CAMERA_POSITION = {
  x: 4,
  y: 0.5,
  z: 2
};

// カメラの初期ズーム設定を定数として定義
const INITIAL_CAMERA_ZOOM = {
  min: 1,
  max: 10,
  current: 2.2
};

// モデルの初期スケール設定を定数として定義
const INITIAL_MODEL_SCALE = {
  x: 0.02,
  y: 0.02,
  z: 0.02
};

// モデルの初期位置を定数として定義
const INITIAL_MODEL_POSITION = {
  x: 1,
  y: -0.8,
  z: 0
};

export function ModelViewer({ className, expression }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number>(null);
  const timeRef = useRef<number>(0);
  const isHappyRef = useRef<boolean>(false);
  const isSadRef = useRef<boolean>(false);

  // カメラの現在の相対位置を保持する参照
  const cameraOffsetRef = useRef({x: 0, y: 0, z: 0});
  // モデルの現在の相対スケールを保持する参照
  const modelScaleRef = useRef({x: 0, y: 0, z: 0});
  // モデルの現在の相対位置を保持する参照
  const modelPositionRef = useRef({x: 0, y: 0, z: 0});

  // モデルの表情を更新する関数
  const updateModelExpression = (model: THREE.Group, expression: ExpressionKey | null) => {
    if (!model) return;

    // 表情に応じてモデルの回転や位置を変更
    switch (expression) {
      case "happy":
        model.rotation.x = Math.PI / 12; // 少し上を向く
        model.position.set(
          INITIAL_MODEL_POSITION.x,
          INITIAL_MODEL_POSITION.y + 0.2,
          INITIAL_MODEL_POSITION.z
        );
        isHappyRef.current = true;
        break;
      case "sad":
        model.rotation.z = Math.PI / 2; // 横に倒れる
        model.position.set(
          INITIAL_MODEL_POSITION.x,
          INITIAL_MODEL_POSITION.y - 0.1,
          INITIAL_MODEL_POSITION.z
        );
        isSadRef.current = true;
        break;
      case "angry":
        model.rotation.z = Math.PI / 24; // 少し傾く
        model.position.set(
          INITIAL_MODEL_POSITION.x + 0.1,
          INITIAL_MODEL_POSITION.y,
          INITIAL_MODEL_POSITION.z
        ); // 少し横に動く
        break;
      case "surprised":
        model.position.set(
          INITIAL_MODEL_POSITION.x,
          INITIAL_MODEL_POSITION.y + 0.3,
          INITIAL_MODEL_POSITION.z
        ); // 大きく跳ねる
        model.scale.set(
          INITIAL_MODEL_SCALE.x * 1.2,
          INITIAL_MODEL_SCALE.y * 1.2,
          INITIAL_MODEL_SCALE.z * 1.2
        );
        break;
      case "fearful":
        model.scale.set(
          INITIAL_MODEL_SCALE.x * 0.8,
          INITIAL_MODEL_SCALE.y * 0.8,
          INITIAL_MODEL_SCALE.z * 0.8
        );
        model.position.set(
          INITIAL_MODEL_POSITION.x,
          INITIAL_MODEL_POSITION.y - 0.2,
          INITIAL_MODEL_POSITION.z
        ); // 下がる
        break;
      case "disgusted":
        model.rotation.z = -Math.PI / 24; // 反対に傾く
        model.position.set(
          INITIAL_MODEL_POSITION.x - 0.1,
          INITIAL_MODEL_POSITION.y,
          INITIAL_MODEL_POSITION.z
        ); // 反対に動く
        break;
      default:
        // neutral, noface, error, nullの場合は初期状態に戻す
        model.rotation.set(0, Math.PI / 4, 0);
        model.position.set(
          INITIAL_MODEL_POSITION.x,
          INITIAL_MODEL_POSITION.y,
          INITIAL_MODEL_POSITION.z
        );
        model.scale.set(
          INITIAL_MODEL_SCALE.x,
          INITIAL_MODEL_SCALE.y,
          INITIAL_MODEL_SCALE.z
        );
        break;
    }
  };

  // シーンのセットアップ（初回のみ）
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // シーン、カメラ、レンダラーを作成
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(
      INITIAL_CAMERA_POSITION.x,
      INITIAL_CAMERA_POSITION.y,
      INITIAL_CAMERA_POSITION.z
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    // OrbitControlsを追加
    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true; // スムーズな動きを有効化
    controls.dampingFactor = 0.05; // 減衰係数
    controls.minDistance = INITIAL_CAMERA_ZOOM.min; // 最小ズーム距離
    controls.maxDistance = INITIAL_CAMERA_ZOOM.max; // 最大ズーム距離
    controls.enablePan = true; // パン（平行移動）を有効化
    controls.autoRotate = false; // 自動回転を無効化
    controlsRef.current = controls;

    // 照明を追加
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(1, 2, 3).normalize();
    scene.add(light);

    // 環境光を追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // ローディングマネージャーを作成
    const manager = new THREE.LoadingManager();
    manager.onError = (url) => {
      console.error("Error loading", url);
    };

    // MTLローダーでマテリアルをロード
    const mtlLoader = new MTLLoader(manager);
    mtlLoader.setPath("/assets/obj/");
    mtlLoader.load("rabbit.mtl", (materials) => {
      materials.preload();

      // OBJローダーでモデルをロード
      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(materials);
      objLoader.setPath("/assets/obj/");
      objLoader.load("rabbit.obj", (object) => {
        modelRef.current = object;

        // モデルのスケールと位置を調整
        object.scale.set(
          INITIAL_MODEL_SCALE.x,
          INITIAL_MODEL_SCALE.y,
          INITIAL_MODEL_SCALE.z
        );
        object.position.set(
          INITIAL_MODEL_POSITION.x,
          INITIAL_MODEL_POSITION.y,
          INITIAL_MODEL_POSITION.z
        );
        object.rotation.y = Math.PI / 4;

        scene.add(object);

        // カメラの位置を調整
        camera.position.set(
          INITIAL_CAMERA_POSITION.x + cameraOffsetRef.current.x,
          INITIAL_CAMERA_POSITION.y + cameraOffsetRef.current.y,
          INITIAL_CAMERA_POSITION.z + cameraOffsetRef.current.z
        );
        camera.lookAt(new THREE.Vector3(0, 0.5, 0));

        // コントロールの中心をモデルの少し上に設定
        controls.target.set(0, 1, 0);
        controls.update();
      });
    });

    // 環境マップの読み込み
    const exrLoader = new EXRLoader();
    exrLoader.load("/assets/exr/meadow.exr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
      scene.environment = texture;
    });

    // アニメーションループ
    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Happyの時の跳ねるアニメーション
      if (isHappyRef.current && modelRef.current) {
        timeRef.current += 0.05;
        const bounce = Math.sin(timeRef.current * 5) * 0.1;
        modelRef.current.position.y = bounce + 0.2;
      }

      // Sadの時のジタバタアニメーション
      if (isSadRef.current && modelRef.current) {
        timeRef.current += 0.05;
        // 小刻みな回転の揺れ
        const wiggleRotation = Math.sin(timeRef.current * 15) * 0.1;
        modelRef.current.rotation.z = Math.PI / 2 + wiggleRotation;

        // 小刻みな位置の揺れ
        const wigglePosition = Math.sin(timeRef.current * 20) * 0.05;
        modelRef.current.position.x = wigglePosition;
        modelRef.current.position.y = -0.1 + Math.abs(Math.sin(timeRef.current * 10) * 0.05);
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }

    animate();

    // ウィンドウリサイズ時の処理
    function handleResize() {
      if (!containerRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }

      if (rendererRef.current) {
        rendererRef.current.setSize(width, height);
      }
    }

    window.addEventListener("resize", handleResize);

    // クリーンアップ関数
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // 依存配列を空にして初回のみ実行

  // 表情の更新
  useEffect(() => {
    if (modelRef.current) {
      // 表情が変わった時にアニメーションの状態をリセット
      timeRef.current = 0;
      isHappyRef.current = false;
      isSadRef.current = false;
      updateModelExpression(modelRef.current, expression);
    }
  }, [expression, updateModelExpression]); // expressionが変更されたときのみ実行

  return (
    <div className={`${className} relative`} ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
