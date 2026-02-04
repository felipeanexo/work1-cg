precision highp float;

uniform sampler2D uBaseTex;
uniform sampler2D uReflectionTexA;
uniform sampler2D uReflectionTexB;
uniform mat4 uMirrorVP;
uniform vec3 uCameraPos;
uniform float uOpacity;
uniform vec3 uTint;
uniform vec3 uMirrorNormal;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);
  float nv = clamp(abs(dot(N, V)), 0.0, 1.0);
  float fresnel = pow(1.0 - nv, 2.5);

  vec4 base = texture2D(uBaseTex, vUv) * vec4(uTint, 1.0);

  vec4 clipPos = uMirrorVP * vec4(vWorldPos, 1.0);
  float w = clipPos.w;
  
  vec4 reflection = vec4(0.0);
  if (w > 0.0) {
    vec2 reflectionUV = (clipPos.xy / w) * 0.5 + 0.5;
    
    if (reflectionUV.x >= 0.0 && reflectionUV.x <= 1.0 && 
        reflectionUV.y >= 0.0 && reflectionUV.y <= 1.0) {
      float side = step(0.0, dot(N, normalize(uMirrorNormal)));
      vec4 reflA = texture2D(uReflectionTexA, reflectionUV);
      vec4 reflB = texture2D(uReflectionTexB, reflectionUV);
      reflection = mix(reflB, reflA, side);
    } else {
      reflection = vec4(uTint * 0.3, 1.0);
    }
  } else {
    reflection = vec4(uTint * 0.3, 1.0);
  }

  float reflectAmount = clamp(0.20 + 0.80 * fresnel, 0.0, 1.0);

  float faceMask = step(0.8, abs(dot(N, normalize(uMirrorNormal))));
  float alpha = mix(1.0, clamp(uOpacity, 0.0, 1.0), faceMask);

  vec3 color = mix(base.rgb, reflection.rgb, reflectAmount * faceMask);
  gl_FragColor = vec4(color, alpha);
}
