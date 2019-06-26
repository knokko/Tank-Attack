import React, { Component } from 'react';

export default class UserImage extends Component {

    constructor(props){
        super(props);
        this.userImage = this.props.userImage;
        this.canvasRef = React.createRef();
    }

    onImageInit(){
        this.userImage.draw(this.canvasRef.current);
        this.userImage.addChangeListener(this, userImage => {
            userImage.draw(this.canvasRef.current);
        });
    }

    componentDidMount(){
        if (this.userImage !== null){
            this.onImageInit();
        }
    }

    componentWillUnmount(){
        if (this.userImage !== null){
            this.userImage.removeChangeListener(this);
        }
    }

    setUserImage(userImage){
        this.userImage = userImage;
        this.onImageInit();
    }

    render(){
        return (
            <canvas className="UserImageCanvas" ref={this.canvasRef} 
            style={"left: " + this.props.x + "; top: " + this.props.y + "; width: " + this.props.width + "; height: " + this.props.height + ";"}/>
        );
    }
}