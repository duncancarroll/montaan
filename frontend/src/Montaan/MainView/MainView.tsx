import React from 'react';
import './MainView.scss';
import tabletree from './main.js';

interface MainViewProps {
	requestDirs(paths: string[]): void;
	requestDitchDirs(fsEntries: any[]): void;
	api: any;
	apiPrefix: string;
	repoPrefix: string;
	diffsLoaded: number;
	fileTree: any;
	commitData: any;
	activeCommitData: any;
	commitFilter: any;
	navigationTarget: string;
	searchResults: any[];
	goToTarget: any;
	searchQuery: string;
	searchLinesRequest: number;
	addLinks: any;
	setLinks: any;
	links: any[];
	navUrl?: string;
	frameRequestTime: number;
	setNavigationTarget(target: string): void;
}

export default class MainView extends React.Component<MainViewProps, {}> {
	constructor(props: MainViewProps) {
		tabletree.requestDirs = props.requestDirs;
		tabletree.requestDitchDirs = props.requestDitchDirs;
		tabletree.setNavigationTarget = props.setNavigationTarget;
		tabletree.init(props.api, props.apiPrefix, props.repoPrefix);
		super(props);
	}

	shouldComponentUpdate(nextProps: MainViewProps) {
		if (this.props.fileTree !== nextProps.fileTree) tabletree.setFileTree(nextProps.fileTree);
		if (this.props.commitData !== nextProps.commitData)
			tabletree.setCommitData(nextProps.commitData);
		if (this.props.activeCommitData !== nextProps.activeCommitData)
			tabletree.setActiveCommits(nextProps.activeCommitData);
		if (this.props.searchResults !== nextProps.searchResults)
			tabletree.setSearchResults(nextProps.searchResults);
		if (this.props.goToTarget !== nextProps.goToTarget)
			tabletree.goToTarget(nextProps.goToTarget);
		if (this.props.searchLinesRequest !== nextProps.searchLinesRequest)
			tabletree.updateSearchLines();
		tabletree.updateLinks();
		if (this.props.links !== nextProps.links) tabletree.setLinks(nextProps.links);
		if (this.props.navUrl !== nextProps.navUrl) tabletree.goToURL(nextProps.navUrl);
		if (this.props.frameRequestTime !== nextProps.frameRequestTime) tabletree.changed = true;
		return false;
	}

	render() {
		return <></>;
	}
}
