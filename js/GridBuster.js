var GridBuster = (function (){

	var BLOCK_TYPES = ["red", "blue", "green", "orange", "purple", "yellow"];

	var Selection = (function (){

		function _getKey(){
			return Array.prototype.join.apply(arguments, [","]);
		}

		function Selection(gameInstance, x, y){

			this.checked = [];
			this.added = [];

			this.gameInstance = gameInstance;
			this.type = this.gameInstance.getType(x, y);

			this.concat(this.getSelection(x, y));
		}

		Selection.prototype = Object.create(Array.prototype);

		Selection.prototype.highlight = function(){
			var len = this.length;


			while(len--){
				$("[data-x="+ this[len].x +"][data-y="+ this[len].y +"]").addClass("block-selection");
			}

		},

		Selection.prototype.push = function push(x, y) {
			var key = Array.prototype.join.apply(arguments, [","]);

			if(this.added.indexOf(key) === -1) {
				this.added.push(key);
				Array.prototype.push.apply(this, [{x: x, y: y}]);		
			}
		}

		Selection.prototype.isValid = function isValid(x, y) {
			var key = _getKey(x, y);

			console.log(x, y, this.checked.indexOf(key) === -1, this.gameInstance.getType(x, y), this.type)

			return x !== null && y !== null 
					&& this.checked.indexOf(key) === -1 
					&& this.gameInstance.getType(x, y) === this.type;
		}


		Selection.prototype.concat = function concat(items) {
			// kind of hackey but enforces uniqueness
			var iLen = items.length;

			while(iLen--) {
				this.push(items[iLen].x, items[iLen].y);
			}
		}

		Selection.prototype.checkCoord = function checkCoord(x, y, newSelection){
			if (this.isValid(x, y)) {
				newSelection.push({x: x, y:y});
			}
			this.checked.push(_getKey(x, y));
		}

		Selection.prototype.getSelection = function getSelection(x, y) {

			var bX = x > 0 ? x -1 : null,
				fX = x < this.gameInstance.width ? x + 1 : null,
				uY = y > 0 ? y -1 : null,
				dY = y < this.gameInstance.height ? y + 1: null,
				newSelection = [];

			this.checked.push(_getKey(x, y));

			this.checkCoord(bX, y, newSelection);
			this.checkCoord(fX, y, newSelection);
			this.checkCoord(x, uY, newSelection);
			this.checkCoord(x, dY, newSelection);

			var kLen = newSelection.length,
				others = [];

			while(kLen--){
				others = others.concat(this.getSelection(newSelection[kLen].x, newSelection[kLen].y));
			}

			newSelection.push({x: x, y: y});
			return newSelection.concat(others);
		}

		return Selection;
	})();


	function GridBuster(options) {
		options = options || {};

		this.element = options.element || $("<div>");
		this.element.addClass("grid-buster");

		this.elements = {
			gridContainer: $("<div class='block-container'>"),
			score: $("<div class='game-score'>"),
		}

		this.element.append(this.elements.score);
		this.element.append(this.elements.gridContainer);

		this.height = options.height || 8;
		this.width = options.width || 8;
		this.numberOfBlockTypes = Math.max(4, options.numberOfBlockTypes || 0);
		this.blockTypes = BLOCK_TYPES.slice(0, this.numberOfBlockTypes);

		this.elements.gridContainer.delegate(".block", "click", function handleBlockClick (event) { 
			
			var block = $(event.target);
			this.blockClick(block.data("x"), block.data("y"), block.data("type"));

			this.render();

		}.bind(this));

		this.elements.gridContainer.delegate(".block", "mouseenter", function handleBlockMouseEnter (event) { 
			
			if(event.type == "mouseenter") {

				var block = $(event.target),
					selection = new Selection(this, block.data("x"), block.data("y")),
					sLen = selection.length
					selector = "";

				while(sLen--) {
					selector += selector.length ? "," : "";
					selector += "[data-x=" +selection[sLen].x +"][data-y=" + selection[sLen].y + "]";
				}

				$(selector).addClass("block-selection");
			}

		}.bind(this));

		this.elements.gridContainer.delegate(".block", "mouseleave", function handleBlockMouseEnter (event) { 
			$(".block-selection").removeClass("block-selection");
		}.bind(this));

		this.blocks = [];
		this.score = 0;
		this.resetGame();
	}

	GridBuster.prototype.resetGame = function resetGame(){
		this.blocks = [];
		this.score = 0;

		var y = this.height;

		while(y--){
			var tmp = [],
				x = this.width;
			while(x--) {
				tmp.unshift(this.blockTypes[Math.floor(Math.random()*this.blockTypes.length)]);
			}
			this.blocks.unshift(tmp);
		}

		this.render();
	}

	GridBuster.prototype.render = function render(){
		this.elements.gridContainer.empty();
		this.elements.score.html(this.score);

		var y = this.height;

		while(y--) {
			var x = this.width;
			this.elements.gridContainer.prepend('<div style="clear:left;"><div/>');
			while(x--) {
				this.elements.gridContainer.prepend(
					'<div class="block" data-x="'+x+'" data-y="'+y+'" data-type="'+ this.blocks[y][x] +'"></div>'
				);
			}

		}
	}

	GridBuster.prototype.setType = function setType(x, y, type) {
		this.blocks[y][x] = type || null;
	}

	GridBuster.prototype.getType = function getType(x, y) {
		return this.blocks[y] && this.blocks[y][x] || null;
	}

	GridBuster.prototype.blockClick = function blockClick(x, y, type) {

		var selection = new Selection(this, x, y),
			sLen = selection.length,
			minx = this.width - 1,
			maxx = this.width -1;

		if(selection.length === 1) {
			return;
		}

		while(sLen--){
			this.score += selection.length - sLen;

			var c = selection[sLen];
			minx = Math.min(minx, c.x);
			maxx = Math.max(maxx, c.x);
			this.setType(c.x, c.y, null);
		}

		this.updateBlockTypes(minx, maxx);
	}

	GridBuster.prototype.updateBlockTypes = function (minx, maxx){
		maxx += 1;
		while(maxx-- > minx) {
			var y = this.height;
			while(y--){
				if(this.getType(maxx, y) === null) {
					this.setType(maxx, y, this.updateBlockTypeAbove(maxx, y));
				}
			}
		}
	}

	GridBuster.prototype.updateBlockTypeAbove = function (x, y){
		var type = null;
		while(y--){
			type = this.getType(x, y);
			if(type !== null) {
				this.setType(x, y, null);
				break;
			}
		}
		return type;
	}

	return GridBuster;
})();
