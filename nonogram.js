// HTML5 canvas context and size;
var canvas;
var ctx;
var div;
var canvWidth;
var canvHeight;

// nonogram grid
var grid;
var nonoWidth;
var nonoHeight;
var vertLines;
var horiLines;

var errors;

// A rule for a line specifying the groups of squares to fill in
class Line {
  constructor (numbers){
    this.numbers = numbers;
    // Is this line solved on the grid?
    this.solved = false;
    // Has something changed on the grid with this line?
    this.newInfo = false;
  }
}

var COLORS = {
  BG : "#dedbff",
  UNKNOWN : "#6b6d94",
  EMPTY : "#ffffff",
  FILLED : "#212494",
}

var TOKENS = {
  UNKNOWN : { value: 1, color: COLORS.UNKNOWN },
  EMPTY : { value: 2, color: COLORS.EMPTY },
  FILLED : { value: 3, color: COLORS.FILLED },
}

window.onload = getElements;

function getElements(){
  errors = document.getElementById("errors");
  canvas = document.getElementById("myCanvas");
  div = document.getElementById("canvasDiv");
  ctx = canvas.getContext("2d");
  resizeCanvas();
  resetGrid();
}

window.onresize = resizeCanvas;

function resizeCanvas(){
  canvWidth = div.clientWidth-15;
  canvas.width = canvWidth;
  canvHeight = div.clientHeight;
  canvas.height = canvHeight;
  drawGrid();
}

function resetGrid(){
  nonoWidth = document.getElementById("nonoWidth").value;
  nonoHeight = document.getElementById("nonoHeight").value;
  var horizontal = document.getElementById("horizontal");
  var vertical = document.getElementById("vertical");
  horizontal.innerHTML = "Horizontal:<br> "
  vertical.innerHTML = "Vertical:<br> ";
  grid = []
  for(var y  = 0; y < nonoHeight; y++){
    horizontal.innerHTML += '<input' +
      ' id="hori' + y + '"' +
      ' class="hori"' +
      ' type="text"' +
      ' name="words"' +
      ' value="0"' +
      ' pattern="([0-9]| )*"' +
      '>';
  }
  for(var x = 0; x < nonoWidth; x++){
    vertical.innerHTML += '<input' +
      ' id="vert' + x + '"' +
      ' class="vert"' +
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
  for(var x in grid){
    for(var y in grid[x]){
      grid[x][y] = TOKENS.UNKNOWN;
    }
  }
  vertLines = [];
  horiLines = [];
  try{
    for(var x = 0; x < nonoWidth; x++){
      var input = document.getElementById("vert"+x).value;
      vertLines.push(new Line(sanitizeInput(input)));
    }
    for(var y = 0; y < nonoHeight; y++){
      var input = document.getElementById("hori"+y).value;
      horiLines.push(new Line(sanitizeInput(input)));
    }
    for(var x in vertLines){
      vertLines[x].solved = 
        placeSquaresVertical(x, 0, nonoHeight, vertLines[x].numbers);
      drawGrid();
    }
    for(var y in horiLines){
      horiLines[y].solved = 
        placeSquaresHorizontal(0, nonoWidth, y, horiLines[y].numbers);
      drawGrid();
    }
    /*while(canTestVertical + canTestHorizontal > 0){
    
    }*/
    if(isSolved()){
      errors.innerHTML = "Solved!"
    } else {
      errors.innerHTML = "Could not solve"
    }
  } catch (err) {
    errors.innerHTML = err;
  }
}

function sanitizeInput(input){
  var result = [];
  var temp = input.split(" ");
  for(var i in temp){
    if(temp[i] != ""){
      // convert to number
      var num = temp[i]*1;
      if(num != num){
        // only NaN does not equal itself
        throw "Input contains non-numbers"
      } else if (num == 0){
        if(temp.length > 1) throw "Contains zero length chains";
        // else do nothing;
      } else {
        result.push(num);
      }
    }
  }
  return result;
}

function markVertical(x, y, token){
  if(grid[x][y] == TOKENS.UNKNOWN){
    grid[x][y] = token;
    horiLines[y].newInfo = true;
  } else if (grid[x][y] != token){
    throw "Contradiction reached."
  }
}

function markHorizontal(x, y, token){
  if(grid[x][y] == TOKENS.UNKNOWN){
    grid[x][y] = token;
    vertLines[y].newInfo = true;
  } else if (grid[x][y] != token){
    throw "Contradiction reached."
  }
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

// places a string of squares if can, and returns true if squares were placed in
// every spot
function placeSquaresVertical(x, y1, y2, numList){
  if(numList.length == 0){
    for(var yi = y1; yi<y2; yi++){
      markVertical(x, yi, TOKENS.EMPTY);
    }
    return true;
  } else {
    var max = maxValue(numList);
    var size = sumWithGaps(numList);
    var dif = (y2-y1) - size;
    var yi = y1;
    for(var i in numList){
      for(var j = 0; j < numList[i]; j++){
        if(j >= dif){
          markVertical(x, yi, TOKENS.FILLED);
        }
        yi++;
      }
      if(yi < y2 && dif == 0){
        markVertical(x, yi, TOKENS.EMPTY);
      }
      yi++;
    }
    return dif == 0;
  }
}

function placeSquaresHorizontal(x1, x2, y, numList){
  if(numList.length == 0){
    for(var xi = x1; xi<x2; xi++){
      markHorizontal(xi, y, TOKENS.EMPTY);
    }
    return true;
  } else {
    var max = maxValue(numList);
    var size = sumWithGaps(numList);
    var dif = (x2-x1) - size;
    var xi = x1;
    for(var i in numList){
      for(var j = 0; j < numList[i]; j++){
        if(j >= dif){
          markHorizontal(xi, y, TOKENS.FILLED);
        }
        xi++;
      }
      if(xi < x2 && dif == 0){
        markHorizontal(xi, y, TOKENS.EMPTY);
      }
      xi++;
    }
    return dif == 0;
  }
}