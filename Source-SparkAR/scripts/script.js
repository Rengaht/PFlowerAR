/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

//==============================================================================
// Welcome to scripting in Meta Spark Studio! Helpful links:
//
// Scripting Basics - https://fb.me/spark-scripting-basics
// Reactive Programming - https://fb.me/spark-reactive-programming
// Scripting Object Reference - https://fb.me/spark-scripting-reference
// Changelogs - https://fb.me/spark-changelog
//
// Meta Spark Studio extension for VS Code - https://fb.me/spark-vscode-plugin
//
// For projects created with v87 onwards, JavaScript is always executed in strict mode.
//==============================================================================

// How to load in modules
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');
const Textures = require('Textures');
const Materials = require('Materials');
const DeviceMotion = require('DeviceMotion');
const CameraInfo = require('CameraInfo');
const Reactive=require('Reactive');

const Time = require('Time');
const Animation = require('Animation');
const Blocks = require('Blocks');

// Use export keyword to make a symbol available in scripting debug console
export const Diagnostics = require('Diagnostics');


// To use variables and functions across files, use export/import keyword
// export const animationDuration = 10;

// Use import keyword to import a symbol from another file
// import { animationDuration } from './script.js
	
const NUM_FLOWER=4;
const NUM_POEM=12;
const NUM_PEDAL=6;
const COUNT_PEDAL=30;

const Boundary=0.3;
	
var index_flower;
var index_poem;	

var state=0;


// Duration of fade-in effect (in milliseconds)
const fadeDuration = 250; // 1 second



// blink
const timeDriver_blink = Animation.timeDriver({ durationMilliseconds: 1000, loopCount: Infinity, mirror: true });
const sampler_blink = Animation.samplers.easeInOutQuad(1, 0.5);
const animation_blink = Animation.animate(timeDriver_blink, sampler_blink);
    

var flower_tex;
var poem_tex;
var title_tex;
var pedal_tex=[];

var pedal_block=[];

async function resizeRect(name, width, aspectRatio){
	
	const rectangle=Scene.root.findFirst(name);
	
	const screenWidth = CameraInfo.previewSize.x;
	const screenHeight = CameraInfo.previewSize.y;
	
	const rectWidth = Reactive.val(screenWidth.pinLastValue()*width);
	const rectHeight = rectWidth.div(aspectRatio);

	// Check if height exceeds screen height, adjust accordingly
	const adjustedWidth = rectHeight.le(screenHeight).ifThenElse(rectWidth, screenHeight.mul(aspectRatio));
	const adjustedHeight = adjustedWidth.div(aspectRatio);

	// Apply the calculated width and height to the rectangle
	rectangle.width = screenWidth;
	rectangle.height = screenHeight;
	
}

function fadeAll(arr, delay, fadeout, callback){
	if(Array.isArray(arr)){
		
		const len=arr.length;
		for(var i=0;i<len;++i) fade(arr[i], delay/len*i, fadeout);
		
		if(typeof callback =='function'){
				setTimeout(()=>{
					
					Diagnostics.log('callback');
					
					callback();
					
				}, delay+fadeDuration);
		}
		
	}else{
		fade(arr, delay, fadeout);
	}
		
}
// Function to fade in a rectangle
function fade(mat, delay, fadeout) {
    
	if(!fadeout) mat.opacity=0;
	//rectangle.hidden = false;

    // Create an animation driver that goes from 0 to 1 over the fadeDuration
    
    // Start the time driver after a delay
    Time.setTimeout(function() {
    	const timeDriver = Animation.timeDriver({ durationMilliseconds: fadeDuration, loopCount: 1, mirror: false });
    	const sampler = fadeout? Animation.samplers.easeInQuad(1, 0):Animation.samplers.easeOutQuad(0, 1);

    	// Create the animation for opacity
    	const animation = Animation.animate(timeDriver, sampler);
    	mat.opacity=animation;
    	
		timeDriver.start();
		
		//Diagnostics.log('timer start: '+delay);
		
    }, delay);
}
function blink(mat) {
    
	mat.opacity=animation_blink;
    		
}
function getTitle(idx){
	switch(idx){
		case 2:
		case 3:
		case 8:
			return 3;
		case 4:
		case 7:
		case 10:
			return 2;
		case 1:
		case 5:
		case 6:
		case 9:
		case 11:
			return 1;
		case 12:
			return 0;
	}

}

