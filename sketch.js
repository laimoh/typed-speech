// map function 
const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
   window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

var start = window.mozAnimationStartTime;

var fontFileName = 'fonts/SourceCodePro-Regular.otf';
var font = null; // font object filled once font loads
var fontSize = 50;
var textToRender = " Sonic type appears here..."; // holds string value
var drawPoints = false; // bool to draw letterform points
var drawMetrics = false; // bool for drawing grid
var kerning = true; // apply letter spacing
var ligatures = true; // a ligature occurs where two or more graphemes or letters are joined as a single glyph eg fi
var hinting = false; // Hinting, or screen optimising, is the process by which TrueType or PostScript fonts are adjusted for maximum readability on computer monitors.
var snapPath = null; // path of letterforms
var snapStrength = 10; // letter strength
var snapDistance = 10; // 
var snapX = 0; // x axis for each letter
var snapY = 0; // y axis for each letter
var fontSizeSlider = document.getElementById("font-size-range");

let audioCtx, analyser;
let amplitude;
let bufferLength;
let dataArray;
let newMin, newMax;
let ampArray = [];

let recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1

let animationRequest;
const introText = document.querySelector('.main-explainer')
const intro = document.querySelector('.intro-fullscreen')
introText.addEventListener('click', () => {
   intro.classList.add('fadeOut')
   setTimeout(() => {
      intro.style.display = "none";
   }, 1000)
})

const helpbtn = document.getElementById('help');
helpbtn.addEventListener('click', () => {
   const helpText = document.querySelector('.sub-explainer')
   if (helpText.classList.contains('invisible')) {
      helpText.style.opacity = 1;
      helpText.classList.remove('invisible');
   } else {
      helpText.style.opacity = 0;
      helpText.classList.add('invisible');
   }

})

const recordbtn = document.getElementById('record');
recordbtn.classList.add('notRec');

recordbtn.addEventListener('click', () => {
   // start speech rec
   if (recordbtn.classList.contains('notRec')) {
      recordbtn.classList.remove('notRec');
      recordbtn.classList.add('Rec');
      recognition.start();
      audioCtx = new(window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;
      initialiseMic()

   } else {
      recordbtn.classList.remove('Rec');
      recordbtn.classList.add('notRec');
      recognition.stop();
      document.getElementById('info').innerHTML = "PRESS BUTTON TO START";
   }

})

recognition.onerror = function (error) {
   document.getElementById('info').innerHTML = "TRY AGAIN PLEASE :)";
   setTimeout(() => {
      recognition.stop();
      document.getElementById('info').innerHTML = "PRESS BUTTON TO START";
   }, 1500)
   console.log(error)
}

recognition.onstart = function () {
   document.getElementById('info').innerHTML = "START SPEAKING";
}

recognition.onsoundstart = function () {
   collectData()
}

recognition.onresult = function (event) {
   cancelAnimationFrame(animationRequest);
   let current = event.resultIndex
   textToRender = event.results[current][0].transcript

   if (newMin >= 100 || newMax >= 100) {
      newMin = 100;
      newMax = 100;
   }
   snapStrength = Math.floor(newMin)
   snapDistance = Math.floor(newMax)


   // console.log(snapStrength)
   // console.log(snapDistance)
   renderText()
}

function initialiseMic() {
   let constraints = {
      audio: true,
      video: false
   };
   // get microphone access
   navigator.mediaDevices.getUserMedia(constraints)
      .then(function (stream) {
         // if successful
         console.log("Microphone access allowed")
         const audioSource = audioCtx.createMediaStreamSource(stream);
         audioSource.connect(analyser);
      })
      .catch(function (err) {
         // if unsuccessful
         console.log("Error " + err.message)
      });
}

function collectData() {

   animationRequest = window.requestAnimationFrame(collectData)
   let a = getMicData();
   ampArray.push(a)
   let maxVal = ampArray.reduce(function (a, b) {
      return Math.max(a, b);
   });
   let minVal = Math.min.apply(null, ampArray.filter(Boolean));
   newMin = map(minVal, 0, 10, 0, 100)
   newMax = map(maxVal, 0, 100, 0, 100)

}


function getMicData() {
   bufferLength = analyser.fftSize;
   dataArray = new Uint8Array(bufferLength);
   analyser.getByteFrequencyData(dataArray);
   let maxAmp = 0;
   let sumOfAmplitudes = 0;
   for (let i = 0; i < bufferLength; i++) {
      let thisAmp = dataArray[i]; // amplitude of current bin
      if (thisAmp > maxAmp) {
         sumOfAmplitudes = sumOfAmplitudes + thisAmp;
      }
   }
   let averageAmplitude = sumOfAmplitudes / bufferLength;
   return averageAmplitude;
}

enableHighDPICanvas('snap');

function enableHighDPICanvas(canvas) {
   if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
   }
   var pixelRatio = window.devicePixelRatio || 1;
   if (pixelRatio === 1) return;
   var oldWidth = canvas.width;
   var oldHeight = canvas.height;
   canvas.width = oldWidth * pixelRatio;
   canvas.height = oldHeight * pixelRatio;
   canvas.style.width = oldWidth + 'px';
   canvas.style.height = oldHeight + 'px';
   canvas.getContext('2d').scale(pixelRatio, pixelRatio);
}

