// HTML5 canvas context and size;
var ctx;
var canvWidth;
var canvHeight;

// nonogram grid
var grid;
var nonoWidth;
var nonoHeight;
var vertInput;
var horiInput;

var vertQueue;
var horiQueue;

var errors;


var COLORS = {
  BG : "#FF0000",
  UNKNOWN : "#888888",
  EMPTY : "#FFFFFF",
  FILLED : "#000000",
}

var TOKENS = {
  UNKNOWN : { value: 1, color: COLORS.UNKNOWN },
  EMPTY : { value: 2, color: COLORS.EMPTY },
  FILLED : { value: 3, color: COLORS.FILLED },
}

window.onload = function(){
  var canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");
  canvWidth = canvas.width;
  canvHeight = canvas.height;
  errors = document.getElementById("errors");
}

function makeGrid(){
  nonoWidth = document.getElementById("nonoWidth").value;
  nonoHeight = document.getElementById("nonoHeight").value;
  var horizontal = document.getElementById("horizontal");
  var vertical = document.getElementById("vertical");
  horizontal.innerHTML = "Horizontal: "
  vertical.innerHTML = "Vertical: ";
  grid = []
  for(var y  = 0; y < nonoHeight; y++){
    horizontal.innerHTML += '<input' +
      ' id="hori' + y + '"' +
      ' type="text"' +
      ' name="words"' +
      ' value="0"' +
      ' pattern="([0-9]| )*"' +
      '>';
  }
  for(var x = 0; x < nonoWidth; x++){
    vertical.innerHTML += '<input' +
      ' id="vert' + x + '"' +
      ' type="text"' +
      ' name="words"' +
      ' value="0"' +
      ' pattern="([0-9]| )*"' +
      '>';
  }
  grid = [];
  for(var x = 0; x < nonoWidth; x++){
    var column = [];
    for(var y = 0; y < nonoHeight; y++){
      column.push(TOKENS.UNKNOWN);
    }
    grid.push(column);
  }
  vertInput = [];
  horiInput = [];
  drawGrid();
  var solve = document.getElementById("solve");
  solve.innerHTML = '<input' +
      ' id="solveButton"' +
      ' type="button"' +
      ' name="solveButton"' +
      ' value="Solve!"' +
      ' onclick="solve()"' +
      '>';
}

function drawGrid(){
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect (0, 0, canvWidth, canvHeight);
  // want to fill canvas, leaving pixel width gaps between blocks as well as at 
  // canvas edges
  // Math.trunc rounds towards zero, Math.trunc(x / y) is effectively integer 
  // division
  blockWidth = Math.trunc( (canvWidth - nonoWidth - 1) / nonoWidth );
  blockHeight = Math.trunc( (canvHeight - nonoHeight - 1) / nonoHeight );
  // constrain blocks to be square
  if(blockWidth < blockHeight){
    blockHeight = blockWidth;
  } else {
    blockWidth = blockHeight;
  }
  // alter border size so grid is centred
  horiBorder = Math.trunc( ( canvWidth - ((blockWidth + 1) * nonoWidth - 1) ) / 2 );
  vertBorder = Math.trunc( ( canvHeight - ((blockHeight + 1) * nonoHeight - 1) ) / 2 );
  horiPos = horiBorder;
  for(var x = 0; x < nonoWidth; x++){
    vertPos = vertBorder;
    for(var y = 0; y < nonoHeight; y++){
      ctx.fillStyle = grid[x][y].color;
      ctx.fillRect(horiPos, vertPos, blockWidth, blockHeight);
      vertPos += blockHeight + 1;
    }
    horiPos += blockWidth + 1;
  }
}

function solve(){
  errors.innerHTML = '';
  vertQueue = [];
  horiQueue = [];
  for(var x = 0; x < nonoWidth; x++){
    var input = document.getElementById("vert"+x).value;
    try{
      vertInput.push(sanitizeInput(input));
    }catch (err){
      errors.innerHTML = err;
      return;
    }
  }
}

function sanitizeInput(input){
  var result = [];
  var temp = input.split(" ");
  for(var i in temp){
    if(temp[i] != ""){
      var num = temp[i]*1;
      if(num != num){
        // only NaN does not equal itself
        throw "Input contains non-numbers"
      } else if (num == 0 && temp.length > 1){
        throw "Contains zero length chains"
      } else {
        result.push(num);
      }
    }
  }
  if(result.length == 0){
    result = [0];
  }
  return result;
}