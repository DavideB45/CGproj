setCubeFace = function (gl, texture, face, imgdata) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgdata);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}

loadCubeFace = function (gl, texture, face, path) {
    var imgdata = new Image();
    imgdata.onload = function () {
    setCubeFace(gl, texture, face, imgdata);
    }
    imgdata.src = path;
}

loadCubemap = function (tu,gl) { 
    var posx = "./../common/textures/cubemap/negx2.jpg";
    var negx = "./../common/textures/cubemap/negx2.jpg";
    var posy = "./../common/textures/cubemap/posy.jpg";
    var negy = "./../common/textures/cubemap/negy.jpg";
    var posz = "./../common/textures/cubemap/negx.jpg";
    var negz = "./../common/textures/cubemap/negx.jpg";
    
    texture = gl.createTexture();
    gl.activeTexture(tu);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);	

    loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_X, posx);
    loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, negx);
    loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, posy);
    loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, negy);
    loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, posz);
    loadCubeFace(gl, texture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, negz);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    return texture;
}

drawSkybox = function(gl, shaderProgram,viewMatrix, projectionMatrix, texture, obj, texUnit) {
    gl.useProgram(shaderProgram);
    gl.uniformMatrix4fv(shaderProgram.uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(shaderProgram.uViewMatrix, false, viewMatrix);
    
    gl.activeTexture(gl.TEXTURE0 + texUnit);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP,texture);
    gl.uniform1i(shaderProgram.uCubeMap, texUnit);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthMask(false);
    drawObject(gl, obj,[1.0, 0, 0, 0], shaderProgram);
    gl.depthMask(true);
}