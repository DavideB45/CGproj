/* the main object to be implementd */
var Renderer = new Object();

Renderer.fillArrayLamp = function(){
  this.gl.uniform3fv(
    this.flatShader.spotlightPos[0], 
    [Game.scene.lamps[0].position[0], 5, Game.scene.lamps[0].position[2]]
  );
  this.gl.uniform3fv(
    this.flatShader.spotlightCol[0], 
    [1, 0, 1]
  );
  this.gl.uniform3fv(
    this.flatShader.spotlightDir[0],
    [0,-1,0]
  )
  for(i = 1; i < this.flatShader.maxSpotlight && i < Game.scene.lamps.length; i++){
    this.gl.uniform3fv(
      this.flatShader.spotlightPos[i], 
      [Game.scene.lamps[i].position[0], 5, Game.scene.lamps[i].position[2]]
    );
    this.gl.uniform3fv(
      this.flatShader.spotlightCol[i], 
      [1, 1, 1]
    );
    this.gl.uniform3fv(
      this.flatShader.spotlightDir[i],
      [0,-1,0]
    )
  }
}

/* initialize the object in the scene */
Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");

  loadTexture(Renderer.gl, "./../common/textures/headlight.png", Renderer.gl.TEXTURE5, gl.RGBA);

  Renderer.carWheel = loadOnGPU(wheel, gl);// crea la ruota
  Renderer.carBody = loadOnGPU(police, gl);// crea la carrozza
  //loadTexture(gl, "./../common/textures/police.png", Renderer.gl.TEXTURE5);
  //Renderer.carBody.texture = 5;

  // to check light 
  Renderer.sphere = loadOnGPU(sphere, gl);

  Renderer.lamp = loadOnGPU(lamp, gl);

  createObjectBuffers(gl,Game.scene.trackObj);// la pista
  loadTexture(Renderer.gl, "./../common/textures/street4.png", Renderer.gl.TEXTURE0, gl.RGB);
  Game.scene.trackObj.texture = 0;
  createObjectBuffers(gl,Game.scene.groundObj);// il pavimento
  loadTexture(Renderer.gl, "./../common/textures/grass_tile.png", Renderer.gl.TEXTURE1, gl.RGB);
  Game.scene.groundObj.texture = 1;

  createObjectBuffers(gl,Game.scene.buildingsObjTex[0]);// il primo edificio
  loadTexture(Renderer.gl, "./../common/textures/facade1.jpg", Renderer.gl.TEXTURE2, gl.RGB);
  Game.scene.buildingsObjTex[0].texture = 2;
  createObjectBuffers(gl,Game.scene.buildingsObjTex[0].roof);// il primo tetto
  loadTexture(Renderer.gl, "./../common/textures/roof.jpg", Renderer.gl.TEXTURE3, gl.RGB);
  Game.scene.buildingsObjTex[0].roof.texture = 3;

  loadTexture(Renderer.gl, "./../common/textures/facade3.jpg", Renderer.gl.TEXTURE4, gl.RGB);
  for (var i = 1; i < Game.scene.buildings.length; ++i){ // gli altri edifici
	  createObjectBuffers(gl,Game.scene.buildingsObjTex[i]);// dividere gli edifici in due parti
    Game.scene.buildingsObjTex[i].texture = 4;
    createObjectBuffers(gl,Game.scene.buildingsObjTex[i].roof);// il tetto
    Game.scene.buildingsObjTex[i].roof.texture = 3;
  }

};

