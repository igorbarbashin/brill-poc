uniform samplerCube env;
varying vec3 V;
varying vec3 N;
void main () {
	vec3 nV= normalize(V);
	vec3 nN= normalize(N);
	vec3 R= reflect(nV,nN);
	gl_FragColor= textureCube(env, R);
}