(function() {
	var noopfn = function(){};
	window.pbjs = { libLoaded: true };
	var mb = window.MonkeyBroker || {
		addAttribute: noopfn,
		addSlot: function(a) {
			this.slots[a.slot] = {};
		},
		defineSlot: noopfn,
		fillSlot: noopfn,
		go: noopfn,
		inventoryConditionalPlacement: noopfn,
		registerSizeCallback: noopfn,
		registerSlotCallback: noopfn,
		slots: {},
		version: ''
	};
	mb.regSlotsMap = mb.slots;
	window.MonkeyBroker = mb;
})();
