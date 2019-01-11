(function() {
	window.adsbygoogle = window.adsbygoogle || {
		length: 0,
		loaded: true,
		push: function Si(a) {
			/*
			client = client || google_ad_client || google_ad_client;
			slotname = slotname || google_ad_slot;
			tag_origin = tag_origin || google_tag_origin
			*/
			this.length += 1;
		}
	};
	var phs = document.querySelectorAll('.adsbygoogle');
	var css = 'height:1px!important;max-height:1px!important;max-width:1px!important;width:1px!important;';
	for ( var i = 0; i < phs.length; i++ ) {
		var fr = document.createElement('iframe');
		fr.id = 'aswift_' + (i+1);
		fr.style = css;
		var cfr = document.createElement('iframe');
		cfr.id = 'google_ads_frame' + i;
		fr.appendChild(cfr);
		document.body.appendChild(fr);
	}
})();