async function randomResult(){
	index_flower=Math.floor(Math.random()*NUM_FLOWER);
	index_poem=Math.floor(Math.random()*NUM_POEM);
	
	Diagnostics.log('random result: '+`Flower_0${index_flower+1}`+"  "+index_poem);
	
	flower_tex=await Textures.findFirst(`Flower_0${index_flower+1}`);
	poem_tex= await Textures.findFirst(`poem-${index_poem+1}`);
	
	Diagnostics.log('title= '+getTitle(index_poem));
	
	title_tex= await Textures.findFirst(`title-${getTitle(index_poem)}`);
	
	// load pedals
	pedal_tex=[];
	for(var i=0;i<NUM_PEDAL;++i){
		let t=await Textures.findFirst(`pedal${index_poem}-${i+1}`);
		pedal_tex.push(t);
	}
		
	
}
function runPedal(callback){
		
	const timeDriver1 = Animation.timeDriver({ durationMilliseconds: fadeDuration, loopCount: 1, mirror: false });
    const sampler1 = Animation.samplers.easeOutQuad(0, Boundary*2);
    const animation1 = Animation.animate(timeDriver1, sampler1);

	const timeDriver2 = Animation.timeDriver({ durationMilliseconds: fadeDuration, loopCount: 1, mirror: false });
    const sampler2 = Animation.samplers.easeOutQuad(Boundary*2, Boundary*4);
    const animation2 = Animation.animate(timeDriver2, sampler2);

    for(var i=0;i<COUNT_PEDAL;++i){
		
    	let origin=pedal_block[i].__position;
		
		const positionAnimation = animation1.mul(origin[2]).clamp(0, Boundary*2).add(origin[1]);
    	pedal_block[i].transform.y = positionAnimation;
		
	}
	
	timeDriver1.onCompleted().subscribe(function() {
    	
		for(var i=0;i<COUNT_PEDAL;++i){
		
    		let origin=pedal_block[i].__position;
		
			const positionAnimation = animation2.mul(origin[2]).clamp(Boundary*2, Boundary*4).add(origin[1]);
			
    		pedal_block[i].transform.y = positionAnimation;
		
		}
    	
		setTimeout(()=>{
			
			Diagnostics.log('leave animation');
			
			timeDriver2.start();
			if(typeof callback=='function') callback();
		},fadeDuration*.5);
	});
	
	timeDriver1.start();
		
}

async function createPedals(can, mat){
	
	for(var i=0;i<COUNT_PEDAL;++i){
		//var block= await Blocks.instantiate('plan0');
		let w=0.08+0.01*Math.random();
		
		var block=await Scene.create("Plane", {
            "name": "Plane"+i,
            "width": w,
            "height": w,
            //"y": i/COUNT_PEDAL-0.5,
            "hidden": false,
        });
		
		let col=4;
		
		let x=(i%col/col+(Math.random()*.2-.1)-0.5)*.25;//+(Math.random()*.2-.1);
		let y=-(Math.floor(i/col)+1+(Math.random()*.4-.2))*Boundary/col-Boundary;
		
		//let x=(i%col/col-0.5)*.25;//+(Math.random()*.2-.1);
		//let y=-Math.floor(i/col)*Boundary/col-Boundary;
		
		let v=Math.random()*2+1;
		
		block.transform.x=x;
		block.transform.y=y;
		block.transform.z=0;
		block.transform.rotationZ=(Math.random()-.5)*Math.PI;
		
	
        can.addChild(block);
        //block.addChild(dynamicPlane);
		let indx=Math.floor(Math.random()*NUM_PEDAL);
		block.material=mat[indx];
		
		block.__position=[x,y, v];
		
		
		
		pedal_block.push(block);
    }	
}


