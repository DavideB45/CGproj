createFramebuffer = function(gl, size){
    var depthTexture = gl.createTexture();
    //create a texture containing the depth buffer
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // level
        gl.DEPTH_COMPONENT, // internal format
        size,               // width
        size,               // height
        0,                  // border
        gl.DEPTH_COMPONENT, // format
        gl.UNSIGNED_SHORT,  // type
        null                // data
    );
    //set the filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var depthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    //attach the texture to the framebuffer
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,     // target
        gl.DEPTH_ATTACHMENT,// attachment
        gl.TEXTURE_2D,      // text target
        depthTexture,       // texture
        0
    );

    var colorTexture = gl.createTexture();
    // crea una color terxture della stessa dimensione della depth texture
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // level
        gl.RGBA,            // internal format
        size,               // width
        size,               // height
        0,                  // border
        gl.RGBA,            // format
        gl.UNSIGNED_BYTE,   // type
        null                // data
    );
    // set the filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // attach the texture to the framebuffer
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,     // target
        gl.COLOR_ATTACHMENT0,// attachment
        gl.TEXTURE_2D,      // text target
        colorTexture,       // texture
        0                   // level
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    depthFramebuffer.depthTexture = depthTexture;
    depthFramebuffer.colorTexture = colorTexture;
    depthFramebuffer.size = size;
    return depthFramebuffer;
}
drawObjectSimple = function (gl, obj, usedShader) {

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.enableVertexAttribArray(usedShader.aPositionIndex);
    gl.vertexAttribPointer(usedShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);
  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(usedShader.aPositionIndex);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
// aggiungere punto di vista reale quando creo la view matrix
drawShadow = function(gl, shaderProgram, renderer, scene){
    var stack = new MatrixStack();
    stack.loadIdentity();

    //disegno la macchina
    {
    stack.push();
    stack.multiply(renderer.car.frame);
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.2, 0] ));
    stack.push();// car body
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, 0.2, 0] ));
    stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.55, 0.55, 0.55] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObjectSimple(gl, renderer.carBody, [0.0, 0.8, 0.4, 1], shaderProgram);
    stack.pop();
    stack.push();// front rigt wheel
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0.5, 0.36, -0.7] ));
    stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObjectSimple(gl, renderer.carWheel, [0, 0, 0, 1], shaderProgram);
    stack.pop();
    stack.push();// back right wheel
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0.5, 0.36,  0.7] ));
    stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObjectSimple(gl, renderer.carWheel, [0, 0, 0, 1], shaderProgram);
    stack.pop();
    stack.push();// front left wheel
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [-0.5, 0.36, -0.7] ));
    stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObjectSimple(gl, renderer.carWheel, [0, 0, 0, 1], shaderProgram);
    stack.pop();
    stack.push();// back left wheel
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [-0.5, 0.36, 0.7] ));
    stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(), [0.5, 0.4, 0.4] ));
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0, -0.36, 0] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObjectSimple(gl, renderer.carWheel, [0, 0, 0, 1], shaderProgram);
    stack.pop();
    stack.pop();
    }

    //disegno i lampioni
    for (let index = 0; index < scene.lamps.length; index++) {
        stack.push();// lampione
        stack.multiply(glMatrix.mat4.fromTranslation(
            glMatrix.mat4.create(),
            [scene.lamps[index].position[0], 4.4, scene.lamps[index].position[2]] )
        );
        stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[0.5, 0.5, 0.5] ));
        gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
        drawObjectSimple(gl, renderer.lamp, [0.2, 0.8, 0.7, 1.0], shaderProgram);
        stack.pop();
    }

    stack.push();
    stack.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[2, 2, 2] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObject(gl, renderer.sphere, [1, 0, 0, 1], shaderProgram);
    stack.push();
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[2.5, 0, 0] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObject(gl, renderer.sphere, [0, 1, 0, 1], shaderProgram);
    stack.pop();
    stack.push();
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[-2.5, 0, 0] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObject(gl, renderer.sphere, [0, 0, 1, 1], shaderProgram);
    stack.pop();
    stack.push();
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[0, 0, 15] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObject(gl, renderer.sphere, [1, 1, 0, 1], shaderProgram);
    stack.pop();
    stack.push();
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[0, 0, 30] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObject(gl, renderer.sphere, [0, 1, 1, 1], shaderProgram);
    stack.pop();
    stack.push();
    stack.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[10, 0, 30] ));
    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    drawObject(gl, renderer.sphere, [0, 0, 1, 1], shaderProgram);
    stack.pop();
    stack.pop();

    gl.uniformMatrix4fv(shaderProgram.uModelMatrxLocation, false, stack.matrix);
    //disegno il terreno
    drawObjectSimple(gl, scene.trackObj, [0.9, 0.8, 0.7, 1.0], shaderProgram);
    drawObjectSimple(gl, scene.buildingsObjTex[0], [0.9, 0.8, 0.7, 1.0], shaderProgram);

    //disegno i palazzi
    for (var i = 0; i < scene.buildings.length; ++i){
        drawObjectSimple(gl, scene.buildingsObjTex[i], [0.8, 0.8, 0.8, 1.0], shaderProgram);
    }
}

createShadowMap = function(gl, shaderProgram, vMatrix, size, frameBuffer, renderer, scene){
    gl.useProgram(shaderProgram);
    gl.cullFace(gl.FRONT);
    gl.enable(gl.CULL_FACE);
    gl.uniformMatrix4fv(shaderProgram.uViewMatrixLocation, false, vMatrix);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.viewport(0, 0, size, size);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);// vale per il fb valido
    drawShadow(gl, shaderProgram, renderer, scene);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.CULL_FACE);
    return frameBuffer.depthTexture;
}