varying vec3 V;//view position
varying vec3 N;//viewspace normal
void main() {
	vec4 m= modelMatrix*vec4(position, 1.0);
	vec4 mv= modelViewMatrix*vec4(position, 1.0);
	N= normalMatrix*normal;
	vec4 mvp= projectionMatrix*mv;
	V= vec3(mvp.xy/mvp.w, 1.);
	gl_Position= mvp; 
}