// load font file
opentype.load(fontFileName, function (err, font) {
   if (err) {
      console.log(err.toString());
      return;
   }
   onFontLoaded(font);
});

// document.getElementById('font-name').innerHTML = fontFileName.split('/')[1];

function onFontLoaded(font) {
   window.font = font;
   renderText();
}

function fontSizeChanged() {
   fontSize = parseInt(fontSizeSlider.value, 10); // html takes min & max range as a string - parse into a integer
   document.getElementById('fontSize').innerHTML = ' ' + fontSize;
   renderText();
}

// FireFox & Chrome fire the 'input' event continuously, then the 'change' event on mouse up.
// IE 11 doesn't fire the 'input' event at all, but the 'change' event continuously.
fontSizeSlider.addEventListener('input', fontSizeChanged, false);
fontSizeSlider.addEventListener('change', fontSizeChanged, false);


function renderText() {
   if (!font) return;

   var options = {
      kerning: kerning,
      hinting: hinting,
      features: {
         liga: ligatures,
         rlig: ligatures
      }
   };
   //  path of points 
   snapPath = font.getPath(textToRender, 0, 200, fontSize, options);
   // snap points into grid
   doSnap(snapPath);
   var snapCtx = document.getElementById('snap').getContext('2d');
   // clear canvas before drawing
   snapCtx.clearRect(0, 0, 1250, 300);
   snapPath.draw(snapCtx);

   const downloadbtn = document.querySelector('#downloadLink')
   const downloadURL = document.getElementById('snap').toDataURL();
   document.getElementById('downloadLink').href = downloadURL;

   downloadbtn.addEventListener('click', () => {

   })
}


// Round a value to the nearest "step".
function snap(v, distance, strength) {
   return (v * (1.0 - strength)) + (strength * Math.round(v / distance) * distance);
}

function doSnap(path) {

   var strength = snapStrength / 100.0;
   for (let i = 0; i < path.commands.length; i++) {
      var cmd = path.commands[i];
      if (cmd.type !== 'Z') {
         // 'z' indicates a closed path
         cmd.x = snap(cmd.x + snapX, snapDistance, strength) - snapX;
         cmd.y = snap(cmd.y + snapY, snapDistance, strength) - snapY;
      }
      if (cmd.type === 'Q' || cmd.type === 'C') {
         // 'C' is curveTo and 'Q' is quadratic Béziers
         cmd.x1 = snap(cmd.x1 + snapX, snapDistance, strength) - snapX;
         cmd.y1 = snap(cmd.y1 + snapY, snapDistance, strength) - snapY;
      }
      if (cmd.type === 'C') {
         // 'C' is curveTo
         cmd.x2 = snap(cmd.x2 + snapX, snapDistance, strength) - snapX;
         cmd.y2 = snap(cmd.y2 + snapY, snapDistance, strength) - snapY;
      }
   }
}

function getGlyphs(path) {

}

function downloadFont(fontName) {
   fontName.download()
}