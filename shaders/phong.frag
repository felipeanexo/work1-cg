precision highp float;

uniform sampler2D uTexture;
uniform vec3 uAmbientColor;
uniform vec3 uLightColor;
uniform vec3 uLightDirection;
uniform vec3 uCameraPosition;
uniform vec3 uMaterialColor;
uniform float uShininess;
uniform float uSpecularStrength;
uniform float uOpacity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 L = normalize(uLightDirection);
  vec3 V = normalize(uCameraPosition - vWorldPosition);
  vec3 R = reflect(-L, N);

  float NdotL = max(dot(N, L), 0.0);
  float RdotV = max(dot(R, V), 0.0);

  vec3 ambient = uAmbientColor;
  vec3 diffuse = uLightColor * NdotL;
  vec3 specular = uLightColor * pow(RdotV, uShininess) * uSpecularStrength;

  vec4 texColor = texture2D(uTexture, vUv);
  vec3 finalColor = (ambient + diffuse + specular) * texColor.rgb * uMaterialColor;

  gl_FragColor = vec4(finalColor, uOpacity);
}
