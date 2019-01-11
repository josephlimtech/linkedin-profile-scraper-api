(function() {
	var p = document.getElementById(window.disqus_container_id || 'disqus_thread');
	if ( p === null ) {
		return;
	}
	var b = document.createElement('button');
	b.textContent = 'Disqus blocked by uBlock Origin: click to unblock';
	b.type = 'button';
	p.appendChild(b);
	var loadDisqus = function(ev) {
		b.removeEventListener('click', loadDisqus);
		p.removeChild(b);
		var script = document.createElement('script');
		script.async = true;
		var t = Date.now().toString();
		script.src = '//' + window.disqus_shortname + '.disqus.com/embed.js?_=1457540' + t.slice(-6);
		document.body.appendChild(script);
		ev.preventDefault();
		ev.stopPropagation();
	};
	b.addEventListener('click', loadDisqus);
})();
