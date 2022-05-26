/*
create the buffers for an object as specified in common/shapes/triangle.js
*/
createObjectBuffers = function (gl, obj) {

    obj.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    obj.indexBufferTriangles = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  
    // create edges
    var edges = new Uint16Array(obj.numTriangles * 3 * 2);
    for (var i = 0; i < obj.numTriangles; ++i) {
      edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
      edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
      edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
      edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
      edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
      edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
    }
  
    obj.indexBufferEdges = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};
/*
draw an object as specified in common/shapes/triangle.js for which the buffer 
have alrady been created
*/
drawObject = function (gl, obj, fillColor, lineColor, usedShader) {

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.enableVertexAttribArray(usedShader.aPositionIndex);
    gl.vertexAttribPointer(usedShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);
  
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);
  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.uniform4fv(usedShader.uColorLocation, fillColor);
    gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
  
    gl.disable(gl.POLYGON_OFFSET_FILL);

    if(obj.indexBufferEdges != undefined){
        gl.uniform4fv(usedShader.uColorLocation, lineColor);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
        gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(usedShader.aPositionIndex);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

var loadOnGPU = function( jsonMesh , gl) {
    var gpuMesh = {
     vertexBuffer: null,
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
 
   gpuMesh.triangleIndices  = jsonMesh.connectivity[0].indices ; 
  
    return gpuMesh;
}