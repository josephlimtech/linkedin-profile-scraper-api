(function() {
	var noopfn = function() {
		;
	};
	//
	var Fab = function() {};
	Fab.prototype.check = noopfn;
	Fab.prototype.clearEvent = noopfn;
	Fab.prototype.emitEvent = noopfn;
	Fab.prototype.on = function(a, b) {
		if ( !a ) { b(); }
		return this;
	};
	Fab.prototype.onDetected = function() {
		return this;
	};
	Fab.prototype.onNotDetected = function(a) {
		a();
		return this;
	};
	Fab.prototype.setOption = noopfn;
	var fab = new Fab(),
		getSetFab = {
			get: function() { return Fab; },
			set: function() {}
		},
		getsetfab = {
			get: function() { return fab; },
			set: function() {}
		};
	if ( window.hasOwnProperty('FuckAdBlock') ) { window.FuckAdBlock = Fab; }
	else { Object.defineProperty(window, 'FuckAdBlock', getSetFab); }
	if ( window.hasOwnProperty('BlockAdBlock') ) { window.BlockAdBlock = Fab; }
	else { Object.defineProperty(window, 'BlockAdBlock', getSetFab); }
	if ( window.hasOwnProperty('SniffAdBlock') ) { window.SniffAdBlock = Fab; }
	else { Object.defineProperty(window, 'SniffAdBlock', getSetFab); }
	if ( window.hasOwnProperty('fuckAdBlock') ) { window.fuckAdBlock = fab; }
	else { Object.defineProperty(window, 'fuckAdBlock', getsetfab); }
	if ( window.hasOwnProperty('blockAdBlock') ) { window.blockAdBlock = fab; }
	else { Object.defineProperty(window, 'blockAdBlock', getsetfab); }
	if ( window.hasOwnProperty('sniffAdBlock') ) { window.sniffAdBlock = fab; }
	else { Object.defineProperty(window, 'sniffAdBlock', getsetfab); }
})();
