import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as shader from "./Shaders/Shader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Loader } from "three";

export default class Sketch {
  constructor(selector) {
    console.log("[*] Constructor running")
    console.log(selector);
    this.scene = new THREE.Scene();
    this.container = selector;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x1e272e, 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );

    this.camera.position.set(0.008, 3.662, 9.631);
    this.camera.rotation.set(THREE.Math.degToRad(-20.42), 0, 0)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

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

    // add a source of light
    // const light = new THREE.AmbientLight(); //TODO play with colors
    // scene.add(light);
    const pointLight = new THREE.PointLight( 0xffffff, 1 );
    pointLight.position.set(0,2,0);
    this.scene.add(pointLight);


    // add the palladium card
    const loader = new GLTFLoader();
    loader.load('/3d-assets/palladium_card-v2.glb', function (gltf) {
      console.log(gltf);
      const cardObj = gltf.scene;
      //traverse objects to put material on card front face
      cardObj.traverse( function (node) {
        console.log("NODE", node)
        if (node instanceof THREE.Mesh && node.name === "card_v3") {
          console.log(node.name, node)
          console.log(node.material, "yaaa")
          // node.material.map = cardMat;
          node.material = new THREE.MeshPhysicalMaterial({
            color: 0x474747,
            reflectivity: 0.80,
            roughness: 0.4,
            metalness: 0.0,
          })
        }
      })


      cardObj.position.set(0,0,-5.582);
      cardObj.scale.set(0.5,0.5,0.5);
      cardObj.rotation.set(THREE.Math.degToRad(69),0,0);
      scene.add(cardObj);
    }, undefined, function (error) {
      console.error(error);
    });

    //add the logo in front
    const planeGeometry = new THREE.PlaneGeometry(2, 2, 2, 2);
    const planeTexture = new THREE.TextureLoader().load('/ethereum-logo.png');
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: planeTexture,
      transparent: true
    });
    this.defiLogo = new THREE.Mesh(planeGeometry, planeMaterial);
    this.defiLogo.position.set(0,-3,-5);
    this.scene.add(this.defiLogo);

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
    }

    //the interval loop
    // 10 time units =~ 3 seconds
    if (this.time - this.startTime >= 30 ) {
      console.log(this.time, "tick");
      this.startTime = this.time;
    }

    
  }
}
