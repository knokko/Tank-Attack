import React, { Component } from 'react';

export default class DynamicInt extends Component {

    render(){
        const props = this.props;
        const self = this;
        return (<input 
            type="text" 
            value={props.entity[props.fieldName]}
            onChange={event => {
                let newValue = parseInt(event.target.value);
                if (!isNaN(newValue)){
                    if (props.maxValue !== undefined && newValue > props.maxValue){
                        newValue = props.maxValue;
                    } else if (props.minValue !== undefined && newValue < props.minValue){
                        newValue = props.minValue;
                    }
                    props.entity[props.fieldName] = newValue;
                    self.forceUpdate();
                } else {
                    props.entity[props.fieldName] = props.minValue || 0;
                    self.forceUpdate();
                }
            }}
        />);
    }
}