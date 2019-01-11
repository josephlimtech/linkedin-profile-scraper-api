(function() {
	delete window.PopAds;
	delete window.popns;
	Object.defineProperties(window, {
		PopAds: { value: {} },
		popns: { value: {} }
	});
})();
