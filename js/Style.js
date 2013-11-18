var Stylesheet = (function() {
	function Stylesheet() {
		var styleElement = document.createElement('style');
		document.getElementsByTagName('head')[0].appendChild(styleElement);

		this.stylesheet = document.styleSheets[document.styleSheets.length - 1];
	}

	Stylesheet.prototype.insertRule = function(rule) {
		if (this.stylesheet.insertRule) {
      	   this.stylesheet.insertRule(rule, this.stylesheet.cssRules.length);
		} else {
      	   // this.stylesheet.addRule(rule, this.stylesheet.cssRules.length);
		}
	};

	return Stylesheet;
})();
