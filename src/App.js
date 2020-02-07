import React, { useEffect } from 'react';
import * as THREE from 'three';
import { VertexShader, FragmentShader } from './Shader';
import './App.css';

function App() {

  var camera, scene, renderer, geometry, material, mesh;

  useEffect(() => {
    
    init();
    animate();

  })

  function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    // material = new THREE.MeshNormalMaterial();
    let uniforms = {
      colorB: {type: 'vec3', value: new THREE.Color(0xACB6E1)},
      colorA: {type: 'vec3', value: new THREE.Color(0x74ebd5)}
    }
    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      fragmentShader: FragmentShader(),
      vertexShader: VertexShader(),
    })
    mesh = new THREE.Mesh( geometry, material );
    camera.position.z = 1;
  
    scene.add( mesh );
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    renderer.render( scene, camera );

  }
  
  function animate() {
  
    requestAnimationFrame( animate );
  
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
  
    renderer.render( scene, camera );
  
  }

  return (
    <></>
  );
}

export default App;
