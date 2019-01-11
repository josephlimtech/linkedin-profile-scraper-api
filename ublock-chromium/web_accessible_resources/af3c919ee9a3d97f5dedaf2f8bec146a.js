(function() {
	var noopfn = function() {
		;
	};
	window.addthis = {
		addEventListener: noopfn,
		button: noopfn,
		init: noopfn,
		layers: noopfn,
		ready: noopfn,
		sharecounters: {
			getShareCounts: noopfn
		},
		toolbox: noopfn,
		update: noopfn
	};
})();
