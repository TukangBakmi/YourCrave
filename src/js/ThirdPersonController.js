// import
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {LoadingManager, worldWidth,
    soundEffectJump,soundEffectRun,soundEffectWalk} from './main';

export let charPosX, charPosY, charPosZ;
// Kecepatan player
const acceleration = 80.0;
const decceleration = -5.0;
const runSpeed = 2;        // berarti 2x lebih cepat dari jalan
const jumpSpeed = 1.1;      // berarti 1.1x lebih cepat dari jalan
const turnSpeed = 4.0;      // kecepatan turn left/right
const charScale = 0.006;     // player diperkecil
// Jarak kamera terhadap karakter
const camOffsetX = -12.0;
const camOffsetY = 12.0;
const camOffsetZ = -24.0;
// Titik yang dilihat kamera
const camLookX = 0.0;
const camLookY = 6.0;
const camLookZ = 12.0;
// Pergerakan kamera (nilainya 0-1). Makin kecil, makin cepat
const camMoveSpeed = 0.001;

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
        this._decceleration = new THREE.Vector3(decceleration/10000, decceleration/50000, decceleration);
        // Acceleration (kecepatan). Ini kecepatan bergerak karakternya (nilai x,y,z)
        this._acceleration = new THREE.Vector3(acceleration/100, acceleration/400, acceleration);
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
        const loader = new FBXLoader(LoadingManager);
        loader.setPath(res_path);
        // Memuat model Idle
        loader.load('idle.fbx', (fbx) => {
            // Untuk scale modelnya. Makin besar angkanya, model makin besar
            fbx.scale.setScalar(charScale);
            // Memberi bayangan
            fbx.traverse(c => {
                c.castShadow = true;
            });

            this._target = fbx;
            this._params.scene.add(this._target);
            this._target.position.set(-900,0,0);
            this._target.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), -Math.PI*3/2);

            this._mixer = new THREE.AnimationMixer(this._target);
            // Memberi status idle
            LoadingManager.onLoad = () => {
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
            const loader = new FBXLoader(LoadingManager);
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

    limit(left, right, bot, top){
            if(this._target.position.x > left-2 && this._target.position.x < right+2 && this._target.position.z < bot+2 && this._target.position.z > top-2){
                if(this._target.position.x-8 < left){
                    this._target.position.x -= 0.5;
                    this._target.position.x -= 0.5;
                    this._target.position.x -= 0.5;
                }
                if(this._target.position.x+8 > right){
                    this._target.position.x += 0.5;
                    this._target.position.x += 0.5;
                    this._target.position.x += 0.5;
                }
                if(this._target.position.z+8 > bot){
                    this._target.position.z += 0.5;
                    this._target.position.z += 0.5;
                    this._target.position.z += 0.5;
                }
                if(this._target.position.z-8 < top){
                    this._target.position.z -= 0.5;
                    this._target.position.z -= 0.5;
                    this._target.position.z -= 0.5;
                }
            }
    }
    checkWater(){
        this.limit(-904, -856, -568, -1024);
        this.limit(-904, -848, -576, -1024);
        this.limit(-904, -832, -584, -1024);
        this.limit(-904, -816, -592, -1024);
        this.limit(-904, -808, -600, -1024);
        this.limit(-904, -792, -608, -1024);
        this.limit(-904, -768, -616, -1024);
        this.limit(-776, -744, -608, -1024);
        this.limit(-752, -568, -600, -1024);
        this.limit(-736, -584, -592, -1024);
        this.limit(-728, -600, -584, -1024);
        this.limit(-712, -608, -576, -1024);
        this.limit(-704, -624, -568, -1024);
        this.limit(-680, -648, -560, -1024);
        this.limit(-576, -560, -616, -1024);
        this.limit(-576, -552, -624, -1024);
        this.limit(-576, -544, -640, -1024);
        this.limit(-576, -536, -672, -1024);
        this.limit(-576, -528, -696, -1024);
        this.limit(-576, -520, -712, -1024);
        this.limit(-576, -512, -728, -1024);
        this.limit(-576, -504, -736, -1024);
        this.limit(-576, -496, -744, -1024);
        this.limit(-576, -480, -752, -1024);
        this.limit(-576, -472, -760, -1024);
        this.limit(-576, -456, -768, -1024);
        this.limit(-576, -440, -776, -1024);
        this.limit(-576, -416, -784, -1024);
        this.limit(-576, -384, -792, -1024);
        this.limit(-392, -352, -800, -1024);
        this.limit(-360, -144, -792, -1024);
        this.limit(-344, -160, -784, -1024);
        this.limit(-328, -168, -776, -1024);
        this.limit(-320, -184, -768, -1024);
        this.limit(-312, -192, -760, -1024);
        this.limit(-312, -200, -752, -1024);
        this.limit(-304, -200, -744, -1024);
        this.limit(-288, -208, -736, -1024);
        this.limit(-272, -208, -728, -1024);
        this.limit(-264, -216, -720, -1024);
        this.limit(-248, -224, -712, -1024);
        this.limit(-192, -128, -800, -1024);
        this.limit(-192, -112, -808, -1024);
        this.limit(-192, -88, -816, -1024);
        this.limit(-192, -64, -824, -1024);
        this.limit(-192, -32, -832, -1024);
        this.limit(-1024, 1024, -840, -1024);
        this.limit(8, 32, -832, -1024);
        this.limit(24, 40, -824, -1024);
        this.limit(32, 48, -808, -1024);
        this.limit(40, 56, -784, -1024);
        this.limit(48, 64, -760, -1024);
        this.limit(56, 72, -736, -1024);
        this.limit(64, 232, -712, -736);
        this.limit(72, 224, -704, -744);
        this.limit(80, 216, -696, -1024);
        this.limit(88, 200, -688, -1024);
        this.limit(104, 184, -680, -1024);
        this.limit(120, 152, -672, -1024);
        this.limit(208, 224, -768, -1024);
        this.limit(216, 232, -776, -1024);
        this.limit(224, 240, -784, -1024);
        this.limit(232, 256, -792, -1024);
        this.limit(248, 272, -800, -1024);
        this.limit(264, 296, -808, -1024);
        this.limit(288, 320, -816, -1024);
        this.limit(312, 356, -824, -1024);
        this.limit(344, 392, -816, -1024);
        this.limit(384, 424, -808, -1024);
        this.limit(416, 432, -800, -1024);
        this.limit(424, 440, -792, -1024);
        this.limit(432, 448, -784, -1024);
        this.limit(440, 448, -760, -1024);
        this.limit(432, 440, -736, -768);
        this.limit(424, 456, -680, -744);
        this.limit(400, 424, -688, -736);
        this.limit(384, 400, -704, -728);
        this.limit(392, 408, -696, -712);
        this.limit(448, 472, -672, -1024);
        this.limit(464, 488, -664, -1024);
        this.limit(480, 496, -656, -1024);
        this.limit(488, 504, -648, -1024);
        this.limit(496, 512, -640, -1024);
        this.limit(504, 528, -632, -1024);
        this.limit(520, 536, -624, -1024);
        this.limit(528, 544, -608, -1024);
        this.limit(536, 552, -576, -1024);
        this.limit(544, 552, -544, -584);
        this.limit(536, 552, -504, -552);
        this.limit(528, 544, -496, -512);
        this.limit(520, 536, -488, -504);
        this.limit(504, 528, -480, -496);
        this.limit(480, 512, -472, -488);
        this.limit(464, 488, -464, -480);
        this.limit(456, 472, -456, -472);
        this.limit(448, 584, -336, -464);
        this.limit(440, 616, -344, -440);
        this.limit(432, 448, -368, -416);
        this.limit(464, 544, -328, -344);
        this.limit(608, 632, -352, -448);
        this.limit(624, 648, -360, -448);
        this.limit(640, 656, -368, -448);
        this.limit(648, 664, -376, -448);
        this.limit(656, 672, -384, -448);
        this.limit(664, 680, -392, -448);
        this.limit(672, 688, -408, -448);
        this.limit(680, 792, -416, -448);
        this.limit(784, 1024, -408, -448);
        this.limit(808, 1024, -384, -448);
        this.limit(816, 1024, -352, -448);
        this.limit(824, 1024, -320, -360);
        this.limit(816, 1024, -192, -328);
        this.limit(808, 1024, -200, -296);
        this.limit(800, 1024, -208, -288);
        this.limit(792, 1024, -232, -288);
        this.limit(784, 1024, -256, -264);
        this.limit(824, 1024, -184, -256);
        this.limit(840, 1024, -176, -256);
        this.limit(856, 1024, -168, -256);
        this.limit(872, 1024, -160, -256);
        this.limit(904, 1024, -152, -256);
        this.limit(960, 1024, -144, -256);
        this.limit(992, 1024, -136, -256);
        this.limit(1008, 1024, -128, -256);
    }
    checkCollision(){
        
    }
    checkWorld(){
        if(Math.pow(this._target.position.x, 2) + Math.pow(this._target.position.z, 2) + Math.pow(250,2) >= Math.pow(worldWidth/2, 2)){
            if(this._target.position.x < 0 && this._target.position.z < 0){
                this._target.position.x += 1;
                this._target.position.z += 1;
            }
            else if(this._target.position.x > 0 && this._target.position.z < 0){
                this._target.position.x -= 1;
                this._target.position.z += 1;
            }
            else if(this._target.position.x < 0 && this._target.position.z > 0){
                this._target.position.x += 1;
                this._target.position.z -= 1;
            }
            else if(this._target.position.x > 0 && this._target.position.z > 0){
                this._target.position.x -= 1;
                this._target.position.z -= 1;
            }
        }
    }

    // Update stat
    Update(timeInSeconds) {
        if (!this._stateMachine._currentState) {
            return;
        }
        this.checkWater();
        this.checkCollision();
        this.checkWorld();
        charPosX =  this._target.position.x;
        charPosY =  this._target.position.y;
        charPosZ =  this._target.position.z;
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
            acc.multiplyScalar(runSpeed);
        }
        // Jika tombol space ditekan, percepatan dikali 1.1
        if (this._stateMachine._currentState.Name == 'jump') {
            acc.multiplyScalar(jumpSpeed);
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
            _Q.setFromAxisAngle(_A, turnSpeed * Math.PI * timeInSeconds * this._acceleration.y);
            _R.multiply(_Q);
        }
        // Jika right ditekan, mengubah sudut karakternya
        if (this._input._keys.right) {
            _A.set(0, 1, 0);
            // Angka 4.0 adalah kecepatan berputarnya. Karena minus, arah putarnya berlawanan
            _Q.setFromAxisAngle(_A, turnSpeed * -Math.PI * timeInSeconds * this._acceleration.y);
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
            // Angka ini adalah keycode three js, bisa dicek di https://www.toptal.com/developers/keycode
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
            soundEffectJump.play();
            curAction.play();
        } else {
            curAction.play();
        }
    }
    // Jika sudah selesai, kembali ke action run
    _Finished() {
        soundEffectJump.stop();
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
            soundEffectWalk.play();
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
        soundEffectWalk.stop();
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
            soundEffectRun.play();
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
        soundEffectRun.stop();
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
        const idealOffset = new THREE.Vector3(camOffsetX, camOffsetY, camOffsetZ);
        idealOffset.applyQuaternion(this._params.target.Rotation);
        idealOffset.add(this._params.target.Position);
        return idealOffset;
    }

    // Sudut kamera
    _CalculateIdealLookat() {
        const idealLookat = new THREE.Vector3(camLookX, camLookY, camLookZ);
        idealLookat.applyQuaternion(this._params.target.Rotation);
        idealLookat.add(this._params.target.Position);
        return idealLookat;
    }

    // Update posisi kamera
    Update(timeElapsed) {
        const idealOffset = this._CalculateIdealOffset();
        const idealLookat = this._CalculateIdealLookat();

        // Kecepatan update-nya
        const t = 1.0 - Math.pow(camMoveSpeed, timeElapsed);

        this._currentPosition.lerp(idealOffset, t);
        this._currentLookat.lerp(idealLookat, t);

        this._camera.position.copy(this._currentPosition);
        this._camera.lookAt(this._currentLookat);
    }
}

export { BasicCharacterController, ThirdPersonCamera };