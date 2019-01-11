(function() {
	if ( amznads ) {
		return;
	}
	var w = window;
	var noopfn = function() {
		;
	}.bind();
	var amznads = {
		appendScriptTag: noopfn,
		appendTargetingToAdServerUrl: noopfn,
		appendTargetingToQueryString: noopfn,
		clearTargetingFromGPTAsync: noopfn,
		doAllTasks: noopfn,
		doGetAdsAsync: noopfn,
		doTask: noopfn,
		detectIframeAndGetURL: noopfn,
		getAds: noopfn,
		getAdsAsync: noopfn,
		getAdForSlot: noopfn,
		getAdsCallback: noopfn,
		getDisplayAds: noopfn,
		getDisplayAdsAsync: noopfn,
		getDisplayAdsCallback: noopfn,
		getKeys: noopfn,
		getReferrerURL: noopfn,
		getScriptSource: noopfn,
		getTargeting: noopfn,
		getTokens: noopfn,
		getValidMilliseconds: noopfn,
		getVideoAds: noopfn,
		getVideoAdsAsync: noopfn,
		getVideoAdsCallback: noopfn,
		handleCallBack: noopfn,
		hasAds: noopfn,
		renderAd: noopfn,
		saveAds: noopfn,
		setTargeting: noopfn,
		setTargetingForGPTAsync: noopfn,
		setTargetingForGPTSync: noopfn,
		tryGetAdsAsync: noopfn,
		updateAds: noopfn
	};
	w.amznads = amznads;
	w.amzn_ads = w.amzn_ads || noopfn;
	w.aax_write = w.aax_write || noopfn;
	w.aax_render_ad = w.aax_render_ad || noopfn;
})();
