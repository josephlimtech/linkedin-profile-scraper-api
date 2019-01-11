(function() {
	var magic = String.fromCharCode(Date.now() % 26 + 97) +
				Math.floor(Math.random() * 982451653 + 982451653).toString(36),
		oe = window.onerror;
	window.onerror = function(msg, src, line, col, error) {
		if ( typeof msg === 'string' && msg.indexOf(magic) !== -1 ) { return true; }
		if ( oe instanceof Function ) {
			return oe(msg, src, line, col, error);
		}
	}.bind();
	var throwMagic = function() { throw magic; };
	delete window.PopAds;
	delete window.popns;
	Object.defineProperties(window, {
		PopAds: { set: throwMagic },
		popns: { set: throwMagic }
	});
})();
