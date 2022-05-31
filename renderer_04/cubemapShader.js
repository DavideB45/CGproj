cubeShader = function(gl){
    var vertexShaderSource = `
        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        attribute vec3 aPosition;

        varying vec3 vPosition;

        void main() {
            vPosition = aPosition;
            gl_Position = uProjectionMatrix * vec4((uViewMatrix * vec4(aPosition, 0.0)).xyz, 1.0);
        }
    `;

    var fragmentShaderSource = `
        precision highp float;
        uniform samplerCube uCubeMap;
        varying vec3 vPosition;

        void main() {
            gl_FragColor = textureCube(uCubeMap, normalize(vPosition));
        }
    `;

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    var program = gl.createProgram();
    var aPositionIndex = 0;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.bindAttribLocation(program, aPositionIndex, "aPosition");
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		var str = "Unable to initialize the shader program.\n\n";
		str += "VS:\n"   + gl.getShaderInfoLog(vertexShader)   + "\n\n";
		str += "FS:\n"   + gl.getShaderInfoLog(fragmentShader) + "\n\n";
		str += "PROG:\n" + gl.getProgramInfoLog(program);
		alert(str);
	}

    program.uCubeMap = gl.getUniformLocation(program, "uCubeMap");
    program.uViewMatrix = gl.getUniformLocation(program, "uViewMatrix");
    program.uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
    program.aPositionIndex = aPositionIndex;

    return program;
}