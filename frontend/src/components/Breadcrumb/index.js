import React from 'react';
import './style.css';

export default class Breadcrumb extends React.Component {
    render() {
        return (
            <div id="breadcrumbContainer">
                <div id="breadcrumb"></div>
                <button id="showFileCommits" onClick={this.props.showFileCommitsClick}>Show commits</button>
            </div>
        );
    }
}
