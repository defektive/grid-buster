var GridBuster = (function (){



	function _handleBlockClick (event) {
		var block = event.target._block;
		this.blockClick(block);
	}

	function _handleBlockMouseEnter (event) {
		var block = event.target._block,
			type = block.getType(),
			selection = type ? new Selection(this.grid, block) : [],
			sLen = selection.length,
			selector = "";

		while(sLen--) {
			var coords = selection[sLen].getCoords();

			selector += selector.length ? "," : "";
			selector += "[data-x=" + coords .x +"][data-y=" + coords.y + "]";
		}

		$(selector).addClass("block-selection");
	}

	function _handleBlockMouseLeave (event) {
		$(".block-selection").removeClass("block-selection");
	}

	var LEVEL_OFFSET = 2;
	/**
	 * GridBuster Constructor
	 * Options:
	 *  height:
	 * @Class GridBuster
	 * @classdesc Core GridBuster Class this is the main parent class. Its main function is keeping score and setting up other classes
	 * @param {{height: number, width: number, numberOfBlockTypes: number, element: HTMLElement}} options Valid Options are:
	 *      height,
	 *      width,
	 *      startLevel,
	 *      element
	 * @constructor
	 */
	function GridBuster(options) {
		options = options || {};

		this.element = options.element || $("<div>");
		this.element.addClass("grid-buster");

		this.elements = {
			gridContainer: $("<div>"),
			score: $("<div class='game-score'>"),
			nextLevel: $("<button>Next Level</button>"),
			restart: $("<button>Restart</button>")
		};

		this.element.append(this.elements.score);
		this.element.append(this.elements.restart);
		this.element.append(this.elements.nextLevel);
		this.element.append(this.elements.gridContainer);


		this.element.delegate(".block", "click", _handleBlockClick.bind(this));
		this.element.delegate(".block", "mouseenter", _handleBlockMouseEnter.bind(this));
		this.element.delegate(".block", "mouseleave", _handleBlockMouseLeave.bind(this));

		this.level = options.startLevel || 1;

		this.grid = new Grid({
			element: this.elements.gridContainer,
			blockSize: options.blockSize || 80,
			height: options.height,
			width: options.width,
			numberOfBlockTypes: (LEVEL_OFFSET + this.level)
		});

		this.startTime = new Date().getTime();

		this.elements.restart.click(function (){
			this.resetGame();
		}.bind(this));

		this.elements.nextLevel.click(GridBuster.prototype.nextLevel.bind(this));

		this.resetGame();
	}

	GridBuster.prototype.nextLevel = function nextLevel(){
		this.level++;
		var numberOfBlocks = LEVEL_OFFSET + this.level;
		if(numberOfBlocks > GridBuster.BLOCK_TYPES.length) {
			alert("The Game is over it took you "+ (new Date().getTime() - this.startTime) / 1000 +" seconds to get "+ this.score+" points!");
		}
		this.grid.setNumberOfBlocks(LEVEL_OFFSET + this.level);
		this.grid.fillEmptyBlocks();
	}

	GridBuster.prototype.resetGame = function resetGame(){
		this.score = 0;
		this.grid.setup();
		this.updateUI();
	}

	GridBuster.prototype.updateUI = function updateUI(){
		this.elements.score.html(this.score);
	}

	GridBuster.prototype.blockClick = function blockClick(block) {

		var selection = new Selection(this.grid, block),
			selectionScore = 0,
			special = 0,
			sLen = selection.length,
			minx = this.grid.width - 1,
			maxx = this.grid.width - 1;

		if(selection.length === 1) {
			return;
		}

		while(sLen--){
			selectionScore += selection.length - sLen;

			var selectedBlock = selection[sLen],
				selectedCoors = selectedBlock.getCoords();

			minx = Math.min(minx, selectedCoors.x);
			maxx = Math.max(maxx, selectedCoors.x);

			if(selectedBlock.isSpecial()) {
				special++;
			}

			selectedBlock.remove();
		}

		if(special) {
			selectionScore = selectionScore * (3 * special);
		}

		this.score += selectionScore;

		this.updateUI();
		this.updateGrid(minx, maxx);
	}

	GridBuster.prototype.updateGrid = function (minx, maxx){
		maxx += 1;
		while(maxx-- > minx) {
			this.updateColumn(maxx);
		}

		var half = Math.floor(this.grid.width/2),
			x = half + 1,
			y = this.grid.height - 1;

		while (x--){
			var tmpBlock = this.grid.getBlock(x, y);
			if(tmpBlock === null) {
				var blockBefore = this.getBlockBefore(x, y);
				if(blockBefore) {
					this.grid.element.find("[data-x="+ blockBefore.getCoords().x + "]").attr("data-x", x);
				}
			}
		}

		x = half;
		while (x++ < this.grid.width){
			var tmpBlock = this.grid.getBlock(x, y);
			if(tmpBlock === null) {
				var blockBefore = this.getBlockAfter(x, y);
				if(blockBefore) {
					this.grid.element.find("[data-x="+ blockBefore.getCoords().x + "]").attr("data-x", x);
				}
			}
		}

		var activeBlocks = $("[data-x][data-y]").length,
			totalBlocks = this.grid.height * this.grid.width,
			ratio = activeBlocks / totalBlocks;

		if(ratio < .3){
			this.nextLevel();
		}
	}

	GridBuster.prototype.updateColumn = function (x){
		var y = this.grid.height;

		while(y--) {
			var tmpBlock = this.grid.getBlock(x, y);
			if(tmpBlock === null) {
				var newBlock = this.getBlockAbove(x, y);
				if(newBlock) {
					newBlock.setCoords(x, y);
				}
			}
		}
	}

	GridBuster.prototype.getBlockAbove = function (x, y){
		while(y--) {
			var tmpBlock = this.grid.getBlock(x, y);
			if(tmpBlock !== null) {
				return tmpBlock;
			}
		}

		return null;
	}

	GridBuster.prototype.getBlockBefore = function (x, y){
		while(x--) {
			var tmpBlock = this.grid.getBlock(x, y);
			if(tmpBlock !== null) {
				return tmpBlock;
			}
		}

		return null;
	}

	GridBuster.prototype.getBlockAfter = function (x, y){
		while(x++ < this.grid.width) {
			var tmpBlock = this.grid.getBlock(x, y);
			if(tmpBlock !== null) {
				return tmpBlock;
			}
		}

		return null;
	}

	var Grid = GridBuster.Grid = (function (){

		function Grid(options) {
			options = options || {};

			this.element = options.element || $("<div>");
			this.element.addClass("block-container");

			this.height = options.height || 8;
			this.blockSize = options.blockSize || 80;
			this.width = options.width || 8;

			this.setNumberOfBlocks(options.numberOfBlockTypes || 3);

			var y = this.height,
			stylesheet = new Stylesheet();

			stylesheet.insertRule(".block-container .block {width: "+ this.blockSize +"px; height: "+ this.blockSize +"px;}");

			while(y--){
				var x = this.width;
				while(x--){
					var selector = "[data-x='"+ x +"'][data-y='" + y + "']",
						rule = "{ "
						+"left: "+ (x * this.blockSize) +"px;"
						+"top: "+ (y * this.blockSize) +"px;"
						+"}";

					stylesheet.insertRule(selector + rule);
				}
			}
		}

		Grid.prototype.setNumberOfBlocks = function setNumberOfBlocks(num) {
			this.numberOfBlockTypes = num;
			this.blockTypes = BLOCK_TYPES.slice(0, this.numberOfBlockTypes);
		}

		Grid.prototype.setup = function setup(){
			this.element.empty();
			this.fillEmptyBlocks();
		}

		Grid.prototype.fillEmptyBlocks = function fillEmptyBlocks(){

			var totalBlocks = this.height * this.width,
				activeBlocks = $("[data-x][data-y]").length,
				blocksToBeCreated = totalBlocks - activeBlocks,
				domFragment = $(document.createDocumentFragment()),
				blocks = [];

			while(blocksToBeCreated--) {
				var tmpBlock = new Block(this.blockTypes[Math.floor(Math.random() * this.blockTypes.length)], Math.random() * 10 > (10 - (this.numberOfBlockTypes / 3)));
				domFragment.append(tmpBlock.element);
				blocks.push(tmpBlock);
			}


			this.element.append(domFragment);


			setTimeout(function (){
				this.placeUnplacedBlock(blocks);
				delete blocks;
			}.bind(this), 300);
		}

		Grid.prototype.placeUnplacedBlock = function(blocks){

			var y = this.height;
			while(y--) {
				var x = this.width;
				while(x--) {
					var block = this.getBlock(x, y);
					if(block === null) {
						block = blocks.shift();

						block.setCoords(x, y);
					}
				}
			}

		}

		Grid.prototype.getBlock = function getBlock(x, y) {
			var el = this.element.find("[data-x="+ x +"][data-y="+ y +"]");
			if(el.length) {
				return el[0]._block;
			}

			return null;
		}


		return Grid;
	})();


	/**
	 *
	 * @type {Array}
	 */
	var BLOCK_TYPES = GridBuster.BLOCK_TYPES = ["red", "blue", "green", "pink", "orange", "purple", "yellow"];

	var Selection = GridBuster.Selection = (function (){

		function _getKey(){
			return Array.prototype.join.apply(arguments, [","]);
		}

		/**
		 *
		 * @param gameInstance
		 * @param x
		 * @param y
		 * @constructor
		 */
		function Selection(gridInstance, block){

			this.checked = [];
			this.added = [];
			this.gridInstance = gridInstance;

			this.block = block;
			this.type = block.getType();

			this.concat(this.getSelection(this.block));
		}

		Selection.prototype = Object.create(Array.prototype);

		Selection.prototype.highlight = function(){
			var len = this.length;
			while(len--){
				this[len].highlight();
			}
		},

		Selection.prototype.push = function push(block) {
			var coords = block.getCoords(),
				key = _getKey(coords.x, coords.y);

			if(this.added.indexOf(key) === -1) {
				this.added.push(key);
				Array.prototype.push.apply(this, [block]);
			}
		}

		Selection.prototype.concat = function concat(items) {
			// kind of hackey but enforces uniqueness
			var iLen = items.length;

			while(iLen--) {
				this.push(items[iLen]);
			}
		}

		Selection.prototype.getSelection = function getSelection(block) {

			var blockCoords = block.getCoords(),
				x = blockCoords.x,
				y = blockCoords.y,

				adjacentCoords = {
					before: {
						x: x > 0 ? x -1 : null,
						y: y
					},

					after: {
						x: x < this.gridInstance.width ? x + 1 : null,
						y: y
					},

					above: {
						x: x,
						y: y > 0 ? y -1 : null
					},

					below: {
						x: x,
						y: y < this.gridInstance.height ? y + 1: null
					}
				},
				newSelection = [];

			this.checked.push(_getKey(x, y));

			var coordKeys = Object.keys(adjacentCoords),
				kLen = coordKeys.length;

			while(kLen--) {
				var tmpCoord = adjacentCoords[coordKeys[kLen]],
					key = _getKey(tmpCoord.x, tmpCoord.y),
					tmpBlock = this.gridInstance.getBlock(tmpCoord.x, tmpCoord.y);

				if(tmpCoord.x === null || tmpCoord.y === null || tmpBlock === null) {
					continue;
				}

				var type = tmpBlock.getType();
				if (this.checked.indexOf(key) === -1 && type && type == this.type) {
					newSelection.push(tmpBlock);
				}
				this.checked.push(_getKey(tmpCoord.x, tmpCoord.y));
			}

			var sLen = newSelection.length,
				others = [];

			while(sLen--){
				others = others.concat(this.getSelection(newSelection[sLen]));
			}

			newSelection.push(block);
			return newSelection.concat(others);
		}

		return Selection;
	})();


	/**
	 *
	 * @param type
	 * @param special
	 * @constructor
	 */
	var Block = GridBuster.Block = (function (){

		function Block(type, special) {
			this.type = type;
			this.special = special;
			this.element = $("<div class='block' data-type='" + this.type + "' data-special='" + this.special.toString() + "'></div>");
			this.element[0]._block = this;
		}

		Block.prototype.getType = function (){
			return this.type;
		}

		Block.prototype.setType = function (type){
			this.type = type;
		}

		Block.prototype.isSpecial = function (){
			return this.special === true;
		}

		Block.prototype.getCoords = function (){
			return {
				x: parseInt(this.element.attr("data-x"), 10),
				y: parseInt(this.element.attr("data-y"), 10)
			}
		}

		Block.prototype.setCoords = function (x, y){
			this.element.attr("data-x", x);
			this.element.attr("data-y", y);
		}

		Block.prototype.remove = function (){
			this.element.remove();
			delete this.element._block;
			delete this.element;
		}

		Block.prototype.highlight = function (){
			this.element.addClass("block-selection")();
		}

		return Block;
	})();

	return GridBuster;
})();
