varying vec3 oP;//object vert position
varying vec3 wP;//world position
varying vec3 vN;//view normal
varying vec3 wN;//world normal
varying vec3 vV;//view view direction
varying vec3 wV;//world view direction

void main(){
	mat3 worldNormalMatrix= mat3(modelMatrix);
	//bug: orthoabnormal model matrix causes direction vector skew
	//nonuniform scale models are very rare though

	oP= position;

	vec4 m= modelMatrix*vec4(oP, 1.);
	wP= m.xyz;
	vec4 mv= modelViewMatrix*vec4(oP, 1.);

	vN= normalMatrix*normal;
	wN= worldNormalMatrix*normal;

	vec4 mvp= projectionMatrix*mv;

	vV= vec3(mvp.xy/mvp.w, 1.);//.xzy;
	wV= m.xyz-cameraPosition;

	//fix worldspace handedness for cubemap
	wP.x*= -1.;
	wN.x*= -1.;
	wV.x*= -1.;

	gl_Position= mvp; 
}