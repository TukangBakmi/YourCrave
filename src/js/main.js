import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
// Untuk import file FBX
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
// Untuk menampilkan FPS
import Stats from 'three/addons/libs/stats.module.js';

// Untuk day/night
let directionalLight, pivot;
// Atribut world
const worldWidth = 2048;
const worldLength = 2048;
const rotation = 0.01;

class BasicCharacterControllerProxy {
    constructor(animations) {
        this._animations = animations;
    }

    get animations() {
        return this._animations;
    }
};

// Class utama untuk Controller
class BasicCharacterController {
    constructor(params) {
        this._Init(params);
    }
    // Initialize
    _Init(params) {
        this._params = params;
        
        // Decceleration (pengurangan kecepatan). Jadi ketika status berubah menjadi berhenti, kecepatan xyz-nya akan dikurangi
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        // Acceleration (kecepatan). Ini kecepatan bergerak karakternya (nilai x,y,z)
        this._acceleration = new THREE.Vector3(1, 0.25, 100.0);
        // Percepatan
        this._velocity = new THREE.Vector3(0, 0, 0);
        // Untuk perubahan posisi
        this._position = new THREE.Vector3();

        // Untuk animasi
        this._animations = {};
        this._input = new BasicCharacterControllerInput();
        this._stateMachine = new CharacterFSM(
            new BasicCharacterControllerProxy(this._animations));
        // Memanggil fungsi _LoadModels
        this._LoadModels();
    }
    // Fungsi untuk memuat modelnya
    _LoadModels() {
        // Path utama resource
        const res_path = './src/img/player/';
        //Load file fbx
        const loader = new FBXLoader();
        loader.setPath(res_path);
        // Memuat model Idle
        loader.load('idle.fbx', (fbx) => {
            // Untuk scale modelnya. Makin besar angkanya, model makin besar
            fbx.scale.setScalar(0.01);
            // Memberi bayangan
            fbx.traverse(c => {
                c.castShadow = true;
            });

            this._target = fbx;
            this._params.scene.add(this._target);

            this._mixer = new THREE.AnimationMixer(this._target);
            // Memberi status idle
            this._manager = new THREE.LoadingManager();
            this._manager.onLoad = () => {
                this._stateMachine.SetState('idle');
            };

            const _OnLoad = (animName, anim) => {
                const clip = anim.animations[0];
                const action = this._mixer.clipAction(clip);
        
                this._animations[animName] = {
                    clip: clip,
                    action: action,
                };
            };
            // Memuat file FBX lainnya dan memberi nama animasinya
            const loader = new FBXLoader(this._manager);
            loader.setPath(res_path);
            loader.load('walk.fbx', (a) => { _OnLoad('walk', a); });
            loader.load('run.fbx', (a) => { _OnLoad('run', a); });
            loader.load('idle.fbx', (a) => { _OnLoad('idle', a); });
            loader.load('jump.fbx', (a) => { _OnLoad('jump', a); });
        });
    }

    get Position() {
        return this._position;
    } 