/* draw the car */
angle = 0.0;
wheelRotationY = glMatrix.mat4.create();
wheelRotationX = glMatrix.mat4.create();
Renderer.drawCar = function (stack, gl) {
  angle -= Renderer.car.speed*0.4;
  wheelRotationY = glMatrix.mat4.fromRotation(wheelRotationY, 2*Renderer.car.wheelsAngle, [0,1,0] );
  wheelRotationX = glMatrix.mat4.fromRotation(wheelRotationX,  angle , [1,0,0] );

  stack.push();
  stack.multiply(this.car.frame);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.2, 0] ));

  stack.push();// car body
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 0);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, 0.2, 0] ));
  //stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.25, 1] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.55, 0.55, 0.55] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  //Renderer.gl.uniform1i(this.flatShader.textureMode, 1);
  //gl.uniform1i(this.flatShader.uSampler, Renderer.carBody.texture);
  drawObject(gl, Renderer.carBody, [0.0, 0.8, 0.4, 1], this.flatShader);
  //Renderer.gl.uniform1i(this.flatShader.textureMode, 0);
  stack.pop();

  Renderer.gl.uniform1i(this.flatShader.shadingMode, 0);

  stack.push();// front rigt wheel
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0.5, 0.36, -0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
  stack.multiply(wheelRotationY);
  stack.multiply(wheelRotationX);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], this.flatShader);
  stack.pop();

  stack.push();// back right wheel
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0.5, 0.36,  0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
  stack.multiply(wheelRotationX);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], this.flatShader);
  stack.pop();

  stack.push();// front left wheel
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [-0.5, 0.36, -0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
  stack.multiply(wheelRotationY);
  stack.multiply(wheelRotationX);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], this.flatShader);
  stack.pop();

  stack.push();// back left wheel
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [-0.5, 0.36, 0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
  stack.multiply(wheelRotationX);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], this.flatShader);
  stack.pop();

  stack.pop();
}
Renderer.drawSpheres = function (gl, stack){
  stack.push();
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[2, 2, 2] ));
  
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 3);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[0, 0, 0] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.sphere, [1, 0, 0, 1], this.flatShader);
  
  stack.push();
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 0);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[2.5, 0, 0] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.sphere, [0, 1, 0, 1], this.flatShader);
  stack.pop();

  stack.push();
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 1);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[-2.5, 0, 0] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.sphere, [0, 0, 1, 1], this.flatShader);
  stack.pop();

  stack.push();
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 1);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[0, 0, 15] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.sphere, [1, 1, 0, 1], this.flatShader);
  stack.pop();

  stack.push();
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 0);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[0, 0, 30] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.sphere, [0, 1, 1, 1], this.flatShader);
  stack.pop();

  stack.push();
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 1);
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[10, 0, 30] ));
  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
  drawObject(gl, Renderer.sphere, [0, 0, 1, 1], this.flatShader);
  stack.pop();

  stack.pop();
}
Renderer.drawLamps = function(gl, stack){
  for (let index = 0; index < Game.scene.lamps.length; index++) {
    stack.push();// lampione
      stack.multiply(glMatrix.mat4.fromTranslation(
        glMatrix.mat4.create(),
        [Game.scene.lamps[index].position[0], 4.4, Game.scene.lamps[index].position[2]] ));
      stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[0.5, 0.5, 0.5] ));
      Renderer.gl.uniform1i(this.flatShader.shadingMode, 1);
      gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
      drawObject(gl, Renderer.lamp, [0.2, 0.8, 0.7, 1.0], this.flatShader);
    stack.pop();
    stack.push();// lampadina
    stack.multiply(glMatrix.mat4.fromTranslation(
      glMatrix.mat4.create(),
        [Game.scene.lamps[index].position[0], 4.7, Game.scene.lamps[index].position[2]] ));
        stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[0.2, 0.2, 0.2] ));
      Renderer.gl.uniform1i(this.flatShader.shadingMode, 1);
      gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);
      drawObject(gl, Renderer.sphere, [1, 1, 0, 1], this.flatShader);
    stack.pop();
  }
  Renderer.fillArrayLamp();
}