;(async function () {  // Enables async/await in JS [part 1]
	
	
	const resize=await Promise.all([
		//resizeRect('bg', 0.7, 260/50),
		//resizeRect('scan0',0.7, 557/626),
		resizeRect('bg', 0.7, 1),
		resizeRect('scan0',0.7, 1),
	]);
  // To access scene objects
	const [can0, can1, can2, group,  hint, scan, bg, hint0,vase, flower, poem, poem_title] = await Promise.all([
    	Scene.root.findFirst('canvas0'),
		Scene.root.findFirst('canvas1'),
		Scene.root.findFirst('canvas2'),
		
		Scene.root.findFirst('group'),
		
		//Scene.root.findFirst('bg'),
		//Scene.root.findFirst('hint0'),
		//Scene.root.findFirst('flower'),
		Materials.findFirst('material-hint'),
		Materials.findFirst('material-scan-frame'),
		
		Materials.findFirst('material-bg'),
		Materials.findFirst('material-hint-2'),
		Materials.findFirst('material-vase'),
		
		
		//Scene.root.findFirst('poem'),
		Materials.findFirst('material-flower'),
		Materials.findFirst('material-poem'),
		Materials.findFirst('material-title'),
		
		//Scene.root.findFirst('plane0'),
  	]);

	const pedal_material = await Promise.all([
    	Materials.findFirst('material-pedal-1'),
		Materials.findFirst('material-pedal-2'),
		Materials.findFirst('material-pedal-3'),
		Materials.findFirst('material-pedal-4'),
		Materials.findFirst('material-pedal-5'),
		Materials.findFirst('material-pedal-6'),
  	]);
	
	
  // To access class properties
  // const directionalLightIntensity = directionalLight.intensity;

  // To log messages to the console
  // Diagnostics.log('Console message logged from the script.');
	
	timeDriver_blink.start();
	
	let res=await randomResult();
	flower.diffuse=flower_tex;
	poem.diffuse=poem_tex;
	poem_title.diffuse=title_tex;
	
	for(var i=0;i<NUM_PEDAL;++i) pedal_material[i].diffuse=pedal_tex[i];
	
	await createPedals(group, pedal_material);
	
	//runPedal();
	
	
	fadeAll([hint, scan], 100, false, ()=>{
		blink(hint);
	});
	
	TouchGestures.onTap().subscribe((gesture) => {
		
		switch(state){
			case 0:
				//flower.diffuse=flower_tex;
				
				fadeAll([hint, scan], 500, true, ()=>{
					
					can1.hidden=false;
					can0.hidden=true;
				
					fadeAll([bg, vase, flower, hint0] ,1000, false, ()=>{
						blink(hint0);
					});
					
				
					state=1;
				});
				
				break;
			case 1:
				
		
				fadeAll([bg, vase, flower, hint0], 0, true, ()=>{
					can1.hidden=true;
					can2.hidden=false;
					
					runPedal();
					fadeAll([poem, poem_title],fadeDuration);				
					
					state=2;
				
				});
				
				break;	
			case 2:
				/*fadeAll([poem, poem_title], 0, true, ()=>{
				
					can2.hidden=true;
					can0.hidden=false;
					
					randomResult().then(()=>{
	
						flower.texture=flower_tex;
						poem.texture=poem_tex;
						poem_title.texture=title_tex;
						for(var i=0;i<NUM_PEDAL;++i) pedal_material.texture[i]=pedal_tex[i];
	
	
						fadeAll([hint, scan], 100, false, ()=>{
							blink(hint);
						});
					});
					state=0;
				});*/
			
				break;
		}		
	
		Diagnostics.log('onTap! state >'+state);

  	});

	
	// rotate
	// Set thresholds for detecting rapid rotation changes (tune these values)
	const rotationThreshold = 0.5; // Adjust based on sensitivity needs
	const timeInterval = 2; // Time interval in milliseconds

	// Access the device's rotation data
	const deviceTransform = DeviceMotion.worldTransform;

	// Calculate the rate of change in rotation (magnitude of the rotation vector's derivative)
	const rotationChangeX = deviceTransform.rotationX.history(timeInterval).frame(-1);
	const rotationChangeY = deviceTransform.rotationX.history(timeInterval).frame(-1);
	const rotationChangeZ = deviceTransform.rotationX.history(timeInterval).frame(-1);
	
	//Diagnostics.log('rotation'+rotationChangeX+' '+rotationChangeY+' '+rotationChangeZ);

	// Calculate the magnitude of the rotation change
/*	const rotationChangeMagnitude = Reactive.sqrt(
    	rotationChangeX.pow(2).add(
        	rotationChangeY.pow(2).add(
            	rotationChangeZ.pow(2)
        	)
    	)
	);

	// Detect if the magnitude of the rotation change exceeds the threshold
	const shakeLikeMovementDetected = rotationChangeMagnitude.gt(rotationThreshold);

	// Subscribe to the shake-like movement detection event
	shakeLikeMovementDetected.monitor().subscribe(function(event) {
    	if (event.newValue) {
        	Diagnostics.log('Shake-like movement detected!');
        	// Add any action you want to perform when a shake-like movement is detected
    	}
	});
*/
	
	
})(); // Enables async/await in JS [part 2]
