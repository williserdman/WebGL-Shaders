import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/Addons.js";

const _VS = `

varying vec2 uvProxy;
varying float aspectRatio;
uniform float timeElapsed;
varying float timeProxy;

void main() {
    timeProxy = timeElapsed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //aspectRatio = gl_Position.x / gl_Position.y;
    uvProxy = uv;
}
`;
const _FS = `

uniform vec3 sphereColor;
varying vec2 uvProxy;
varying float timeProxy;

vec3 palatte( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.577);

    return a + b * cos( 6.28318 * ( c * t + d ));
}

void main() {
    vec2 uv = uvProxy - 0.5; // moving center to 0, 0
    uv = uv * 2.0; // now between -1 and 1
    //uv.x *= aspectRatio;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 5.0; i++) {
        uv *= 1.5;
        uv = fract(uv);
        uv -= 0.5;

        float d = length(uv) * exp(-length(uv0));
        vec3 col = palatte(length(uv0) + timeProxy * 0.2 + i);

        d = sin(d * 8.0 + timeProxy * 0.4);
        d = abs(d);
        // d = smoothstep(0.0, 0.6, d);
        d = pow(0.05 / d, 1.5);

        finalColor += col * d; 
    }


    gl_FragColor = vec4(finalColor, 1.0); // same as vec4(uv.x, uv.y, xxx, xxx)
}
`;

export class BasicWorld {
    private _threejs: THREE.WebGLRenderer;
    private _camera: THREE.PerspectiveCamera;
    private _scene: THREE.Scene;
    private _clock: THREE.Clock;
    private _screen: THREE.Mesh;

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
        const aspect = window.innerWidth / window.innerHeight;
        const near = 1.0;
        const far = 1000;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, 0, 150);

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
        /* const controls = new OrbitControls(
            this._camera,
            this._threejs.domElement
        );
        controls.target.set(0, 0, 0);
        controls.update(); */

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

        // adding ability to track time
        this._clock = new THREE.Clock();

        // adding a plane
        this._screen = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.ShaderMaterial({
                uniforms: {
                    timeElapsed: { value: this._clock.getElapsedTime() },
                },
                vertexShader: _VS,
                fragmentShader: _FS,
            })
        );
        this._screen.castShadow = false;
        this._screen.receiveShadow = true;
        //plane.rotation.x = -Math.PI / 2;
        this._scene.add(this._screen);

        // render funciton
        this._RAF();
    }

    private _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        //this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    private _ShaderStep() {
        //@ts-ignore
        this._screen.material.uniforms.timeElapsed.value =
            this._clock.getElapsedTime();
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

export default BasicWorld;
