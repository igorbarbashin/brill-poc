varying vec3 oP;//object vert position
varying vec3 wP;//world position
varying vec3 vN;//view normal
varying vec3 wN;//world normal
varying vec3 vV;//view view direction
varying vec2 vUV;//screenspace[0,1]
varying vec3 wV;//world view direction

#define PI  3.14159265359
#define TAU (PI*2.)
#define PHI 1.61803399
vec3 nse33(vec3 p){
	return fract(tan(p*vec3(PHI,PHI*PHI,PHI*PHI*PHI))*512.);
}

uniform float time;
uniform float excitement;
uniform float dance;

void main(){
	mat3 worldNormalMatrix= mat3(modelMatrix);
	//bug: orthoabnormal model matrix causes direction vector skew
	//nonuniform scale models are very rare though

	vec3 p= position;
	{
		vec3 t= (p+time)*excitement;
		vec3 fr= fract(t);
		vec3 f= nse33(floor(t));
		vec3 c= nse33( ceil(t));
		p+= (mix(f,c,fr)*2.-1.)*dance;
	}
	oP= p;

	vec4 m= modelMatrix*vec4(oP, 1.);
	wP= m.xyz;
	vec4 mv= modelViewMatrix*vec4(oP, 1.);

	vN= normalMatrix*normal;
	wN= worldNormalMatrix*normal;

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