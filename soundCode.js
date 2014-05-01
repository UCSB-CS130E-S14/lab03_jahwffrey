var mouse = {x:0,y:0,cvX:0,cvY:0,isPressed:false,isRightPressed:false}
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var context = new AudioContext();

var width = 1200;
var height = 120;

var howFarRight = 40;//32;
var howFarDown = 17;
var rightShift = 0;
var noteList = [];
var tempo = 100;
var timer = 500;
var tempoLine = 0;

var makingNotes = true;

//Things I need:
var going = false;
var holder = null;
var whichNote = 0;
var doNote = true;
var dragging = false;

var doSnap = false;

//notes
var octave = 4;
var baseFreq = 16.35*Math.pow(2,octave);//261.65;
var topFreq = 55.0*Math.pow(2,octave);//880.0;


$(document).ready(function(){

	redraw();

	//tempo functions:
	$("#dist").change(function(){
		tempo = parseInt(document.getElementById("dist").value);
		redraw();
	});
	$("#time").change(function(){
		timer = parseFloat(document.getElementById("time").value)*1000;
	});
	
	
	$("#snap").click(function(){
		if(doSnap){
			doSnap = false;
			$(this).html('Snap to Notes: No');
		}
		else{
			doSnap = true;
			$(this).html('Snap to Notes: Yes');
		}
	});
	
	$("#togDel").click(function(){
		if(makingNotes){
			makingNotes = false;
			$(this).html('Make Notes');
		}
		else{
			makingNotes = true;
			$(this).html('Delete Notes');
		}
	});
	
	//Save/Load:
	$("#save").click(function(){
		var tempString = "";
		tempString = tempString+tempo+"|"+timer+"|";
		for(var i = 0;i < noteList.length;i++){
			tempString = tempString+noteList[i].actualX+"|"+noteList[i].x+"|"+noteList[i].y+"|"+noteList[i].frequency+"|";
		}
		document.getElementById("io").value = tempString;
	});
	
	$("#load").click(function(){
		var temppString = document.getElementById("io").value;
		var tempArray = temppString.split("|");
		tempo = parseFloat(tempArray[0]);
		timer = parseFloat(tempArray[1]);
		document.getElementById("dist").value = tempo;
		document.getElementById("time").value = timer/1000;
		noteList.length = 0;
		var count = 2;
		while(count < tempArray.length){
			var newNote = new note(5,5);
			newNote.actualX=parseFloat(tempArray[count]);
			newNote.x=parseFloat(tempArray[count+1]);
			newNote.y=parseFloat(tempArray[count+2]);
			newNote.frequency=parseFloat(tempArray[count+3]);
			noteList.push(newNote);
			count+=4;
		}
		noteList.pop();
		redraw();
	});
	
	function note(x,y){
		this.actualX=x+rightShift;
		this.x = x;
		this.y = y;
		var pos = ((height-this.y)/height)
		this.frequency = baseFreq*Math.pow((topFreq/baseFreq),(pos));//(261.6+(((height-this.y)/height)*1306.4));//*Math.pow(2,octave);
		playSound(this.frequency)
	}
	
	function playSound(freq){
		//rediculous sound nonsense THAT WORKS
		var oscillator = null;
		var attackValue = .9;
		var sustainValue = .1;
		var decayValue = .1;
		var releaseValue = .8;
		var currTime = context.currentTime;
		var volume = 0;
		var oscillator = context.createOscillator();
		oscillator.type = 0;
		oscillator.frequency.value = freq;
		var gainNode = context.createGain();
		oscillator.connect(gainNode);
		gainNode.connect(context.destination);
		oscillator.start(0);
		gainNode.gain.linearRampToValueAtTime(1, currTime + attackValue);
		gainNode.gain.linearRampToValueAtTime(sustainValue, currTime + attackValue + decayValue);
		currTime = context.currentTime;
		volume = gainNode.gain.value/5;
		gainNode.gain.linearRampToValueAtTime(volume, currTime);
		gainNode.gain.linearRampToValueAtTime(0, currTime + releaseValue);
		oscillator.stop(currTime + releaseValue);
	}
	
	$(document).mousemove(function(evnt){
		if(dragging===true){
			var mov = evnt.pageX-mouse.x
			if(Math.abs(mov)>1) doNote=false;
			rightShift-=(mov);//$("#hi").html(mouse.x-evnt.pageX);
			if(rightShift<-5) rightShift = -5;
			if(!going){
				if(rightShift%tempo<(tempo/10)){
					tempoLine = rightShift;
					while(tempoLine%tempo!=0){
						tempoLine+=1;
					}
				}
			}
			redraw();
		}
		else{};
		mouse.x = evnt.pageX;
		mouse.y = evnt.pageY;
		mouse.cvX = mouse.x-howFarRight;
		mouse.cvY = mouse.y-howFarDown;
	});
	
	$("#soundCanv").mousedown(function(){
		dragging = true;
	});
	
	
	//Mouse up!
	$("#soundCanv").mouseup(function(){
		if(doNote && makingNotes)noteListAdd(mouse.cvX,mouse.cvY);
		if(!makingNotes){
			for(var i = 0;i < noteList.length;i++){
				if(Math.abs((Math.abs(mouse.x-(noteList[i].actualX-rightShift))-howFarRight))<5 && Math.abs(Math.abs(mouse.y-(noteList[i].y))-howFarDown)<5){
					noteList.splice(i,1);
					redraw();
				}
			}
		}
	});
	
	$(document).mouseup(function(){
		doNote=true;
		dragging = false;
	});
	
	//Playback:
	$("#go").click(function(){
		if(going===false){
			$(this).html('STOP!');
			for(var i = 0;i < noteList.length;i++){
				if(noteList[i].actualX<tempoLine){
					whichNote+=1;
				}
				else i = noteList.length;
			}
			holder = setInterval(function(){play()},timer);
			going  = true;
		}
		else {
			$(this).html('GO!');
			clearInterval(holder);
			tempoLine = 0;
			whichNote = 0;
			going = false;
			redraw();
		}
	});
	
	function noteListAdd(noteX,noteY){
		if(doSnap){
			noteList.push(new note(noteX,snapTo(noteY)));
		}
		else{
			noteList.push(new note(noteX,noteY));
		}
		var trav = noteList.length-1;
		while(trav-1>-1 && noteList[trav-1].actualX>noteList[trav].actualX){
			//function(){
				var temp = noteList[trav];
				var temp2 = noteList[trav-1];
				noteList[trav]=temp2;
				noteList[trav-1]=temp;
				trav-=1;
			//}();
		}
		redraw();
	}
	
	function play(){
		if(noteList[0]!=undefined){
			tempoLine+=tempo;
			if(noteList[whichNote]===undefined){
				tempoLine = 0;
				whichNote = 0;
			}
			while(whichNote<noteList.length && tempoLine>noteList[whichNote].actualX){
				playSound(noteList[whichNote].frequency);
				whichNote+=1;
			}
			redraw();
		}
	}
	
	function snapTo(noteY){
		var num = 13;
		var yy=0;
		while(Math.abs(noteY-yy)>((height/num)/2+1)){
			yy+=(height/num)+.8;
		}
		return yy;
	}
	
	function redraw(){
		var can = document.getElementById("soundCanv");
		var canX = can.getContext("2d");
		var xStart = -rightShift%tempo;
		canX.clearRect(0,0,width,height);
		canX.fillStyle = "white";
		canX.fillRect(0,0,width,height);
		canX.fillStyle = "rgb(200,200,200)";
		for(var i = xStart;i < width;i+=tempo){
			canX.fillRect(i,0,1,height);
		}
		canX.fillStyle = "black";
		canX.fillRect(0,(height/6),width,1);
		canX.fillRect(0,(height/6)*2,width,1);
		canX.fillRect(0,(height/6)*3,width,1);
		canX.fillRect(0,(height/6)*4,width,1);
		canX.fillRect(0,(height/6)*5,width,1);
		for(var i = 0;i < noteList.length;i++){
			canX.fillRect(noteList[i].actualX-rightShift-5,noteList[i].y-5,10,10);
		}
		canX.fillStyle = "red";
		canX.fillRect(tempoLine-rightShift,0,1,height);
	}
});