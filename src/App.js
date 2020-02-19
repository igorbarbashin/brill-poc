import React, { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as dat from 'dat.gui';
import './App.css';
const OrbitControls = require('three-orbit-controls')(THREE);

function App() {
  var camera, scene, renderer, controls, gui;
  var gltfLoader = new GLTFLoader();

  useEffect(() => {
    init();
    animate();
  });

  function init() {
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10
    );
    scene = new THREE.Scene();
    camera.position.z = 0.6;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    controls = new OrbitControls(camera);
    gui = new dat.GUI();

    // DIAMOND MESH
    const gemBackMaterial = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0xffffff,
      metalness: 1,
      roughness: 0,
      opacity: 0.5,
      side: THREE.BackSide,
      transparent: true,
      envMapIntensity: 5,
      premultipliedAlpha: true
    });

    const gemFrontMaterial = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0xffffff,
      metalness: 0,
      roughness: 0,
      opacity: 0.25,
      side: THREE.FrontSide,
      transparent: false,
      envMapIntensity: 10,
      premultipliedAlpha: true
    });

    gltfLoader.load('./diamond/diamond.glb', ({ scene: diamond }) => {
      diamond.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          child.material = gemBackMaterial;
          const second = child.clone();
          second.material = gemFrontMaterial;

          const parent = new THREE.Group();
          parent.add(second);
          parent.add(child);
          parent.name = 'diamond';
          scene.add(parent);
        }
      });
    });

    // ADD LIGHTING
    const skyColor = 0xb1e1ff; // light blue
    const ambientLight = new THREE.AmbientLight(skyColor, 2.5);
    scene.add(ambientLight);

    gui.add(ambientLight, 'intensity', 0, 5).name('ambient light intensity');

    const pointLight1 = new THREE.PointLight(0xffffff);
    pointLight1.position.set(150, 10, 0);
    pointLight1.castShadow = false;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff);
    pointLight2.position.set(-150, 0, 0);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff);
    pointLight3.position.set(0, -10, -150);
    scene.add(pointLight3);

    const pointLight4 = new THREE.PointLight(0xffffff);
    pointLight4.position.set(0, 0, 150);
    scene.add(pointLight4);

    // GUI
    gui
      .add(gemFrontMaterial, 'opacity', 0, 1)
      .step(0.1)
      .name('gem opacity');
    gui
      .add(gemFrontMaterial, 'metalness', 0, 1)
      .step(0.1)
      .name('gem front metalness');
    gui
      .add(gemFrontMaterial, 'premultipliedAlpha', true)
      .name('gem front premultipliedAlpha');
    gui
      .add(gemFrontMaterial, 'transparent', true)
      .name('gem front transparent');
      
    var resize= function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);
    resize();
    document.body.appendChild(renderer.domElement);
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);

    const diamond = scene.getObjectByName('diamond');
    if (diamond) {
      diamond.rotation.x += 0.001;
      diamond.rotation.y += 0.001;
      diamond.rotation.z += 0.001;
    }

    renderer.render(scene, camera);
  }

  return <></>;
}

export default App;
