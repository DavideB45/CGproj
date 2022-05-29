/*
the FollowFromUpCamera always look at the car from a position abova right over the car
*/
FollowFromUpCamera = function(){

/* the only data it needs is the position of the camera */
    this.center = [0,0,0];
    this.eye = [0,0,0];
/* update the camera with the current car position */
    this.update = function(car_position, _other){
        this.center = car_position;
        this.eye = [car_position[0], car_position[1]+22, car_position[2]];
    }

/* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
    this.matrix = function(){
        return glMatrix.mat4.lookAt(glMatrix.mat4.create(),
        this.eye, 
        this.center, 
        [0, 0, -1]);
    }
}

FollowFromBackCamera = function(carObj){
    this.orientation = carObj.wheelsAngle;
    this.toWord = carObj.frame;
    this.view = glMatrix.mat4.create();
    this.eye = [0,0,0];
    this.smallRot = glMatrix.mat4.create();

    this.update = function(_car_position, wheelRor){
        this.orientation = wheelRor;
        glMatrix.mat4.fromRotation(this.smallRot, -2*this.orientation, [0, 1, 0.5]);
        this.eye = MultiplyMatrixVector(this.toWord, MultiplyMatrixVector(this.smallRot, [-2*this.orientation,   2,  4]));
        this.center = MultiplyMatrixVector(this.toWord, MultiplyMatrixVector(this.smallRot, [0, 0.5, -4]));
        return;
    }

    this.matrix = function(){
        return glMatrix.mat4.lookAt(this.view,
            this.eye, 
            this.center, 
            [0,  1,  0]
        );
    }
}