import React, { Component } from 'react';
import ImageManager from 'manage/image/ImageManager';
import './UserImage.css';

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
            this.forceUpdate();
            this.userImage.addChangeListener(this, _ => {
                this.forceUpdate();
            });
        });
        this.resizeCallback = () => {
            this.forceUpdate();
        };
        window.addEventListener('resize', this.resizeCallback);
    }

    componentDidUpdate(){
        if (this.userImage !== null){
            this.userImage.draw(this.canvasRef.current);
        }
    }

    componentWillUnmount(){
        if (this.userImage !== null){
            this.userImage.removeChangeListener(this);
        } else {
            ImageManager.cancelGetUserImage(this.props.imageID, this);
        }
        window.removeEventListener('resize', this.resizeCallback);
    }

    render(){
        const maxWidth = Math.floor(this.props.maxWidth * window.innerWidth / 100);
        const maxHeight = Math.floor(this.props.maxHeight * window.innerHeight / 100);
        let width = maxWidth;
        let height = maxHeight;
        if (this.userImage !== null){
            let scale = Math.min(maxWidth / this.userImage.getWidth(), maxHeight / this.userImage.getHeight());
            if (scale > 1 && !this.props.allowFloatScale){
                scale = Math.floor(scale);
            }
            width = scale * this.userImage.getWidth();
            height = scale * this.userImage.getHeight();
        }
        return (
            <canvas 
                className="UserImageCanvas" 
                ref={this.canvasRef}
                onClick={this.handleClick}
                width={width}
                height={height}
                style={
                    { position: 'absolute', 
                    left: this.props.x * window.innerWidth / 100 + (maxWidth - width) / 2, 
                    top: this.props.y * window.innerHeight / 100 + (maxHeight - height) / 2, 
                    borderColor: this.props.selected ? 'blue' : 'white'}
                }
            />
        );
    }
}