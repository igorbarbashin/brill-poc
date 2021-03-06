//heavy fork of {3js/UnrealBloom by spidersharma} by khlorghaal
//forsakes the whole mip chain thing for a simple blur

import {
	AdditiveBlending,
	Color,
	NearestFilter,
	LinearFilter,
	MeshBasicMaterial,
	RGBAFormat,
	ShaderMaterial,
	UniformsUtils,
	Vector2,
	FloatType,
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
			float v = dot( texel.rgb, vec3(1.) );
			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );
			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );
			gl_FragColor = mix( outputColor, texel, alpha );
		}`

};


var BloomPass = function ( strength, resolution, iterations, threshold, ramp ) {
	Pass.call( this );

	this.strength = 1;
	this.iterations = iterations||32;
	this.threshold = 1;
	this.ramp= ramp||.1;
	this.resolution = new Vector2(1,1);//gets initialized properly by init::resize

	// create color only once here, reuse it later inside the render function
	this.clearColor = new Color(0);

	// render targets
	var pars = { 
		minFilter: NearestFilter,
		magFilter: LinearFilter,
		format: RGBAFormat, 
		type: FloatType,
		depthBuffer: false,
		stencilBuffer: false,
	};
	const resx = this.resolution.x;
	const resy = this.resolution.y;

	this.renderTargetBright = new WebGLRenderTarget( resx, resy, pars );
	this.renderTargetBright.texture.name = "BloomPass.bright";
	this.renderTargetBright.texture.generateMipmaps = false;
	//delete pars.type;//todo performance: only first pass needs hdr //this makes it unhappy, find where exactly to collapse hdr

	var renderTargetHorizonal = new WebGLRenderTarget( resx, resy, pars );
	renderTargetHorizonal.texture.name = "BloomPass.h";
	renderTargetHorizonal.texture.generateMipmaps = false;
	this.renderTargetHorizontal= renderTargetHorizonal;

	var renderTargetVertical = new WebGLRenderTarget( resx, resy, pars );
	renderTargetVertical.texture.name = "BloomPass.v";
	renderTargetVertical.texture.generateMipmaps = false;
	this.renderTargetVertical= renderTargetVertical;

	// luminosity high pass material
	if ( LuminosityHighPassShader === undefined )
		console.error( "BloomPass relies on LuminosityHighPassShader" );

	var highPassShader = LuminosityHighPassShader;
	this.highPassUniforms = UniformsUtils.clone( highPassShader.uniforms );

	this.highPassUniforms.luminosityThreshold.value = threshold;
	this.highPassUniforms.smoothWidth.value = 1./128.;

	this.materialHighPassFilter = new ShaderMaterial( {
		uniforms: this.highPassUniforms,
		vertexShader: highPassShader.vertexShader,
		fragmentShader: highPassShader.fragmentShader,
		defines: {}
	} );

	this.separableBlurMaterial= new ShaderMaterial( {
		uniforms: {
			colorTexture: { value: null },
			invSize: { value: new Vector2( 1./resx, 1./resy ) },
			direction: { value: new Vector2(0.) },
			samples: { value: this.iterations },
			ramp: { value: this.ramp },
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
			uniform vec2 invSize;
			uniform vec2 direction;
			uniform int samples;
			uniform float ramp;
			void main() {
				vec3 acc;
				vec2 d= direction*invSize;
				float sum= 0.;
				//this gets significantly better perf than O(n) because caching
				for(int r=-samples/2; r<=samples/2; r++){
					float w= float(r);
					w= exp(-w*w/float(samples)*ramp);
					sum+= w;
					acc+= texture2D(colorTexture, vUv+d*float(r)).rgb*w;
				}
				acc/= sum;
				gl_FragColor= vec4(acc, 1.0);
			}`
	} );
	//todo adaptive resolution


	// copy material
	if ( CopyShader === undefined )
		console.error( "BloomPass relies on CopyShader" );

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
		this.renderTargetHorizontal.dispose();
		this.renderTargetVertical.dispose();
	},

	setSize: function ( width, height ) {
		//todo fix anamorphism from renderbuffer mismatched aspect ratio
		var resx = Math.floor(width);
		var resy = Math.floor(height);
		this.resolution.x= resx;
		this.resolution.y= resy;
		this.renderTargetBright.setSize(resx, resy);
		this.renderTargetHorizontal.setSize(resx, resy);
		this.renderTargetVertical.setSize(resx, resy);
		this.separableBlurMaterial.uniforms.invSize.value.x= 1./resx;
		this.separableBlurMaterial.uniforms.invSize.value.y= 1./resy;
	},

	render: function ( renderer, writeBuffer, readBuffer, deltaTime, maskActive ) {
		this.oldClearColor.copy( renderer.getClearColor() );
		this.oldClearAlpha = renderer.getClearAlpha();
		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.setClearColor( this.clearColor, 0 );

		//fixme dont directly sample from input buffer, downsample it by powers of 2

		if ( maskActive ) renderer.state.buffers.stencil.setTest( false );

		if ( this.renderToScreen ) {
			this.fsQuad.material = this.basic;
			this.basic.map = readBuffer.texture;

			renderer.setRenderTarget( null );
			renderer.clear();
			this.fsQuad.render( renderer );
		}

		// 1. Extract Bright Areas
		this.highPassUniforms.tDiffuse.value = readBuffer.texture;
		this.highPassUniforms.luminosityThreshold.value = this.threshold;
		this.fsQuad.material = this.materialHighPassFilter;

		renderer.setRenderTarget( this.renderTargetBright );
		renderer.clear();
		this.fsQuad.render( renderer );

		var inputRenderTarget = this.renderTargetBright;


		this.fsQuad.material = this.separableBlurMaterial;

		this.separableBlurMaterial.uniforms.colorTexture.value = inputRenderTarget.texture;
		this.separableBlurMaterial.uniforms.direction.value = BloomPass.BlurDirectionX;
		renderer.setRenderTarget( this.renderTargetHorizontal);
		renderer.clear();
		this.fsQuad.render( renderer );

		this.separableBlurMaterial.uniforms.colorTexture.value = inputRenderTarget.texture;
		this.separableBlurMaterial.uniforms.direction.value = BloomPass.BlurDirectionY;
		renderer.setRenderTarget( this.renderTargetVertical);
		renderer.clear();
		this.fsQuad.render( renderer );

		//todo stars/flare

		inputRenderTarget = this.renderTargetVertical;


		// Blend it additively over the input texture
		this.fsQuad.material = this.materialCopy;
		this.copyUniforms.tDiffuse.value = this.renderTargetHorizontal.texture;

		if ( maskActive ) renderer.state.buffers.stencil.setTest( true );

		//i dislike this pattern but whatever -khlor
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
