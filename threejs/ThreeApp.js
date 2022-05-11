import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as shader from "./Shaders/Shader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import gsap from "gsap";
import { Loader } from "three";

export default class Sketch {
  constructor(selector) {
    console.log("[*] Constructor running")
    console.log(selector);
    this.scene = new THREE.Scene();
    this.container = selector;
    this.state = 0;
    this.states = [];
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio*2);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x050203, 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.mouseX = 0;
    this.mouseY = 0;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.set(0, 0.4, 3);
    this.camera.rotation.set(THREE.Math.degToRad(-20.42), 0, 0)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.setupStates();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();

  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  setupStates() {
    const states = [
      {
        color: 0x7600D9,
        logo: '/defi-logos/apy-vision-logo.png'
      },
      {
        color: 0x3A17F5,
        logo: '/defi-logos/augmented-finance-logo.png'
      },
      {
        color: 0x8FEBA01,
        logo: '/defi-logos/curve-logo.png'
      },
      {
        color: 0x004DE6,
        logo: 'defi-logos/defi-yearn-logo.png'
      },
      {
        color: 0x8AC06A,
        logo: '/defi-logos/ethereum-logo.png'
      }
    ]

    this.states = states;
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    const scene = this.scene
    const currentState = this.states[this.state];
    // add a source of light
    // const light = new THREE.AmbientLight(); //TODO play with colors
    // scene.add(light);
    this.light = new THREE.PointLight( currentState.color, 1 );;
    this.light.position.set(0,2,0);
    this.light.intensity = 0.1;
    this.scene.add(this.light);
    this.animated = false;
    this.currentTween;

    //load envmap
    const textureLoader = new THREE.TextureLoader();
    const envmap = textureLoader.load('/moonless_golf.jpeg');

    // add the palladium card
    const loader = new GLTFLoader();
    loader.load('/3d-assets/palladium_card-v2.glb', function (gltf) {
      that.cardObj = gltf.scene;
      //traverse objects to put material on card front face
      that.cardObj.traverse( function (node) {
        console.log("[*] TRAVERSING NODE", node)
        if (node instanceof THREE.Mesh && node.name === "card_v3") {
          node.castShadow = true;
          node.receiveShadow = false;
          // console.log(node.name, node)
          // console.log(node.material, "yaaa")
          // console.log("envmap", envmap)
          node.material = new THREE.MeshPhysicalMaterial({
            color: 0x878681,
            reflectivity: 0.42,
            roughness: 0.48,
            metalness: 0.92,
            envMap: envmap
          })

        }
      })


      that.cardObj.position.set(0,0,-5.582);
      that.cardObj.scale.set(0.5,0.5,0.5);
      that.cardObj.rotation.set(THREE.Math.degToRad(69),0,0);
      scene.add(that.cardObj);
    }, undefined, function (error) {
      console.error(error);
    });

    //add the logo in front
    const planeGeometry = new THREE.PlaneGeometry(2, 2, 2, 2);
    const planeTexture = new THREE.TextureLoader().load(currentState.logo);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: planeTexture,
      transparent: true
    });
    this.defiLogo = new THREE.Mesh(planeGeometry, planeMaterial);
    this.defiLogo.position.set(0,-3,-5);
    this.defiLogo.material.opacity = 0;
    this.scene.add(this.defiLogo);

  }

  nextState() {
    this.state = this.state + 1;
    if (this.state >= this.states.length ) {
      this.state = 0;
    }
    this.animated = false;
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    // this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);

    //sets the initial counter value
    if (this.time < 1) {
      this.startTime = 0;
      return
    }

    //the interval loop
    if (this.time - this.startTime >= 24.2 ) {
      console.log(this.time, "tick");
      this.startTime = this.time;
      //call next state
      this.nextState();
    }

    //listen to mouse and store coordinate x and y
    const cardObj = this.cardObj;

    document.onmousemove = function(e){
        this.mouseX = e.pageX;
        this.mouseY = e.pageY;

        //update the position of the card 
        if (!cardObj) return;
        const xratio = this.mouseX / window.innerWidth;
        cardObj.rotation.z = ((xratio * 1) - 0.5) * -1;
        // TODO improvement: add slight movement on Y axis too 
    }

    // get the current state and modify scene/obj values accordingly
    const currentState = this.states[this.state];
    if (currentState) {
      if (this.animated === false) {
        const that = this;
        this.light.color = new THREE.Color( currentState.color );
        console.log("light", this.light)
        gsap.fromTo(this.light,{intensity: 0.1}, {intensity: 1, duration: 4, onComplete: function() {gsap.to(that.light, {intensity: 0.1, duration: 4})}, onCompleteParams: [that]});

        this.defiLogo.material.map = new THREE.TextureLoader().load(currentState.logo);  
        gsap.fromTo(this.defiLogo.material,{opacity: 0}, {opacity: 1, duration: 4, onComplete: function() {gsap.to(that.defiLogo.material, {opacity: 0, duration: 4})}, onCompleteParams: [that] })
        gsap.to(this.defiLogo.material, {opacity: 0, duration: 4, delay: 4})
        this.animated = true;
      }
    }


  }
}
