import * as THREE from "three";
import {
    FBXLoader,
    GLTFLoader,
    OrbitControls,
} from "three/examples/jsm/Addons.js";

export class BasicWorld {
    private _threejs: THREE.WebGLRenderer;
    private _camera: THREE.PerspectiveCamera;
    private _scene: THREE.Scene;
    private _mixer!: THREE.AnimationMixer;
    private _clock: THREE.Clock;

    constructor() {
        // creating a webgl renderer
        this._threejs = new THREE.WebGLRenderer();

        // enabling shadows
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;

        // telling three.js about the screen
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);

        // attaching threejs to the index.html
        document.body.appendChild(this._threejs.domElement);

        // changing the dom element if screen changes size
        window.addEventListener("resize", () => {
            this._OnWindowResize();
        });

        // camera values
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, 100, -100);

        // the 3d world
        this._scene = new THREE.Scene();

        // adding some light to that world

        const light = new THREE.DirectionalLight(0xffffff, 3.0);
        light.position.set(100, 100, 100);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.01;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 1.0;
        light.shadow.camera.far = 500;
        light.shadow.camera.left = 200;
        light.shadow.camera.right = -200;
        light.shadow.camera.top = 200;
        light.shadow.camera.bottom = -200;
        this._scene.add(light);

        const l2 = new THREE.AmbientLight(0x101010);
        this._scene.add(l2);

        // adding controls
        const controls = new OrbitControls(
            this._camera,
            this._threejs.domElement
        );
        controls.target.set(0, 10, 0);
        controls.update();

        // loading in a skybox
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            "/px.png",
            "/nx.png",
            "/py.png",
            "/ny.png",
            "/pz.png",
            "/nz.png",
        ]);
        this._scene.background = texture;

        // adding a plane
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial({
                color: 0x808080,
            })
        );
        box.position.set(0, 1, 0);
        box.castShadow = true;
        box.receiveShadow = true;
        //this._scene.add(box);

        // load a model
        //this._LoadModel("/Rocket ship.glb"); // Rocket ship by Poly by Google [CC-BY] (https://creativecommons.org/licenses/by/3.0/)
        this._LoadAnimatedModel();

        // adding a clock to help animate model
        this._clock = new THREE.Clock();

        // render funciton
        this._RAF();
    }

    private _LoadModel(path: string) {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            gltf.scene.traverse((obj) => {
                obj.castShadow = true;
            });
            this._scene.add(gltf.scene);
        });
    }

    private _LoadAnimatedModel() {
        const loader = new FBXLoader();
        loader.load("/mannequin/mannequin.fbx", (fbx) => {
            fbx.scale.setScalar(0.1);
            fbx.traverse((obj) => {
                obj.castShadow = true;
            });

            console.log("starting animation load");
            const aLoader = new FBXLoader();
            aLoader.load("/mannequin/Silly_Dancing.fbx", (anim) => {
                this._mixer = new THREE.AnimationMixer(fbx);
                const sillyDance = this._mixer.clipAction(anim.animations[0]);
                sillyDance.play();
            });
            this._scene.add(fbx);
            console.log("end of animation load");
        });
    }

    private _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    private _RAF() {
        requestAnimationFrame(() => {
            // callback
            this._threejs.render(this._scene, this._camera);

            if (this._mixer) {
                const delta = this._clock.getDelta();
                this._mixer.update(delta);
            }

            this._RAF();
        });
    }
}
