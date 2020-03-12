//@import lib
#line 3

#define PI  3.14159265359
#define TAU (PI*2.)
#define PHI 1.61803399
vec3 nse33(vec3 p){
	return fract(tan((p+p.x+p.y+p.z)*vec3(PHI,PHI*PHI,PHI*PHI*PHI))*512.);
}


//fixme share attributes with diamond using a header instead of copypaste
varying vec3 oP;//object vert position
varying vec3 wP;//world position
varying vec3 vN;//view normal
varying vec3 wN;//world normal
varying vec3 vV;//view view direction
varying vec2 vUV;//screenspace[0,1]
varying vec3 wV;//world view direction

uniform float time;
uniform float inclusion;

void main(){
	mat3 worldNormalMatrix= mat3(modelMatrix);
	//bug: orthoabnormal model matrix causes direction vector skew
	//nonuniform scale models are very rare though

	
	vec3 p= position;
	vec3 n= normal;
	p+= nse33(p*69.420)*inclusion*sin(time*69.);

	oP= p;

	vec4 m= modelMatrix*vec4(oP, 1.);
	wP= m.xyz;
	vec4 mv= modelViewMatrix*vec4(oP, 1.);

	vN= normalMatrix*n;
	wN= worldNormalMatrix*n;

	vec4 mvp= projectionMatrix*mv;

	vV= vec3(mvp.xy/mvp.w, 1.);//.xzy;
	vUV= vV.xy*.5+.5;
	wV= m.xyz-cameraPosition;

	//fix worldspace handedness for cubemap
	wP.x*= -1.;
	wN.x*= -1.;
	wV.x*= -1.;

	gl_Position= mvp; 
}