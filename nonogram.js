// HTML5 canvas context and size;
var ctx;
var canvWidth;
var canvHeight;

// nonogram grid
var grid;
var nonoWidth;
var nonoHeight;
var vertLines;
var horiLines;

var errors;

class Line {
  constructor (numbers){
    this.numbers = numbers;
    this.solved = false;
    this.newInfo = false;
  }
}


var COLORS = {
  BG : "#dedbff",
  UNKNOWN : "#6b6d94",
  EMPTY : "#FFFFFF",
  FILLED : "#212494",
}

var TOKENS = {
  UNKNOWN : { value: 1, color: COLORS.UNKNOWN },
  EMPTY : { value: 2, color: COLORS.EMPTY },
  FILLED : { value: 3, color: COLORS.FILLED },
}

window.onload = function(){
  errors = document.getElementById("errors");
  var canvas = document.getElementById("myCanvas");
  var div = document.getElementById("canvasDiv");
  ctx = canvas.getContext("2d");
  canvWidth = div.clientWidth-15;
  canvas.width = canvWidth;
  canvHeight = div.clientHeight;
  canvas.height = canvHeight;
  console.log(canvHeight);
  drawGrid();
}

window.onresize= function(){
  var canvas = document.getElementById("myCanvas");
  var div = document.getElementById("canvasDiv");
  ctx = canvas.getContext("2d");
  canvWidth = div.clientWidth-15;
  canvas.width = canvWidth;
  canvHeight = div.clientHeight;
  canvas.height = canvHeight;
  console.log(canvHeight);
  drawGrid();
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
  vertLines = [];
  horiLines = [];
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
  for(var x = 0; x < nonoWidth; x++){
    var input = document.getElementById("vert"+x).value;
    try{
      vertLines.push(new Line(sanitizeInput(input)));
    }catch (err){
      errors.innerHTML = err;
      return;
    }
  }
  for(var y = 0; y < nonoHeight; y++){
    var input = document.getElementById("hori"+y).value;
    try{
      horiLines.push(new Line(sanitizeInput(input)));
    }catch (err){
      errors.innerHTML = err;
      return;
    }
  }
  for(var x in vertLines){
    initialTestVertical(x);
    drawGrid();
  }
  for(var y in horiLines){
    initialTestHorizontal(y);
    drawGrid();
  }
  while(canTestVertical + canTestHorizontal > 0){
  
  }
  if(isSolved()){
    errors.innerHTML = "Solved!"
  } else {
    errors.innerHTML = "Could not solve"
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

function markVertical(x, y, token){
  grid[x][y] = token;
  horiLines[y].newInfo = true;
}

function markHorizontal(x, y, token){
  grid[x][y] = token;
  vertLines[x].newInfo = true;
}

function canTestHorizontal(){
  var result = 0;
  for(var x in horiLines){
    if(horiLines[x].newInfo){
      result++;
    }
  }
  return result;
}

function canTestVertical(){
  var result = 0;
  for(var y in vertLines){
    if(vertLines[y].newInfo){
      result++;
    }
  }
  return result;
}

function isSolved(){
  for(var y in vertLines){
    if(!vertLines[y].solved){
      return false;
    }
  }
  for(var x in horiLines){
    if(!horiLines[x].solved){
      return false;
    }
  }
  return true;
}

function sumWithGaps(numList){
  if(numList.length == 0){
    return 0;
  } else {
    var result = 0;
    for(var i in numList){
      result += numList[i];
    }
    return result + numList.length - 1;
  }
}

function maxValue(numList){
  var result = -Infinity
  for(var i in numList){
    if(numList[i] > result){
      result = numList[i];
    }
  }
  return result;
}

function initialTestVertical(x){
  if(arrayEquals(vertLines[x].numbers, [0])){
    for(var y = 0; y < nonoHeight; y++){
      markVertical(x, y, TOKENS.EMPTY);
      vertLines[x].solved = true;
    } 
  }
  else {
    var max = maxValue(vertLines[x].numbers);
    var size = sumWithGaps(vertLines[x].numbers);
    if(size == nonoHeight){
      var y = 0;
      for(var i in vertLines[x].numbers){
        for(var j = 0; j < vertLines[x].numbers[i]; j++){
          markVertical(x, y, TOKENS.FILLED);
          y++;
        }
        if(y < nonoHeight){
          markVertical(x, y, TOKENS.EMPTY);
          y++;
        }
      }
      vertLines[x].solved = true;
    }
    else if(nonoHeight - size < max){
    
    }
  }
}

function initialTestHorizontal(y){

}

function arrayEquals(a, b){
  if(a===b) return true;
  if(a == null || b == null) return false;
  if(a.length != b.length) return false;
  for(var i = 0; i<a.length; i++){
    if(a[i]!==b[i]) return false;
  }
  return true;
}