    get Rotation() {
        if (!this._target) {
        return new THREE.Quaternion();
        }
        return this._target.quaternion;
    }
    // Update stat
    Update(timeInSeconds) {
        if (!this._stateMachine._currentState) {
            return;
        }

        this._stateMachine.Update(timeInSeconds, this._input);
        // Kecepatan move
        const velocity = this._velocity;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this._decceleration.x,
            velocity.y * this._decceleration.y,
            velocity.z * this._decceleration.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

        velocity.add(frameDecceleration);

        const controlObject = this._target;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
        // Clone acceleration ke acc karena acc-nya akan dikali. Jadi agar acceleration-nya tetap, hanya acc-nya saja yang berubah
        const acc = this._acceleration.clone();
        // Jika tombol shift ditekan, percepatan dikali 2
        if (this._input._keys.shift) {
            acc.multiplyScalar(2.0);
        }
        // Jika tombol space ditekan, percepatan dikali 1.1
        if (this._stateMachine._currentState.Name == 'jump') {
            acc.multiplyScalar(1.1);
        }
        // Jika forward ditekan, menambah nilai z sehingga character bergerak maju
        if (this._input._keys.forward) {
            velocity.z += acc.z * timeInSeconds;
        }
        // Jika forward ditekan, mengurangi nilai z sehingga character bergerak mundur
        if (this._input._keys.backward) {
            velocity.z -= acc.z * timeInSeconds;
        }
        // Jika left ditekan, mengubah sudut karakternya
        if (this._input._keys.left) {
            _A.set(0, 1, 0);
            // Angka 4.0 adalah kecepatan berputarnya
            _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
            _R.multiply(_Q);
        }
        // Jika right ditekan, mengubah sudut karakternya
        if (this._input._keys.right) {
            _A.set(0, 1, 0);
            // Angka 4.0 adalah kecepatan berputarnya. Karena minus, arah putarnya berlawanan
            _Q.setFromAxisAngle(_A, -4.0 * Math.PI * timeInSeconds * this._acceleration.y);
            _R.multiply(_Q);
        }

        controlObject.quaternion.copy(_R);

        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);

        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();

        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(controlObject.quaternion);
        sideways.normalize();

        sideways.multiplyScalar(velocity.x * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);

        controlObject.position.add(forward);
        controlObject.position.add(sideways);

        this._position.copy(controlObject.position);

        if (this._mixer) {
            this._mixer.update(timeInSeconds);
        }

        // Kecepatan rotasi light (Membuat day/night). If dan else untuk mempercepat durasi night. Jadi night akan berlangsung lebih cepat daripada day
        if (pivot.rotation.z >= 2*Math.PI){
            pivot.rotation.z = 0;
        } else if(pivot.rotation.z <= 0.5*Math.PI || pivot.rotation.z >= 1.5*Math.PI){
            pivot.rotation.z += rotation;
        } else{
            pivot.rotation.z += 2 * rotation;
        }
    }
};

// Memberi inputan
class BasicCharacterControllerInput {
    constructor() {
        this._Init();    
    }
    // Initialize
    _Init() {
        this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false,
            shift: false,
        };
        // Event listener keydown jika key ditekan, akan memanggil fungsi onKeyDown
        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
        // Event listener keyup jika key dilepas, akan memanggil fungsi onKeyUp
        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    }
    // Fungsi onKeyDown
    _onKeyDown(event) {
        // Jika key yang didefinisikan ditekan, mengubah nilainya menjadi true
        switch (event.keyCode) {
            case 87: // w
                this._keys.forward = true;
                break;
            case 65: // a
                this._keys.left = true;
                break;
            case 83: // s
                this._keys.backward = true;
                break;
            case 68: // d
                this._keys.right = true;
                break;
            case 32: // SPACE
                this._keys.space = true;
                break;
            case 16: // SHIFT
                this._keys.shift = true;
                break;
        }
    }
    // Fungsi onKeyUp
    _onKeyUp(event) {
        // Jika key yang didefinisikan dilepas, mengubah nilainya menjadi false
        switch(event.keyCode) {
            // Angka ini adalah keycode three js, bisa dicek dihttps://www.toptal.com/developers/keycode
            case 87: // w
                this._keys.forward = false;
                break;
            case 65: // a
                this._keys.left = false;
                break;
            case 83: // s
                this._keys.backward = false;
                break;
            case 68: // d
                this._keys.right = false;
                break;
            case 32: // SPACE
                this._keys.space = false;
                break;
            case 16: // SHIFT
                this._keys.shift = false;
                break;
        }
    }
};

// FiniteStateMachine memiliki Subclass bernama CharacterFSM
class FiniteStateMachine {
    constructor() {
        this._states = {};
        this._currentState = null;
    }
    // Memberi nama status (idle, walk, run, jump)
    _AddState(name, type) {
        this._states[name] = type;
    }
    // Mengatur statusnya (idle, walk, run, jump)
    SetState(name) {
        // prevState adalah status sebelumnya
        const prevState = this._currentState;
        // Memberi nama pada status
        if (prevState) {
            if (prevState.Name == name) {
                return;
            }
            prevState.Exit();
        }
        // state adalah status yang sekarang
        const state = new this._states[name](this);
        this._currentState = state;
        state.Enter(prevState);
    }

