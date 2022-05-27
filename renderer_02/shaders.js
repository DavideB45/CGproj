flatShader = function (gl) {
  var vertexShaderSource = `
    uniform   mat4 uModelMatrix;// matrice per portare l'oggetto nel mondo            
    uniform   mat4 uProjectionMatrix;// matrice per proiettare sullo schermo
    uniform   mat4 uViewMatrix;// matrice di vista
    uniform   mat4 uViewInverted;// inverse della matrice di vista
    uniform   mat4 uNormalMatrix;// inversa della matrice modello
    uniform   vec3 uLightDirection;

    attribute vec3 aPosition; 
    attribute vec3 aNormal;
    attribute vec3 aTexCoord;

    varying vec3 vPos;// posizione del vertice
    varying vec3 viewPos;// Direzione di vista
    varying vec3 lDir;// direzione luce solare
    varying vec3 iNor;// normale interpolata

    varying vec3 vTexCoord;// coordinata texture interpolata

    void main(void)                                
    {
      vPos = (uModelMatrix*vec4(aPosition, 1.0)).xyz;
      // ci va il model matrix? inverted view
      //viewPos = normalize(uViewInverted*vec4(0, 0, -1, 0)).xyz;// sbagliato (giusto di giorno)
      //viewPos = normalize(uViewMatrix*uModelMatrix*vec4(aPosition, 1)).xyz;// sbagliato 2 (sembra che la luce venga dal centro)
      //viewPos = normalize(uViewMatrix*vec4(0, 0, -1, 0)).xyz;// sbagilato
      //viewPos = normalize(uModelMatrix*uViewInverted*vec4(0,0,-1,0)).xyz;
      //viewPos = normalize(uModelMatrix*vec4(normalize(uViewInverted*vec4(0,0,1,0)).xyz, 0)).xyz;
      //viewPos = normalize(uViewInverted*vec4(aPosition, 0)).xyz;
      //viewPos = -normalize(uModelMatrix*vec4(aPosition, 0)).xyz;
      viewPos = normalize(vPos);

      lDir = normalize(vec4(uLightDirection,0)).xyz;

      //iNor = normalize((uNormalMatrix*vec4(aNormal, 0.0)).xyz);
      iNor = aNormal;

      vTexCoord = aTexCoord;
	    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;
//flat Shader
  var fragmentShaderSource = `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;

  #define ARR_MAX_LEN 20
  struct spotlight {
    vec3 color;// in RGB space
    vec3 position;// in wordSpace
    vec3 direction;// in wordSpace
  };
  uniform int n_spotlight;
  uniform spotlight arrayLamp[ARR_MAX_LEN];

  varying vec3 vPos;// fragment pos
  varying vec3 viewPos;// view direction
  varying vec3 lDir;// light direction
  varying vec3 iNor;// interpolated normal

  uniform int shadingMode;// 0_flat_shading  1_Phong_shading 2_no_light
  uniform int textureMode;// 0_no_texture 1_use_texture_basic 2_use_texture_+_bump
  uniform vec4 uColor;
  varying vec3 vTexCoord;

  // transform a vector in a vector of RGB
  vec3 color_of_vector(vec3 v);
  // compute the diffusive component
  float diffusiveL(vec3 liDir, vec3 lPos, vec3 viewDir, vec3 N);

  void main(void){     
    if(shadingMode < 2){
      vec3 N;
      if(shadingMode == 0){
        N = normalize(cross( dFdx(vPos), dFdy(vPos) ));
      } else {
        N = iNor;
      }

      float kDiffuse = 0.1;
      vec3 vDir = viewPos;

      if(dot(lDir, vec3(0, -1, 0)) < 0.0){
        kDiffuse = max(dot(lDir, N), 0.2);
      } else {
        for(int i = 0; i < 12 ; i++){// prec max 12
          if(vPos.x < arrayLamp[i].position.x + 0.6 && 
            vPos.x > arrayLamp[i].position.x - 0.6 &&
            vPos.y < arrayLamp[i].position.y - 0.2 && 
            vPos.y > arrayLamp[i].position.y - 0.8 &&
            vPos.z < arrayLamp[i].position.z + 0.6 && 
            vPos.z > arrayLamp[i].position.z - 0.6){
            kDiffuse = 1.0;
            break;
          } else{
            kDiffuse += diffusiveL(
              normalize(arrayLamp[i].position - vPos),
              normalize(-arrayLamp[i].direction),
              vDir,
              N
            );
          }
        }
        kDiffuse += 0.25;
      }
      vec3 lDiffuse = (uColor.xyz + vec3(0.0, 0.0, 0))*kDiffuse;
      gl_FragColor = vec4(lDiffuse, 1.0);

    } else {
      vec3 N = cross( dFdx(vPos), dFdy(vPos) );
	    gl_FragColor = vec4(color_of_vector(N), 1.0);
    }
  }

  vec3 color_of_vector(vec3 v){
    return normalize(v)*0.5 + vec3(0.5);
  }

  float diffusiveL(vec3 liDir, vec3 lPos, vec3 viewDir, vec3 N){
    float cosangle = dot(liDir, lPos);
    if(cosangle < 0.2){
      return 0.0;
    } else {
      if(cosangle > 0.997){
        return 0.3;
      }
      if(dot(liDir,N) < 0.0){
        return 0.0;
      }
      float pick = max(dot(liDir,N), 0.2);
      return (pow(5.0, -pow((cosangle-0.6)/0.3, 4.0))/(12.0*pick));
    }
  }
  `;


  gl.getExtension('OES_standard_derivatives');
  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  var aPositionIndex = 0;
  var aNormalIndex = 1;
  var aTexCoordIndex = 2;
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal");
  gl.bindAttribLocation(shaderProgram, aTexCoordIndex, "aTexCoord");
  
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    var str = "Unable to initialize the shader program.\n\n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.aTexCoordIndex = aTexCoordIndex;
  shaderProgram.uModelMatrxLocation = gl.getUniformLocation(shaderProgram, "uModelMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

  shaderProgram.shadingMode = gl.getUniformLocation(shaderProgram, "shadingMode");
  shaderProgram.textureMode = gl.getUniformLocation(shaderProgram, "textureMode")
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");
  shaderProgram.uLightDirection = gl.getUniformLocation(shaderProgram, "uLightDirection");
  shaderProgram.uViewInvertedLocation = gl.getUniformLocation(shaderProgram, "uViewInverted");
  shaderProgram.uNormalMatrixLocation = gl.getUniformLocation(shaderProgram, "uNormalMatrix");

  shaderProgram.n_spotlight = gl.getUniformLocation(shaderProgram, "n_spotlight");
  shaderProgram.maxSpotlight = 20;
  shaderProgram.spotlightPos = [];
  shaderProgram.spotlightCol = [];
  shaderProgram.spotlightDir = [];
  for(i = 0; i < shaderProgram.maxSpotlight; i++){
    shaderProgram.spotlightPos[i] = gl.getUniformLocation(shaderProgram, "arrayLamp[" + i + "].position");
    shaderProgram.spotlightCol[i] = gl.getUniformLocation(shaderProgram, "arrayLamp[" + i + "].color");
    shaderProgram.spotlightDir[i] = gl.getUniformLocation(shaderProgram, "arrayLamp[" + i + "].direction");
  }

  return shaderProgram;
};