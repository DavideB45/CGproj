/* create the buffers for an object as specified in common/shapes/triangle.js */
createObjectBuffers = function (gl, obj) {

    obj.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    obj.indexBufferTriangles = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    if(obj.texCoords != undefined){
		obj.texBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.texCoords, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}
}
/* draw an object as specified in common/shapes/triangle.js for which the buffer 
have alrady been created */
drawObject = function (gl, obj, fillColor, usedShader) {

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.enableVertexAttribArray(usedShader.aPositionIndex);
    gl.vertexAttribPointer(usedShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);
  
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);

    if (obj.normalBuffer != undefined) {
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
        gl.enableVertexAttribArray(usedShader.aNormalIndex);
        gl.vertexAttribPointer(usedShader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
    }

    if(obj.texBuffer != undefined){
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.texBuffer);
		gl.enableVertexAttribArray(usedShader.aTexCoordIndex);
		gl.vertexAttribPointer(usedShader.aTexCoordIndex, 2, gl.FLOAT, false, 0, 0);
	}

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.uniform4fv(usedShader.uColorLocation, fillColor);
    gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
  
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(usedShader.aPositionIndex);
    if (obj.normalBuffer != undefined) {
        gl.disableVertexAttribArray(usedShader.aNormalIndex);
    }
    if(obj.texBuffer != undefined){
        gl.disableVertexAttribArray(usedShader.aTexCoordIndex);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
loadOnGPU = function( jsonMesh , gl) {
    var gpuMesh = {
     vertexBuffer: null,
     normalBuffer: null,
     indexBufferTriangles: null
    }
    
    gpuMesh.vertexBuffer = gl.createBuffer();
    gpuMesh.normalBuffer = gl.createBuffer();
    gpuMesh.indexBufferTriangles = gl.createBuffer();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.vertexBuffer );
    gl.bufferData( 
       gl.ARRAY_BUFFER, 
       new Float32Array(jsonMesh.vertices[0].values), 
       gl.STATIC_DRAW
    );
 
   gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.normalBuffer );
    gl.bufferData( 
       gl.ARRAY_BUFFER, 
       new Float32Array(jsonMesh.vertices[1].values), 
       gl.STATIC_DRAW
    );
   
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, gpuMesh.indexBufferTriangles );
    gl.bufferData( 
       gl.ELEMENT_ARRAY_BUFFER, 
       new Uint16Array(jsonMesh.connectivity[0].indices), 
       gl.STATIC_DRAW
    );

    if(jsonMesh.vertices[2] != undefined){
        gpuMesh.texBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.texBuffer );
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(jsonMesh.vertices[2].values),
            gl.STATIC_DRAW
        );
    }

 
   gpuMesh.triangleIndices  = jsonMesh.connectivity[0].indices ; 
  
    return gpuMesh;
}

MultiplyMatrixVector = function (matrix, vector) {
    let out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        out[i] = matrix[0 * 4 + i] * vector[0] + matrix[1 * 4 + i] * vector[1] + matrix[2 * 4 + i] * vector[2] + matrix[3 * 4 + i];
    }
    return out;
}

loadTexture = function(gl, path, textureSlot){
    var img = new Image();
	img.src = path;
	img.addEventListener('load', function(){
        gl.activeTexture(textureSlot);
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		//               cos'è      mipmap lev   originale  in GPU    tipo di dato    immagine
		gl.texImage2D(gl.TEXTURE_2D,    0,        gl.RGB,   gl.RGB, gl.UNSIGNED_BYTE,    img   );
		// parametri per il wrapping 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		// parametri per il filtraggio, come gestire minification e magnification
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
	})
}