    Update(timeElapsed, input) {
        if (this._currentState) {
            this._currentState.Update(timeElapsed, input);
        }
    }
};

// CharacterFSM merupakan Subclass dari FiniteStateMachine
class CharacterFSM extends FiniteStateMachine {
    constructor(proxy) {
        super();
        this._proxy = proxy;
        this._Init();
    }
    // Initialize
    _Init() {
        // Memanggil fungsi _AddState dari superclassnya
        this._AddState('idle', IdleState);
        this._AddState('walk', WalkState);
        this._AddState('run', RunState);
        this._AddState('jump', JumpState);
    }
};

// Superclass dari JumpState, WalkState, RunState, dan IdleState
class State {
    constructor(parent) {
        this._parent = parent;
    }

    Enter() {}
    Exit() {}
    Update() {}
};

// Posisi jump
class JumpState extends State {
    constructor(parent) {
        super(parent);
        // Function Finished untuk menandai kalau animasi jump hanya dilakukan sekali, tanpa perulangan
        this._FinishedCallback = () => {
            this._Finished();
        }
    }
    // Memberi nama 'jump'
    get Name() {
        return 'jump';
    }

    Enter(prevState) {
        // Memberi animasi jump
        const curAction = this._parent._proxy._animations['jump'].action;
        // Menambahkan event listener finished
        const mixer = curAction.getMixer();
        mixer.addEventListener('finished', this._FinishedCallback);
        if (prevState) {
            const prevAction = this._parent._proxy._animations[prevState.Name].action;
            curAction.reset();  
            curAction.setLoop(THREE.LoopOnce, 1);
            curAction.clampWhenFinished = true;
            curAction.crossFadeFrom(prevAction, 0.2, true);
            curAction.play();
        } else {
            curAction.play();
        }
    }
    // Jika sudah selesai, kembali ke action run
    _Finished() {
        this._Cleanup();
        this._parent.SetState('run');
    }
    // Menghapus event listener finished
    _Cleanup() {
        const action = this._parent._proxy._animations['jump'].action;
        action.getMixer().removeEventListener('finished', this._CleanupCallback);
    }

    Exit() {
        this._Cleanup();
    }

    Update(_) {
    }
};

// Posisi walk
class WalkState extends State {
    constructor(parent) {
        super(parent);
    }
    // Memberi nama 'walk'
    get Name() {
        return 'walk';
    }

    Enter(prevState) {
        // Membuat animasi walk
        const curAction = this._parent._proxy._animations['walk'].action;
        if (prevState) {
            const prevAction = this._parent._proxy._animations[prevState.Name].action;
            curAction.enabled = true;
            if (prevState.Name == 'run') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration;
                curAction.time = prevAction.time * ratio;
            } else {
                curAction.time = 0.0;
                curAction.setEffectiveTimeScale(1.0);
                curAction.setEffectiveWeight(1.0);
            }
            curAction.crossFadeFrom(prevAction, 0.5, true);
            curAction.play();
        } else {
            curAction.play();
        }
    }

    Exit() {
    }
    // Update stat
    Update(timeElapsed, input) {
        // Jika input maju atau mundur:
        if (input._keys.forward || input._keys.backward) {
            // Jika tombol shift juga ditekan, masuk ke status run
            if (input._keys.shift) {
                this._parent.SetState('run');
            }
            // Jika tombol space juga ditekan, masuk ke status jump
            if (input._keys.space) {
                this._parent.SetState('jump');
            }
            return;
        }
        // Jika tidak menekan tombol, masuk ke status idle
        this._parent.SetState('idle');
    }
};

// Ketika posisi run
class RunState extends State {
    constructor(parent) {
        super(parent);
    }
    // Memberi nama 'run'
    get Name() {
        return 'run';
    }

