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

const Time = require('Time');
const Animation = require('Animation');

// Use export keyword to make a symbol available in scripting debug console
export const Diagnostics = require('Diagnostics');

// To use variables and functions across files, use export/import keyword
// export const animationDuration = 10;

// Use import keyword to import a symbol from another file
// import { animationDuration } from './script.js
	
const NUM_FLOWER=4;
const NUM_POEM=12;
	
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

async function randomResult(){
	index_flower=Math.floor(Math.random()*NUM_FLOWER);
	index_poem=Math.floor(Math.random()*NUM_POEM);
	
	Diagnostics.log('random result: '+`Flower_0${index_flower+1}`+"  "+index_poem);
	
	flower_tex=await Textures.findFirst(`Flower_0${index_flower+1}`);
	poem_tex= await Textures.findFirst(`poem-${index_poem+1}`);
	
	
}


;(async function () {  // Enables async/await in JS [part 1]

  // To access scene objects
	const [can0, can1, can2, hint, scan, bg, hint0,vase, flower, poem] = await Promise.all([
    	Scene.root.findFirst('canvas0'),
		Scene.root.findFirst('canvas1'),
		Scene.root.findFirst('canvas2'),
		
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
  	]);
	
	
	
  // To access class properties
  // const directionalLightIntensity = directionalLight.intensity;

  // To log messages to the console
  // Diagnostics.log('Console message logged from the script.');
	
	timeDriver_blink.start();
	
	let res=await randomResult();
	flower.texture=flower_tex;
	poem.texture=poem_tex;
	
	fadeAll([hint, scan], 100, false, ()=>{
		blink(hint);
	});
	
	TouchGestures.onTap().subscribe((gesture) => {
		
		switch(state){
			case 0:
				flower.diffuse=flower_tex;
				
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
				poem.diffuse=poem_tex;
		
				//TODO : fade in/ out
				fadeAll([bg, vase, flower, hint0], 0, true, ()=>{
					can1.hidden=true;
					can2.hidden=false;
				
					fadeAll([poem],100);
				
					state=2;
				
				});
				
				break;	
			case 2:
				fadeAll([poem], 0, true, ()=>{
				
					can2.hidden=true;
					can0.hidden=false;
					
					randomResult().then(()=>{
						flower.texture=flower_tex;
						poem.texture=poem_tex;
	
						fadeAll([hint, scan], 100, false, ()=>{
							blink(hint);
						});
					});
					state=0;
				});
			
				break;
		}		
	
		Diagnostics.log('onTap! state >'+state);

  	});


})(); // Enables async/await in JS [part 2]
