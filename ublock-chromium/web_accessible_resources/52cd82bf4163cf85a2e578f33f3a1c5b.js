(function() {
	var ee = document.getElementsByTagName('script');
	var i = ee.length, src;
	while ( i-- ) {
		src = ee[i].src || '';
		if ( src === '' ) {
			continue;
		}
		if ( src.lastIndexOf('disqus.com/embed.js') === (src.length - 19) ) {
			return;
		}
	}
	var e = document.createElement('script');
	e.async = true;
	e.src = '//' + window.disqus_shortname + '.disqus.com/embed.js';
	document.body.appendChild(e);
})();
