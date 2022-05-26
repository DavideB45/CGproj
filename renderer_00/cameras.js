/*
the FollowFromUpCamera always look at the car from a position abova right over the car
*/
FollowFromUpCamera = function(){

/* the only data it needs is the position of the camera */
    this.pos = [0,0,0];

/* update the camera with the current car position */
    this.update = function(car_position){
        this.pos = car_position;
    }

/* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
    this.matrix = function(){
        return glMatrix.mat4.lookAt(glMatrix.mat4.create(),
        [ this.pos[0],this.pos[1]+22, this.pos[2]], 
        this.pos, 
        [0, 0, -1]);
    }
}

MultiplyMatrixVector = function (matrix, vector) {
    let out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        out[i] = matrix[0 * 4 + i] * vector[0] + matrix[1 * 4 + i] * vector[1] + matrix[2 * 4 + i] * vector[2] + matrix[3 * 4 + i];
    }
    return out;
}

FollowFromBackCamera = function(toWordMatrix){
    this.pos = [0,0,0];
    this.toWord = toWordMatrix;
    this.view = glMatrix.mat4.create();

    this.update = function(car_position){
        return;
    }

    this.matrix = function(){
        
        glMatrix.mat4.lookAt(this.view,
                            MultiplyMatrixVector(this.toWord, [0,   2,  4]), 
                            MultiplyMatrixVector(this.toWord, [0, 0.5, -4]), 
                            [0,  1,  0]);
        return this.view;
    }
}