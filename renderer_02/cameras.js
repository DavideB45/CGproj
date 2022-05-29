/*
the FollowFromUpCamera always look at the car from a position abova right over the car
*/
FollowFromUpCamera = function(){

/* the only data it needs is the position of the camera */
    this.pos = [0,0,0];

/* update the camera with the current car position */
    this.update = function(car_position, _other){
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

FollowFromBackCamera = function(carObj){
    this.orientation = carObj.wheelsAngle;
    this.toWord = carObj.frame;
    this.view = glMatrix.mat4.create();
    this.smallRot = glMatrix.mat4.create();

    this.update = function(_car_position, wheelRor){
        this.orientation = wheelRor;
        return;
    }

    this.matrix = function(){
        
        /*glMatrix.mat4.lookAt(this.view,
                            MultiplyMatrixVector(this.toWord, [0,   2,  4]), 
                            MultiplyMatrixVector(this.toWord, [0, 0.5, -4]), 
                            [0,  1,  0]);*/
        
        glMatrix.mat4.fromRotation(this.smallRot, -2*this.orientation, [0, 1, 0.5]);
        glMatrix.mat4.lookAt(this.view,
            MultiplyMatrixVector(this.toWord, MultiplyMatrixVector(this.smallRot, [-2*this.orientation,   2,  4])), 
            MultiplyMatrixVector(this.toWord, MultiplyMatrixVector(this.smallRot, [0, 0.5, -4])), 
            [0,  1,  0]);
        return this.view;
    }
}

Fanale = function(carObj){
    this.toWord = carObj.frame;
    this.view = glMatrix.mat4.create();

    this.update = function(_car_position, wheelRor){
        return;
    }

    this.matrix = function(){
        glMatrix.mat4.lookAt(this.view,
            MultiplyMatrixVector(this.toWord, [0,   0.5,  -1.2]),// occhio (0,  -0.04,  -1.2)
            MultiplyMatrixVector(this.toWord, [0, -0.2 , -3]), // centro (0.0, -0.02, -1.5)
            [0,  1,  0]);// up
        return glMatrix.mat4.mul(
            this.view, 
            glMatrix.mat4.perspective(glMatrix.mat4.create(), 45.1, 1, 0.1, 10), 
            this.view);
    }
}