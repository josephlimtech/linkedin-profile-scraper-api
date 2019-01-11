(function() {
	let head = document.head;
	if ( !head ) { return; }
	let style = document.createElement('style');
	style.textContent = [
		'body {',
		'  animation: none !important;',
		'  overflow: unset !important;',
		'}'
	].join('\n');
	head.appendChild(style);
})();
