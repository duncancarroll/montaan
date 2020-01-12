import React from 'react';
import './style.css';
import tabletree from '../../main.js';

export default class MainView extends React.Component {
    constructor(props) {
        tabletree.init(props.apiPrefix, props.repoPrefix);
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.props.fileTree !== nextProps.fileTree) tabletree.setFileTree(nextProps.fileTree);
        if (this.props.commitData !== nextProps.commitData) tabletree.setCommitData(nextProps.commitData);
        if (this.props.activeCommits !== nextProps.activeCommits) tabletree.setActiveCommits(nextProps.activeCommits);
        if (this.props.searchResults !== nextProps.searchResults) tabletree.setSearchResults(nextProps.searchResults);
        if (this.props.goToTarget !== nextProps.goToTarget) tabletree.goToTarget(nextProps.goToTarget);
        if (this.props.frameRequestTime !== nextProps.frameRequestTime) tabletree.changed = true;
        return false;
    }

    render() {
        return <></>;
    }
}