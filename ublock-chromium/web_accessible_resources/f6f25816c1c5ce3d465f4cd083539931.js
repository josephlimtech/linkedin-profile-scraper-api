(function() {
	var noopfn = function() {
		;
	};
	var obr = {};
	var methods = [
		'callClick', 'callLoadMore', 'callRecs', 'callUserZapping',
		'callWhatIs', 'cancelRecommendation', 'cancelRecs', 'closeCard',
		'closeModal', 'closeTbx', 'errorInjectionHandler', 'getCountOfRecs',
		'getStat', 'imageError', 'manualVideoClicked', 'onOdbReturn',
		'onVideoClick', 'pagerLoad', 'recClicked', 'refreshSpecificWidget',
		'refreshWidget', 'reloadWidget', 'researchWidget', 'returnedError',
		'returnedHtmlData', 'returnedIrdData', 'returnedJsonData', 'scrollLoad',
		'showDescription', 'showRecInIframe', 'userZappingMessage', 'zappingFormAction'
	];
	obr.extern = {
		video: {
			getVideoRecs: noopfn,
			videoClicked: noopfn
		}
	};
	methods.forEach(function(a) {
		obr.extern[a] = noopfn;
	});
	window.OBR = window.OBR || obr;
})();