day_mode = 0;
Renderer.drawScene = function (gl) {

  var width = this.canvas.width;
  var height = this.canvas.height
  var ratio = width / height;
  var stack = new MatrixStack();

  
  gl.viewport(0, 0, width, height);
  gl.enable(gl.DEPTH_TEST);
  // Clear the framebuffer
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  gl.useProgram(this.flatShader);
  gl.uniform1i(this.flatShader.uCarLight, 5);
  if(day_mode == 0){
    Renderer.gl.uniform3fv(this.flatShader.uLightDirection, Game.scene.weather.sunLightDirection);  
  } else if(day_mode == 1){
    Renderer.gl.uniform3fv(this.flatShader.uLightDirection, [0.0, -0.4, 1.0]);
  } else {
    Renderer.gl.uniform3fv(this.flatShader.uLightDirection, [0.0, 1.0, 0.0]);
  }
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 1);
  Renderer.gl.uniform1i(this.flatShader.textureMode, 0);

  gl.uniformMatrix4fv(this.flatShader.uProjectionMatrixLocation,false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, ratio, 1, 500));
  Renderer.cameras[Renderer.currentCamera].update(this.car.position, this.car.wheelsAngle);
  gl.uniformMatrix4fv(this.flatShader.uViewMatrixLocation, false, Renderer.cameras[Renderer.currentCamera].matrix());
  gl.uniform3fv(this.flatShader.uViewPosition, Renderer.cameras[Renderer.currentCamera].eye);
  gl.uniformMatrix4fv(this.flatShader.uCarLigthMatrixLocation, false,Renderer.cameras[Renderer.fanale].matrix());
  
  // initialize the stack with the identity
  stack.loadIdentity();

  // drawing the car
  this.drawCar(stack, gl);

  this.drawSpheres(gl, stack);

  this.drawLamps(gl, stack);

  gl.uniformMatrix4fv(this.flatShader.uModelMatrxLocation, false, stack.matrix);

  // drawing the static elements (ground, track and buldings)
  Renderer.gl.uniform1i(this.flatShader.shadingMode, 0);
  Renderer.gl.uniform1i(this.flatShader.textureMode, 1);
  
  gl.uniform1i(this.flatShader.uSampler, Game.scene.groundObj.texture);//ground
	drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], this.flatShader);

  gl.uniform1i(this.flatShader.uSampler, Game.scene.trackObj.texture);//track
  drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], this.flatShader);
  
  gl.uniform1i(this.flatShader.uSampler, Game.scene.buildingsObjTex[0].texture);//buildings
  drawObject(gl, Game.scene.buildingsObjTex[0], [0.9, 0.8, 0.7, 1.0], this.flatShader);

  for (var i = 0; i < Game.scene.buildings.length; ++i){ //buildings
    gl.uniform1i(this.flatShader.uSampler, Game.scene.buildingsObjTex[i].texture);
		drawObject(gl, Game.scene.buildingsObjTex[i], [0.8, 0.8, 0.8, 1.0], this.flatShader);
    gl.uniform1i(this.flatShader.uSampler, Game.scene.buildingsObjTex[i].roof.texture);
    drawObject(gl, Game.scene.buildingsObjTex[i].roof, [0.8, 0.8, 0.8, 1.0], this.flatShader);
  }
  gl.useProgram(null);
};

Renderer.Display = function () {
  Renderer.drawScene(Renderer.gl);
  window.requestAnimationFrame(Renderer.Display) ;
};

Renderer.setupAndStart = function () {
  /* create the canvas */
	Renderer.canvas = document.getElementById("OUTPUT-CANVAS");
  /* get the webgl context */
	Renderer.gl = Renderer.canvas.getContext("webgl");
  /* read the webgl version and log */
	var gl_version = Renderer.gl.getParameter(Renderer.gl.VERSION); 
	log("glversion: " + gl_version);
	var GLSL_version = Renderer.gl.getParameter(Renderer.gl.SHADING_LANGUAGE_VERSION)
	log("glsl  version: "+GLSL_version);

  /* create the matrix stack */
	Renderer.stack = new MatrixStack();

  /* create the shader */
  Renderer.flatShader = new flatShader(Renderer.gl);

  /* initialize objects to be rendered */
	Renderer.initializeObjects(Renderer.gl);

  /* array of cameras that will be used */
  Renderer.cameras = [];
  Renderer.cameras[0] = new FollowFromUpCamera();
  Renderer.cameras[1] = new FollowFromBackCamera(Renderer.car);
  Renderer.cameras[2] = new Fanale(Renderer.car);
  Renderer.fanale = 2;
  Renderer.currentCamera = 1;
  
  
  /* add listeners for the mouse / keyboard events */
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);

  Renderer.Display();
}

on_mouseMove = function(e){

}
on_keyup = function(e){
	Renderer.car.control_keys[e.key] = false;
}
on_keydown = function(e){
	Renderer.car.control_keys[e.key] = true;
}
update_camera = function(e){
  Renderer.currentCamera = parseInt(e);
}
update_day = function(e){
  day_mode = parseInt(e);
}
window.onload = Renderer.setupAndStart;



