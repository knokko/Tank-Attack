import React, { Component } from 'react';

export default class DynamicString extends Component {

    render(){
        const props = this.props;
        const self = this;
        return (<input 
            type="text" 
            value={props.entity[props.fieldName]}
            onChange={event => {
                props.entity[props.fieldName] = event.target.value;
                self.forceUpdate();
            }}
        />);
    }
}