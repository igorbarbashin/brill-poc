varying vec3 O;//object vert position
varying vec3 V;//view position
varying vec3 N;//viewspace normal
void main() {
	O= position;
	vec4 m= modelMatrix*vec4(O, 1.);
	vec4 mv= modelViewMatrix*vec4(position, 1.);
	N= normalMatrix*normal;
	vec4 mvp= projectionMatrix*mv;
	V= vec3(mvp.xy/mvp.w, 1.);
	gl_Position= mvp; 
}