/* the FollowFromUpCamera always look at the car from a position abova right over the car */
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
    this.center = [0,0,0];
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
            [0,  1,  0]);
    }
}

FreeCamera = function(){
    this.eye = [0,0,0];
    this.center = [0,0,-1];
    this.up = [0,1,0];
    this.mouse = [0,0];//teta_x & teta_y
    this.dmouse = [0,0];//delta_teta_x & delta_teta_y
    this.rotX = glMatrix.mat4.create();
    this.rotY = glMatrix.mat4.create();
    this.keyPress = {};
    this.mode = 1;
    this.speed = 0.2;

    this.rotateVector = function(vector){
        return MultiplyMatrixVector(this.rotY, MultiplyMatrixVector(this.rotX, vector));
    }

    this.sumVector = function(v1, v2){
        return [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]];
    }

    this.update = function(_car_position, wheelRor){
        if(this.dmouse[0] != 0){
            this.mouse[0] += this.dmouse[0]*this.mode;
            glMatrix.mat4.fromRotation(this.rotY, this.mouse[0]/100, [0, 1, 0]);
            this.dmouse[0] = 0;
        }
        if(this.dmouse[1] != 0){
            this.mouse[1] += this.dmouse[1]*this.mode;
            if(this.mouse[1] > 90) this.mouse[1] = 90;
            if(this.mouse[1] < -90) this.mouse[1] = -90;
            glMatrix.mat4.fromRotation(this.rotX, this.mouse[1]/100, [1, 0, 0]);
            this.dmouse[1] = 0;
        }
        if(this.keyPress['w']){
            this.eye = this.sumVector(this.eye, this.rotateVector([0,0,-this.speed]));
        }
        if(this.keyPress['s']){
            this.eye = this.sumVector(this.eye, this.rotateVector([0,0,this.speed]));
        }
        if(this.keyPress['a']){
            this.eye = this.sumVector(this.eye, this.rotateVector([-this.speed,0,0]));
        }
        if(this.keyPress['d']){
            this.eye = this.sumVector(this.eye, this.rotateVector([this.speed,0,0]));
        }
        if(this.keyPress['q']){
            this.eye = this.sumVector(this.eye, this.rotateVector([0,-this.speed,0]));
        }
        if(this.keyPress['e']){
            this.eye = this.sumVector(this.eye, this.rotateVector([0,this.speed,0]));
        }
        return;
    }
    
    this.matrix = function(){
        return glMatrix.mat4.lookAt(glMatrix.mat4.create(),
            this.eye,
            this.sumVector(this.eye, this.rotateVector([0,0,-1])),
            this.up);
    }
}


Fanale = function(carObj){
    this.toWord = carObj.frame;
    this.view = glMatrix.mat4.create();
    this.eye = [0,0,0];
    this.center = [0,0,0];

    this.update = function(_car_position, wheelRor){
        this.eye = MultiplyMatrixVector(this.toWord, [0, 0.5, -1.2]);
        this.center = MultiplyMatrixVector(this.toWord, [0, -0.2, -3]);
        return;
    }

    this.matrix = function(){
        glMatrix.mat4.lookAt(this.view,
            this.eye,
            this.center,
            [0,  1,  0]);// up
        return glMatrix.mat4.mul(
            this.view, 
            glMatrix.mat4.perspective(glMatrix.mat4.create(), 45.1, 1, 0.1, 40), 
            this.view);
    }
}

Sole = function(currentCamera, sunLightDirection){
    this.center = currentCamera.center;
    this.eye = [currentCamera.center[0] + sunLightDirection[0]*10, 
        currentCamera.center[1] + sunLightDirection[1]*10, 
        currentCamera.center[2] + sunLightDirection[2]*10];
    this.up = [0, 0, 1];
    
    this.update = function(currentCamera, sunLightDirection){
        this.eye = [currentCamera.center[0] + sunLightDirection[0]*20, 
            currentCamera.center[1] + sunLightDirection[1]*20, 
            currentCamera.center[2] + sunLightDirection[2]*20];
        this.center = currentCamera.center;
        this.up = [0, 1, 1];
        return;
    }

    this.matrix = function(){
        this.viewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(),
            this.eye,
            this.center,
            this.up
        );
        return glMatrix.mat4.mul(
            this.viewMatrix,
            glMatrix.mat4.ortho( glMatrix.mat4.create(), -40, 40, -40, 40, 0.1, 80),
            this.viewMatrix
        );
    }

}
