//heavy fork of 3js/UnrealBloom

import {
	AdditiveBlending,
	Color,
	LinearFilter,
	MeshBasicMaterial,
	RGBAFormat,
	ShaderMaterial,
	UniformsUtils,
	Vector2,
	Vector3,
	WebGLRenderTarget
} from "three/build/three.module.js";
import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";

const LuminosityHighPassShader = {

	shaderID: "luminosityHighPass",

	uniforms: {
		tDiffuse: { value: null },
		luminosityThreshold: { value: 1.0 },
		smoothWidth: { value: 1.0 },
		defaultColor: { value: new Color( 0x000000 ) },
		defaultOpacity: { value: 0.0 }
	},

	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
	fragmentShader: `
		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D(tDiffuse, vUv);
			float v = dot( texel.rgb, vec3(.299,.587,.114) );
			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );
			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );
			gl_FragColor = mix( outputColor, texel, alpha );
		}`

};


/**
 * UnrealBloomPass is inspired by the bloom pass of Unreal Engine. It creates a
 * mip map chain of bloom textures and blurs them with different radii. Because
 * of the weighted combination of mips, and because larger blurs are done on
 * higher mips, this effect provides good quality and performance.
 *
 * Reference:
 * - https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */
var BloomPass = function ( strength, resolution, radius, threshold ) {
	Pass.call( this );

	this.strength = 1;
	this.radius = 16;
	this.threshold = 1;
	this.resolution = new Vector2( 256, 256 );

	// create color only once here, reuse it later inside the render function
	this.clearColor = new Color( 0, 0, 0 );

	// render targets
	var pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat };
	this.renderTargetsHorizontal = [];
	this.renderTargetsVertical = [];
	var resx = Math.round( this.resolution.x / 2 );
	var resy = Math.round( this.resolution.y / 2 );

	this.renderTargetBright = new WebGLRenderTarget( resx, resy, pars );
	this.renderTargetBright.texture.name = "BloomPass.bright";
	this.renderTargetBright.texture.generateMipmaps = false;

	{
		var renderTargetHorizonal = new WebGLRenderTarget( resx, resy, pars );

		renderTargetHorizonal.texture.name = "BloomPass.h";
		renderTargetHorizonal.texture.generateMipmaps = false;

		this.renderTargetsHorizontal.push( renderTargetHorizonal );

		var renderTargetVertical = new WebGLRenderTarget( resx, resy, pars );

		renderTargetVertical.texture.name = "BloomPass.v";
		renderTargetVertical.texture.generateMipmaps = false;

		this.renderTargetsVertical.push( renderTargetVertical );

		resx = Math.round( resx / 2 );
		resy = Math.round( resy / 2 );

	}

	// luminosity high pass material

	if ( LuminosityHighPassShader === undefined )
		console.error( "BloomPass relies on LuminosityHighPassShader" );

	var highPassShader = LuminosityHighPassShader;
	this.highPassUniforms = UniformsUtils.clone( highPassShader.uniforms );

	this.highPassUniforms[ "luminosityThreshold" ].value = threshold;
	this.highPassUniforms[ "smoothWidth" ].value = 1./128.;

	this.materialHighPassFilter = new ShaderMaterial( {
		uniforms: this.highPassUniforms,
		vertexShader: highPassShader.vertexShader,
		fragmentShader: highPassShader.fragmentShader,
		defines: {}
	} );

	// Gaussian Blur Materials
	var resx = Math.round( this.resolution.x / 2 );
	var resy = Math.round( this.resolution.y / 2 );

	this.separableBlurMaterial= new ShaderMaterial( {
		uniforms: {
			"colorTexture": { value: null },
			"texSize": { value: new Vector2( 0.5, 0.5 ) },
			"direction": { value: new Vector2( 0.5, 0.5 ) }
		},

		vertexShader:`
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,
		fragmentShader:`
			#include <common>
			varying vec2 vUv;
			uniform sampler2D colorTexture;
			uniform vec2 texSize;
			uniform vec2 direction;
			void main() {
				vec2 invSize = 1.0 / texSize;
				vec3 acc;
				vec2 d= direction*invSize;
				acc+= texture2D(colorTexture, vUv+d*-2.).rgb/5.;
				acc+= texture2D(colorTexture, vUv+d*-1.).rgb/5.;
				acc+= texture2D(colorTexture, vUv+d* 0.).rgb/5.;
				acc+= texture2D(colorTexture, vUv+d* 1.).rgb/5.;
				acc+= texture2D(colorTexture, vUv+d* 2.).rgb/5.;
				gl_FragColor= vec4(acc, 1.0);
			}`
	} );
	this.separableBlurMaterial.uniforms[ "texSize" ].value = new Vector2( resx, resy );


	// copy material
	if ( CopyShader === undefined ) {

		console.error( "BloomPass relies on CopyShader" );

	}

	var copyShader = CopyShader;

	this.copyUniforms = UniformsUtils.clone( copyShader.uniforms );
	this.copyUniforms[ "opacity" ].value = 1.0;

	this.materialCopy = new ShaderMaterial( {
		uniforms: this.copyUniforms,
		vertexShader: copyShader.vertexShader,
		fragmentShader: copyShader.fragmentShader,
		blending: AdditiveBlending,
		depthTest: false,
		depthWrite: false,
		transparent: true
	} );

	this.enabled = true;
	this.needsSwap = false;

	this.oldClearColor = new Color();
	this.oldClearAlpha = 1;

	this.basic = new MeshBasicMaterial();

	this.fsQuad = new Pass.FullScreenQuad( null );

};

BloomPass.prototype = Object.assign( Object.create( Pass.prototype ), {
	constructor: BloomPass,

	dispose: function () {
		this.renderTargetBright.dispose();
	},

	setSize: function ( width, height ) {
		var resx = Math.round( width / 2 );
		var resy = Math.round( height / 2 );

		this.renderTargetBright.setSize( resx, resy );

		this.separableBlurMaterial.uniforms[ "texSize"].value = new Vector2( resx, resy );
	},

	render: function ( renderer, writeBuffer, readBuffer, deltaTime, maskActive ) {
		this.oldClearColor.copy( renderer.getClearColor() );
		this.oldClearAlpha = renderer.getClearAlpha();
		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.setClearColor( this.clearColor, 0 );

		if ( maskActive ) renderer.state.buffers.stencil.setTest( false );

		// Render input to screen

		if ( this.renderToScreen ) {
			this.fsQuad.material = this.basic;
			this.basic.map = readBuffer.texture;

			renderer.setRenderTarget( null );
			renderer.clear();
			this.fsQuad.render( renderer );
		}

		// 1. Extract Bright Areas

		this.highPassUniforms[ "tDiffuse" ].value = readBuffer.texture;
		this.highPassUniforms[ "luminosityThreshold" ].value = this.threshold;
		this.fsQuad.material = this.materialHighPassFilter;

		renderer.setRenderTarget( this.renderTargetBright );
		renderer.clear();
		this.fsQuad.render( renderer );

		// 2. Blur All the mips progressively

		var inputRenderTarget = this.renderTargetBright;

		for ( var i = 0; i < this.nMips; i ++ ) {
			this.fsQuad.material = this.separableBlurMaterials[ i ];

			this.separableBlurMaterials[ i ].uniforms[ "colorTexture" ].value = inputRenderTarget.texture;
			this.separableBlurMaterials[ i ].uniforms[ "direction" ].value = BloomPass.BlurDirectionX;
			renderer.setRenderTarget( this.renderTargetsHorizontal[ i ] );
			renderer.clear();
			this.fsQuad.render( renderer );

			this.separableBlurMaterials[ i ].uniforms[ "colorTexture" ].value = this.renderTargetsHorizontal[ i ].texture;
			this.separableBlurMaterials[ i ].uniforms[ "direction" ].value = BloomPass.BlurDirectionY;
			renderer.setRenderTarget( this.renderTargetsVertical[ i ] );
			renderer.clear();
			this.fsQuad.render( renderer );

			inputRenderTarget = this.renderTargetsVertical[ i ];

		}

		// Blend it additively over the input texture
		this.fsQuad.material = this.materialCopy;
		this.copyUniforms[ "tDiffuse" ].value = this.renderTargetsHorizontal[ 0 ].texture;

		if ( maskActive ) renderer.state.buffers.stencil.setTest( true );

		if ( this.renderToScreen ) {
			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );
		} else {
			renderer.setRenderTarget( readBuffer );
			this.fsQuad.render( renderer );
		}

		// Restore renderer settings
		renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );
		renderer.autoClear = oldAutoClear;

	},
} );

BloomPass.BlurDirectionX = new Vector2( 1.0, 0.0 );
BloomPass.BlurDirectionY = new Vector2( 0.0, 1.0 );

export { BloomPass };