    Enter(prevState) {
        // Membuat animasi run
        const curAction = this._parent._proxy._animations['run'].action;
        if (prevState) {
            const prevAction = this._parent._proxy._animations[prevState.Name].action;
            curAction.enabled = true;
            if (prevState.Name == 'walk') {
                const ratio = curAction.getClip().duration / prevAction.getClip().duration;
                curAction.time = prevAction.time * ratio;
            } else {
                curAction.time = 0.0;
                curAction.setEffectiveTimeScale(1.0);
                curAction.setEffectiveWeight(1.0);
            }
            curAction.crossFadeFrom(prevAction, 0.5, true);
            curAction.play();
        } else {
            curAction.play();
        }
    }

    Exit() {
    }
    // Update stat
    Update(timeElapsed, input) {
        // Jika input maju atau mundur:
        if (input._keys.forward || input._keys.backward) {
            // Jika shift tidak ditekan, status berubah menjadi walk
            if (!input._keys.shift) {
                this._parent.SetState('walk');
            }
            // Jika space ditekan, masuk ke status jump
            if (input._keys.space){
                    this._parent.SetState('jump');
            }
            return;
        }
        // Jika tidak ada tombol yang ditekan, masuk ke status idle
        this._parent.SetState('idle');
    }
};

// Ketika posisi Idle
class IdleState extends State {
    constructor(parent) {
        super(parent);
    }
    // Memberi nama 'idle'
    get Name() {
        return 'idle';
    }

    Enter(prevState) {
        // Membuat animasi idle
        const idleAction = this._parent._proxy._animations['idle'].action;
        if (prevState) {
            const prevAction = this._parent._proxy._animations[prevState.Name].action;
            idleAction.time = 0.0;
            idleAction.enabled = true;
            idleAction.setEffectiveTimeScale(1.0);
            idleAction.setEffectiveWeight(1.0);
            idleAction.crossFadeFrom(prevAction, 0.5, true);
            idleAction.play();
        } else {
            idleAction.play();
        }
    }

    Exit() {
    }
    // Update stat
    Update(_, input) {
        // Jika diberi input tertentu, status idle akan diubah menjadi walk atau jump
        if (input._keys.forward || input._keys.backward) {
            this._parent.SetState('walk');
        } else if (input._keys.space) {
            this._parent.SetState('jump');
        }
    }
};

// Pengaturan kamera
class ThirdPersonCamera {
    constructor(params) {
        this._params = params;
        this._camera = params.camera;

        this._currentPosition = new THREE.Vector3();
        this._currentLookat = new THREE.Vector3();
    }


    // Jarak kamera dengan karakter
    _CalculateIdealOffset() {
        const idealOffset = new THREE.Vector3(-20, 20, -20);
        idealOffset.applyQuaternion(this._params.target.Rotation);
        idealOffset.add(this._params.target.Position);
        return idealOffset;
    }

    // Sudut kamera
    _CalculateIdealLookat() {
        const idealLookat = new THREE.Vector3(0, 0, 40);
        idealLookat.applyQuaternion(this._params.target.Rotation);
        idealLookat.add(this._params.target.Position);
        return idealLookat;
    }

    // Update posisi kamera
    Update(timeElapsed) {
        const idealOffset = this._CalculateIdealOffset();
        const idealLookat = this._CalculateIdealLookat();

        // Kecepatan update-nya
        const t = 1.0 - Math.pow(0.001, timeElapsed);

        this._currentPosition.lerp(idealOffset, t);
        this._currentLookat.lerp(idealLookat, t);

        this._camera.position.copy(this._currentPosition);
        this._camera.lookAt(this._currentLookat);
    }
}

// Class Utama
class ThirdPersonCameraDemo {
    constructor() {
        this._Initialize();
    }

