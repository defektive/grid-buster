
var SoundManager = (function (){

	function SoundManager(soundFiles){
		this.soundFiles = soundFiles;
		this.soundElements = {};

		for(var name in this.soundFiles){
			this.soundElements[name] = document.createElement("audio");
			this.soundElements[name].setAttribute("src", this.soundFiles[name]);

			document.body.appendChild(this.soundElements[name] );
		}

	}

	SoundManager.prototype.play = function (name, stopCurrent, loop) {
		if(stopCurrent){

		}

		$(this.soundElements[name]).animate({volume: 1}, 200);

		this.soundElements[name].play();
	}

	SoundManager.prototype.pause = function (name){
		$(this.soundElements[name]).animate({volume: 0}, 200, function (){
			this.soundElements[name].pause();
		}.bind(this));
	}

	return SoundManager;
})();
