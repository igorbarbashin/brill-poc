import React, { useEffect } from 'react';
import * as THREE from 'three';
import './App.css';

function App() {

  const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer( { antialias: true } );
  const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
  const material = new THREE.MeshNormalMaterial();
  const mesh = new THREE.Mesh( geometry, material );


  useEffect(() => {
    
    camera.position.z = 1;
  
    scene.add( mesh );
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    renderer.render( scene, camera );
    
    animate();
  })

  
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
