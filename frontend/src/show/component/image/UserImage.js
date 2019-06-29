import React, { Component } from 'react';
import ImageManager from '../../../manage/image/ImageManager';

export default class UserImage extends Component {

    constructor(props){
        super(props);
        this.userImage = null;
        this.canvasRef = React.createRef();

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(_event){
        if (this.userImage !== null){
            this.props.onClick(this.userImage);
        }
    }

    componentDidMount(){
        ImageManager.getUserImage(this.props.imageID, this, userImage => {
            this.userImage = userImage;
            this.canvasRef.current.width = userImage.getWidth();
            this.canvasRef.current.height = userImage.getHeight();
            this.userImage.draw(this.canvasRef.current);
            this.userImage.addChangeListener(this, userImage => {
                this.canvasRef.current.width = userImage.getWidth();
                this.canvasRef.current.height = userImage.getHeight();
                userImage.draw(this.canvasRef.current);
            });
        });
    }

    componentWillUnmount(){
        if (this.userImage !== null){
            this.userImage.removeChangeListener(this);
        } else {
            ImageManager.cancelGetUserImage(this.props.imageID, this);
        }
    }

    render(){
        return (
            <canvas 
                className="UserImageCanvas" 
                ref={this.canvasRef}
                onClick={this.handleClick}
            />
        );
    }
}