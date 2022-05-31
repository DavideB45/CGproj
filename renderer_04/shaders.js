flatShader = function (gl) {
  var vertexShaderSource = `
    uniform   mat4 uModelMatrix;// matrice per portare l'oggetto nel mondo            
    uniform   mat4 uProjectionMatrix;// matrice per proiettare sullo schermo
    uniform   mat4 uViewMatrix;// matrice di vista
    uniform   mat4 uCarLightMatrix;// matrice di vista dalla luce del veicolo
    uniform   vec3 uLightDirection;

    attribute vec3 aPosition; 
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;

    varying vec3 vPos;// posizione del vertice
    varying vec3 lDir;// direzione luce solare
    varying vec3 iNor;// normale interpolata

    varying vec2 vTexCoord;// coordinata texture interpolata
    varying vec4 vTexCoordFanale;// coordinata texture interpolata del fanale

    void main(void)                                
    {
      vPos = (uModelMatrix*vec4(aPosition, 1.0)).xyz;
      lDir = normalize(uLightDirection);
      iNor = aNormal;

      vTexCoordFanale = (uCarLightMatrix*uModelMatrix*vec4(aPosition,1.0));
      vTexCoord = aTexCoord;

	    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
      //gl_Position = uCarLightMatrix * uModelMatrix * vec4(aPosition, 1.0);
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

  uniform vec4 uColor;// colore dell'oggetto
  uniform int shadingMode;// -1_use_texture 0_flat_shading  1_Phong_shading 2_no_light
  uniform int textureMode;// 0_no_texture 1_use_texture_basic 2_use_texture_+_bump
  uniform float glowLevel;// between 0 and 1
  
  uniform vec3 uViewPosition;// posizione della camera
  uniform vec3 uLightPosition;// posizione della luce
  varying vec3 vPos;// fragment pos
  varying vec3 lDir;// light direction
  varying vec3 iNor;// interpolated normal

  uniform sampler2D uSampler;// texture dell'oggetto
  uniform sampler2D uCarLight;// texture della luce del veicolo
  uniform sampler2D uShadowMap;// texture delle ombre
  varying vec2 vTexCoord;// coordinate texture del frammento
  varying vec4 vTexCoordFanale;// coordinata texture interpolata del fanale

  // transform a vector in a vector of RGB
  vec3 color_of_vector(vec3 v);
  
  // compute the specular component
  float specularL(vec3 lDir, vec3 lPos, vec3 viewDir, vec3 N);

  // compute the diffusive component
  float diffusiveL(vec3 liDir, vec3 lPos, vec3 viewDir, vec3 N);
  
  // get color according to texture mode
  vec4 getBaseColor();

  void main(void){     
    if(shadingMode < 2){
      vec3 N;
      if(shadingMode == 0){
        N = normalize(cross( dFdx(vPos), dFdy(vPos) ));
      } else if(shadingMode == 1){
        N = iNor;
      } else {
        float dTu = texture2D(uSampler,vTexCoord).x -texture2D(uSampler,vTexCoord+vec2(2.0/512.0,0.0)).x;
				float dTv = texture2D(uSampler,vTexCoord).x -texture2D(uSampler,vTexCoord+vec2(0.0,2.0/512.0)).x;
				N = normalize(cross(vec3(1.0,0.0,dTu),vec3(0.0,1.0,dTv)));
        N = vec3(N.y, N.z, N.x);
      }

      float kDiffuse = 0.1;
      float kSpec = 0.1;
      vec3 lSpecular;
      vec3 lDiffuse;
      vec3 vDir = normalize(uViewPosition-vPos);

      if(dot(lDir, vec3(0, -1, 0)) < 0.0){
        vec3 R = -lDir + 2.0*dot(lDir, N)*N;
        kSpec = max(0.0, pow(dot(vDir, R), 29.0))/1.5;
        lSpecular = (getBaseColor().rgb+vec3(1.0, 1.0, 1.0))*kSpec;
        kDiffuse = max(dot(lDir, N), 0.2);
        lDiffuse = getBaseColor().rgb*kDiffuse*1.5;
      } else {
        lSpecular = vec3(0.0, 0.0, 0.0);
        lDiffuse = vec3(0.0, 0.0, 0.0);
        for(int i = 0; i < 12 ; i++){// prec max 12
          if(vPos.x < arrayLamp[i].position.x + 0.6 && vPos.x > arrayLamp[i].position.x - 0.6 &&vPos.y < arrayLamp[i].position.y - 0.2 && vPos.y > arrayLamp[i].position.y - 0.8 &&vPos.z < arrayLamp[i].position.z + 0.6 && vPos.z > arrayLamp[i].position.z - 0.6){
            kDiffuse = 1.0;
            lDiffuse = arrayLamp[i].color*0.5 + getBaseColor().rgb*0.5;
            break;
          } else{
            vec3 light_to_frag = arrayLamp[i].position - vPos;
            kSpec = specularL(normalize(light_to_frag),normalize(-arrayLamp[i].direction),vDir,N);
            kDiffuse = diffusiveL(normalize(light_to_frag),normalize(-arrayLamp[i].direction),vDir,N);
            lSpecular += (arrayLamp[i].color)*kSpec;
            if(kDiffuse > 0.0){
              lDiffuse += getBaseColor().rgb*kDiffuse*0.8 + arrayLamp[i].color*kDiffuse*0.5;
            }else{
              lDiffuse += getBaseColor().rgb*0.02;
            }
          }
        }                    //portare in spazio texture    
        vec3 tC = (vec3(vTexCoordFanale/vTexCoordFanale.w).xyz)*0.5 + vec3(0.5, 0.5, 0.5);
        float x = tC.x;
        float y = tC.y;
        if(x > 0.0 && x < 1.0 &&
          y > 0.0 && y < 1.0 &&
          vTexCoordFanale.w > 0.0 &&
          dot(N, (uLightPosition - vPos)) > 0.0){
            float lightContribution = 0.0;
            for(float i = 0.0; i < 5.0 ; i++){
              for(float j = 0.0; j < 5.0 ; j++){
                if(texture2D(uShadowMap, vec2(x,y) + vec2(i-2.0, j-2.0)/1024.0).x > tC.z &&
                x < 0.99 && x > 0.01 &&
                y < 0.99 && y > 0.01){
                  lightContribution += 1.0/25.0;
                }
              }
            }
            lDiffuse += lightContribution*(texture2D(uCarLight, vec2(x,y)).rgb)*pow(texture2D(uCarLight, vec2(x,y)).a, 1.0)/vTexCoordFanale.w;
        }
      }
      gl_FragColor = vec4(lDiffuse + lSpecular*glowLevel, 1.0);
      //gl_FragColor = vec4(color_of_vector(N), 1.0);
    
    } else {
      vec3 N = cross( dFdx(vPos), dFdy(vPos) );
	    gl_FragColor = vec4(color_of_vector(N), 1.0);
    }
  }

  vec3 color_of_vector(vec3 v){
    return normalize(v)*0.5 + vec3(0.5);
  }

  float specularL(vec3 liDir, vec3 lPos, vec3 viewDir, vec3 N){
    float cosangle = dot(liDir, lPos);
    if(cosangle < 0.2){
      return 0.0;
    } else {
      if(cosangle > 0.997){
        return 0.3;
      }
      vec3 R = -liDir + 2.0*dot(liDir, N)*N;
      float pick = max(0.0, pow(dot(viewDir, R), 233.0));
      if(pick < -10.0){
        return 0.0;
      }
      return pick*(pow(5.0, -pow((cosangle-0.6)/0.3, 2.0)));
    }
  }
  
  float diffusiveL(vec3 liDir, vec3 lPos, vec3 viewDir, vec3 N){
    float cosangle = dot(liDir, lPos);
    if(cosangle < 0.2){
      return 0.0;
    } else {
      if(cosangle > 0.997){
        return 0.2;
      }
      if(dot(liDir,N) < 0.0){
        return 0.0;
      }
      float pick = max(dot(liDir,N), 0.2);
      return (pow(5.0, -pow((cosangle-0.6)/0.3, 4.0))/(12.0*pick));
    }
  }

  //textureMode :: 0_no_texture 1_use_texture_basic
  vec4 getBaseColor(){
    if(textureMode == 1){
      //return vec4(vTexCoord.x, vTexCoord.y, 0.0, 1.0);
      return texture2D(uSampler, vec2(vTexCoord.x, vTexCoord.y));
    } else {
      return uColor;
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
  shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.uCarLight = gl.getUniformLocation(shaderProgram, "uCarLight");
  shaderProgram.uShadowMap = gl.getUniformLocation(shaderProgram, "uShadowMap");
  shaderProgram.textureMode = gl.getUniformLocation(shaderProgram, "textureMode")
  
  shaderProgram.shadingMode = gl.getUniformLocation(shaderProgram, "shadingMode");
  shaderProgram.glowLevel = gl.getUniformLocation(shaderProgram, "glowLevel");
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");
  shaderProgram.uViewPosition = gl.getUniformLocation(shaderProgram, "uViewPosition");
  shaderProgram.uLightPosition = gl.getUniformLocation(shaderProgram, "uLightPosition");
  shaderProgram.uCarLigthMatrixLocation = gl.getUniformLocation(shaderProgram, "uCarLightMatrix");
  shaderProgram.uLightDirection = gl.getUniformLocation(shaderProgram, "uLightDirection");
  
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