    // Init
    _Initialize() {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        });
        this._threejs.outputEncoding = THREE.sRGBEncoding;
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this._threejs.domElement);

        this._stats = new Stats();
        document.body.appendChild( this._stats.dom );

        // Membuat halaman menjadi responsive
        window.addEventListener('resize', () => {
            this._camera.aspect = window.innerWidth / window.innerHeight;
            this._camera.updateProjectionMatrix();
            this._threejs.setSize(window.innerWidth, window.innerHeight);
        }, false);

        // Menggunakan jenis kamera "Perspective Camera"
        this._camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );

        // Membuat Scene dan warna backgroundnya
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0XCFF7FF);

        // Menambahkan kabut
        this._scene.fog = new THREE.FogExp2(0xFFFFFF, 0.001);

        // Menggunakan jenis lighting "Hemisphere Light"
        var hemiLight = new THREE.HemisphereLight(0XCFF7FF, 0xFFFFFF, 0.2);
        hemiLight.position.set(0, 1024, 0);
        this._scene.add(hemiLight);
        // Menggunakan jenis lighting "Directional Light"
        directionalLight = new THREE.DirectionalLight(0xffffff,0.6 );
        directionalLight.position.set(0, 0.5 * worldWidth, 0);
        directionalLight.target.position.set(0, 0, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.bias = -0.001;
        // Jarak kamera agar bisa menghasilkan bayangan
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = worldWidth;
        // Mempertajam bayangan
        directionalLight.shadow.mapSize.width = 6 * worldWidth;
        directionalLight.shadow.mapSize.height = 6 * worldLength;
        // Offset bayangannya
        directionalLight.shadow.camera.left = worldLength/2;
        directionalLight.shadow.camera.right = -worldLength/2;
        directionalLight.shadow.camera.top = worldLength/2;
        directionalLight.shadow.camera.bottom = -worldLength/2;
        this._scene.add( directionalLight );

        // const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
        // this._scene.add(dLightHelper);

        // const dLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
        // this._scene.add(dLightShadowHelper);

        // Menambahkan directional light ke pivot agar bisa berotasi
        pivot = new THREE.Group();
        this._scene.add( pivot );
        pivot.add( directionalLight );

        // Shader untuk langit
        var vertexShader = document.getElementById("vertexShader").textContent;
        var fragmentShader = document.getElementById("fragmentShader").textContent;
        var uniforms = {
            topColor: { type: "c", value: new THREE.Color(0x0077ff) },
            bottomColor: { type: "c", value: new THREE.Color(0xffffff) },
            offset: { type: "f", value: 33 },
            exponent: { type: "f", value: 0.6 }
        };
        uniforms.topColor.value.copy(hemiLight.color);
        this._scene.fog.color.copy(uniforms.bottomColor.value);
        // Menambahkan langit
        var skyGeo = new THREE.SphereGeometry(worldWidth/2, worldWidth/10, worldLength/10);
        var skyMat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide
        });
        var sky = new THREE.Mesh(skyGeo, skyMat);
        this._scene.add(sky);

        //Ground dari PlaneGeometry
        const loader = new THREE.TextureLoader();
        const GroundGeometry = new THREE.PlaneBufferGeometry(worldWidth,worldLength);
        const GroundMaterial = new THREE.MeshPhongMaterial({
            map: loader.load('./src/img/ground/land.png'),
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(GroundGeometry,GroundMaterial);
        this._scene.add(ground);
        ground.rotation.x = -0.5 * Math.PI;
        ground.castShadow = false;
        ground.receiveShadow = true;

        this._mixers = [];
        this._previousRAF = null;

        this._LoadAnimatedModel();
        this._RAF();
    }

    
    _LoadAnimatedModel() {
        const params = {
            camera: this._camera,
            scene: this._scene,
        }
        this._controls = new BasicCharacterController(params);

        this._thirdPersonCamera = new ThirdPersonCamera({
            camera: this._camera,
            target: this._controls,
        });
    }

    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            this._RAF();

            this._threejs.render(this._scene, this._camera);
            this._Step(t - this._previousRAF);
            this._previousRAF = t;
        });
    }

    _Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        if (this._mixers) {
            this._mixers.map(m => m.update(timeElapsedS));
        }

        if (this._controls) {
            this._controls.Update(timeElapsedS);
        }

        this._thirdPersonCamera.Update(timeElapsedS);
        this._stats.update();     //Update FPS
    }
}

// Memanggil Class Utama ketika halaman di-load
window.addEventListener('DOMContentLoaded', () => {
    let _APP = new ThirdPersonCameraDemo();
});