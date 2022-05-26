/* the main object to be implementd */
var Renderer = new Object();
/*
initialize the object in the scene
*/
Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");

  Renderer.carWheel = loadOnGPU(wheel, gl);// crea la ruota
  Renderer.carBody = new Cube();
  createObjectBuffers(gl, Renderer.carBody);// la macchina

  createObjectBuffers(gl,Game.scene.trackObj);// la pista
  createObjectBuffers(gl,Game.scene.groundObj);// il pavimento

  for (var i = 0; i < Game.scene.buildings.length; ++i) // il resto della
	  	createObjectBuffers(gl,Game.scene.buildingsObj[i]);// scena
};

/*
draw the car
*/
angle = 0.0;
dr = 0.01;
Renderer.drawCar = function (stack, gl) {
  angle += dr;

  stack.push();
  stack.multiply(this.car.frame);
  stack.multiply(glMatrix.mat4.fromRotation(glMatrix.mat4.create(), angle, [0, 1, 0]))
  
  stack.push();
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, 0.5, 0] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.25, 1] ));
  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
  drawObject(gl, Renderer.carBody, [1, 0.5, 0, 1], [0, 1, 1, 1], this.uniformShader);
  stack.pop();

  stack.push();
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0.57, 0, -0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.5, 0.5] ));
  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], [0, 1, 1, 1], this.uniformShader);
  stack.pop();

  stack.push();
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0.5, 0,  0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 1, 1] ));
  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], [0, 1, 1, 1], this.uniformShader);
  stack.pop();

  stack.push();
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [-0.57, 0, -0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.5, 0.5] ));
  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], [0, 1, 1, 1], this.uniformShader);
  stack.pop();

  stack.push();
  stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [-0.5, 0, 0.75] ));
  stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 1, 1] ));
  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
  drawObject(gl, Renderer.carWheel, [0, 0, 0, 1], [0, 1, 1, 1], this.uniformShader);
  stack.pop();

  stack.pop();
};


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


  gl.useProgram(this.uniformShader);
  
  gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation,     false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, ratio, 1, 500));

  Renderer.cameras[Renderer.currentCamera].update(this.car.position);
  var invV = Renderer.cameras[Renderer.currentCamera].matrix();
  
  // initialize the stack with the identity
  stack.loadIdentity();
  // multiply by the view matrix
  stack.multiply(invV);

  // drawing the car
  this.drawCar(stack, gl);

  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);

  // drawing the static elements (ground, track and buldings)
	drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0], this.uniformShader);
 	drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0], this.uniformShader);
	for (var i in Game.scene.buildingsObj) 
		drawObject(gl, Game.scene.buildingsObj[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0], this.uniformShader);
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

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);

  /* array of cameras that will be used */
  Renderer.cameras = [];
  Renderer.cameras[0] = new FollowFromUpCamera();
  Renderer.cameras[1] = new FollowFromBackCamera(Renderer.car.frame);
  Renderer.currentCamera = 1;

  /* create the shader */
  Renderer.uniformShader = new uniformShader(Renderer.gl);

  /*
  add listeners for the mouse / keyboard events
  */
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);

  Renderer.Display();
}

on_mouseMove = function(e){}

on_keyup = function(e){
	Renderer.car.control_keys[e.key] = false;
}
on_keydown = function(e){
	Renderer.car.control_keys[e.key] = true;
}
update_camera = function(e){
  Renderer.currentCamera = parseInt(e);
}
update_rotation = function(e){
  if(parseInt(e) == 0){
    dr = 0.01;
  } else {
    dr = 0;
    angle = 0;
  }
}
window.onload = Renderer.setupAndStart;



