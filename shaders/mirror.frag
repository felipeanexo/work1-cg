precision highp float;

uniform sampler2D uBaseTex;
uniform sampler2D uReflectionTex;
uniform mat4 uMirrorVP;
uniform vec3 uTint;
uniform float uReflectStrength;
uniform float uOpacity;
uniform vec3 uReflectNormal;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 base = texture2D(uBaseTex, vUv).rgb * uTint;
  vec3 color = base;

  vec3 N = normalize(vWorldNormal);
  if (!gl_FrontFacing) {
    N = -N;
  }
  float reflectMask = step(0.0, dot(N, normalize(uReflectNormal)));

  if (reflectMask > 0.5) {
    vec4 clipPos = uMirrorVP * vec4(vWorldPos, 1.0);
    float w = clipPos.w;
    if (w > 0.0) {
      vec2 uv = (clipPos.xy / w) * 0.5 + 0.5;
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        vec3 refl = texture2D(uReflectionTex, uv).rgb;
        color = mix(base, refl, clamp(uReflectStrength, 0.0, 1.0));
      }
    }
  }

  float alpha = mix(1.0, clamp(uOpacity, 0.02, 1.0), reflectMask);
  gl_FragColor = vec4(color, alpha);
}
