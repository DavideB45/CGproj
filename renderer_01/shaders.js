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

    varying vec3 vPos;
    varying vec3 viewPos;
    varying vec3 lDir;

    varying vec3 iNor;

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
      viewPos = -normalize(uModelMatrix*vec4(aPosition, 0)).xyz;
      //viewPos = normalize(vPos);

      lDir = normalize(vec4(uLightDirection,0)).xyz;

      //iNor = normalize((uNormalMatrix*vec4(aNormal, 0.0)).xyz);
      iNor = aNormal;

	    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;
//flat Shader
  var fragmentShaderSource = `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;        
  uniform   mat4 uNormalMatrix;

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

  uniform int shadingMode;
  uniform vec4 uColor;

  // transform a vector in a vector of RGB
  vec3 color_of_vector(vec3 v);
  // compute the specular component
  float specularL(vec3 lDir, vec3 lPos, vec3 vieDir, vec3 N);
  // compute the diffusive component
  float diffusiveL(vec3 liDir, vec3 lPos, vec3 viewDir, vec3 N);

  void main(void){     
    if(shadingMode < 2){
      vec3 N;
      if(shadingMode == 0){
        //N = normalize(uNormalMatrix*vec4(normalize(cross( dFdx(vPos), dFdy(vPos) )), 0.0)).xyz;
        N = normalize(cross( dFdx(vPos), dFdy(vPos) ));
      } else {
        N = iNor;
      }

      float kDiffuse = 0.1;
      float kSpec = 0.0;
      vec3 vDir = viewPos;

      if(dot(lDir, vec3(0, -1, 0)) < 0.0){
        vec3 R = -lDir + 2.0*dot(lDir, N)*N;
        kSpec = max(0.0, pow(dot(vDir, -R), 29.0));
        kDiffuse = max(dot(lDir, N), 0.2);
      } else {
        for(int i = 10; i < 11 ; i++){// prec max 12
          if(vPos.x < arrayLamp[i].position.x + 0.6 && 
            vPos.x > arrayLamp[i].position.x - 0.6 &&
            vPos.y < arrayLamp[i].position.y - 0.2 && 
            vPos.y > arrayLamp[i].position.y - 0.8 &&
            vPos.z < arrayLamp[i].position.z + 0.6 && 
            vPos.z > arrayLamp[i].position.z - 0.6){
            kSpec = 1.0;
            break;
          } else{
            kSpec += specularL(
              normalize(arrayLamp[i].position - vPos),
              normalize(-arrayLamp[i].direction),
              normalize(-vDir),
              N
            );
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
      vec3 lSpec =  (uColor.xyz + vec3(10.0, 0.0, 0.0))*kSpec;

      gl_FragColor = vec4(lDiffuse + lSpec, 1.0);
      //gl_FragColor = vec4(color_of_vector(vDir), 1.0);

    } else {
      vec3 N = cross( dFdx(vPos), dFdy(vPos) );
	    gl_FragColor = vec4(color_of_vector(N), 1.0);
    }
  }

  vec3 color_of_vector(vec3 v){
    return normalize(v)*0.5 + vec3(0.5);
  }

  float specularL(vec3 liDir, vec3 lPos, vec3 vieDir, vec3 N){
    float cosangle = dot(liDir, lPos);
    if(cosangle < 0.2){
      return 0.0;
    } else {
      if(cosangle > 0.997){
        return 0.3;
      }
      vec3 R = liDir + 2.0*dot(-liDir, N)*N;
      float pick = max(0.0, pow(dot(vieDir, R), 33.0));
      if(pick < -10.0){
        return 0.0;
      }
      return pick*0.5;
      return (pow(5.0, pow((pick-0.5)/0.3, 2.0))/12.0);
    }
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
      return pick*0.2;
      //return (pow(5.0, -pow((cosangle-0.6)/0.3, 4.0))/(12.0*pick));
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
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal");
  
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
  shaderProgram.uModelMatrxLocation = gl.getUniformLocation(shaderProgram, "uModelMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

  shaderProgram.shadingMode = gl.getUniformLocation(shaderProgram, "shadingMode");
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


simpleShader = function (gl) {//line 1,Listing 2.14
  var vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    attribute vec3 aPosition;                      
    void main(void)                                
    {                                              
      gl_Position = uProjectionMatrix *            
      uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;                           
    void main(void)                                
    {                                              
      gl_FragColor = vec4(uColor);                 
    }                                             
  `;

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
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
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
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

  return shaderProgram;
};//line 55