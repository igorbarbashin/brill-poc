import React, { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as dat from 'dat.gui';
import './App.css';
/*eslint-disable-next-line */
import shader0_vert from '!!webpack-glsl-loader!./shaders/diamond0.vert.glsl';
/*eslint-disable-next-line */
import shader0_frag from '!!webpack-glsl-loader!./shaders/diamond0.frag.glsl';
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
    renderer = new THREE.WebGLRenderer();
    controls = new OrbitControls(camera);

    var env_tex = new THREE.CubeTextureLoader()
      .setPath('./environment0/')
      .load([
        'px.png',
        'nx.png',
        'py.png',
        'ny.png',
        'pz.png',
        'nz.png'
      ]);
      console.log(env_tex)
    scene.background= env_tex

    var diamond= {};
    diamond.material= {};
    diamond.uniforms= {
      env: env_tex,
      exposure: {value: 1.},
      reflectance: {value: .5},
      transmittance: {value: 1.},
      ior: {value: 2.},
    };
    gui = new dat.GUI();
    gui.add(diamond.uniforms.exposure, 'value', 0, 5)
      .name('exposure');
    gui.add(diamond.uniforms.reflectance, 'value', 0, 1)
      .name('reflectance');
    gui.add(diamond.uniforms.transmittance, 'value', 0, 1)
      .name('transmittance');
    gui.add(diamond.uniforms.ior, 'value', -5, 5)
      .name('refraction');


    var shader= {};
    shader.vert= "";
    shader.frag= "";
    diamond.material.front= new THREE.ShaderMaterial({
      uniforms: diamond.uniforms,
      vertexShader: shader0_vert,
      fragmentShader: shader0_frag,
      side: THREE.FrontSide
    });
    diamond.material.back= new THREE.ShaderMaterial({
      uniforms: diamond.uniforms,
      vertexShader: shader0_vert,
      fragmentShader: shader0_frag,
      side: THREE.BackSide
    });

    gltfLoader.load('./diamond/diamond.glb', ({ scene: mesh }) => {
      mesh.traverse((child)=> {
        if (child instanceof THREE.Mesh) {
          child.material = diamond.material.front;
          const second = child.clone();
          second.material = diamond.material.back;

          const parent = new THREE.Group();
          parent.add(second);
          parent.add(child);
          parent.name = 'diamond';
          scene.add(parent);
        }
      });
    });

    const skyColor = 0xb1e1ff; // light blue

      
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
