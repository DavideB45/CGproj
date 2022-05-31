shadowShader = function(gl){
    //shader for shadow mapping
    var vertexShaderSource = `
        attribute vec3 aPosition;
        uniform mat4 uViewMatrix;
        uniform mat4 uModelMatrix;

        void main(void){
            gl_Position = uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
        }
    `;
    var fragmentShaderSource = `
        precision highp float;

        void main(void){
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    `;

    gl.getExtension('WEBGL_depth_texture');
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    var aPositionIndex = 0;
    gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        var str = "Unable to initialize the shader program.\n\n";
        str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
        str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
        str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
        alert(str);
    }

    shaderProgram.aPositionIndex = aPositionIndex;
    shaderProgram.uModelMatrxLocation = gl.getUniformLocation(shaderProgram, "uModelMatrix");
    shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");
    return shaderProgram;
}