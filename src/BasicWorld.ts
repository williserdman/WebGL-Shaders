import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

const _VS = `

varying vec3 v_Normal;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_Normal = normal;
}
`;
const _FS = `

uniform vec3 sphereColor;

varying vec3 v_Normal;

void main() {
    // gl_FragColor = vec4(v_Normal, 1.0);
    gl_FragColor = vec4(sphereColor, 1.0);
}
`;

export class BasicWorld {
    private _threejs: THREE.WebGLRenderer;
    private _camera: THREE.PerspectiveCamera;
    private _scene: THREE.Scene;
    private _clock: THREE.Clock;
    private _sphere: THREE.Mesh;

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
        this._camera.position.set(0, 20, 30);

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

        const l2 = new THREE.AmbientLight(0x404040);
        this._scene.add(l2);

        // adding controls
        const controls = new OrbitControls(
            this._camera,
            this._threejs.domElement
        );
        controls.target.set(0, 0, 0);
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

        // adding two spheres
        const s1 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        s1.position.set(-10, 5, 0);
        s1.castShadow = true;
        this._scene.add(s1);

        this._sphere = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.ShaderMaterial({
                uniforms: {
                    sphereColor: { value: new THREE.Vector3(0, 1, 0) },
                },
                vertexShader: _VS,
                fragmentShader: _FS,
            })
        );
        this._sphere.position.set(10, 5, 0);
        this._sphere.castShadow = true;
        this._scene.add(this._sphere);

        // adding ability to track time
        this._clock = new THREE.Clock();

        // render funciton
        this._RAF();
    }

    private _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    private _ShaderStep() {
        const v = Math.sin(this._clock.getElapsedTime()) * 0.5 + 0.5; // will bounce -1:1
        const color1 = new THREE.Vector3(1, 0, 0);
        const color2 = new THREE.Vector3(0, 1, 0);
        const sphereColor = color1.lerp(color2, v);

        //@ts-ignore
        this._sphere.material.uniforms.sphereColor.value = sphereColor;
    }

    private _RAF() {
        requestAnimationFrame(() => {
            // callback
            this._threejs.render(this._scene, this._camera);
            this._ShaderStep();

            this._RAF();
        });
    }
}
