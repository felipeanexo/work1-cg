precision highp float;

uniform sampler2D uBaseTex;
uniform sampler2D uReflectionTex;
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

  // Texture should be subtle when the material is opaque (more mirror-like),
  // and a bit more visible only as it becomes transparent.
  vec3 tex = texture2D(uBaseTex, vUv).rgb;
  float texLuma = dot(tex, vec3(0.2126, 0.7152, 0.0722));
  float alpha = clamp(uOpacity, 0.0, 1.0);
  float texInfluence = mix(0.06, 0.28, 1.0 - alpha);
  vec3 base = uTint * mix(vec3(1.0), vec3(texLuma), texInfluence);

  vec4 clipPos = uMirrorVP * vec4(vWorldPos, 1.0);
  float w = clipPos.w;
  
  vec4 reflection = vec4(0.0);
  if (w > 0.0) {
    vec2 reflectionUV = (clipPos.xy / w) * 0.5 + 0.5;
    
    if (reflectionUV.x >= 0.0 && reflectionUV.x <= 1.0 && 
        reflectionUV.y >= 0.0 && reflectionUV.y <= 1.0) {
      reflection = texture2D(uReflectionTex, reflectionUV);
    } else {
      reflection = vec4(uTint * 0.3, 1.0);
    }
  } else {
    reflection = vec4(uTint * 0.3, 1.0);
  }

  float ndm = dot(N, normalize(uMirrorNormal));
  float frontMask = step(0.0, ndm) * step(0.8, ndm); // only the orange-side face reflects

  // When opaque (alpha ~ 1), make it much more "mirror-like"; when transparent, reduce reflection.
  float reflectFloor = mix(0.08, 0.92, alpha);
  float reflectAmount = clamp(reflectFloor + (1.0 - reflectFloor) * fresnel, 0.0, 1.0);

  vec3 color = mix(base, reflection.rgb, reflectAmount * frontMask);
  // Premultiplied alpha for smoother fade (avoids "popping" when changing transparency).
  gl_FragColor = vec4(color * alpha, alpha);
}
