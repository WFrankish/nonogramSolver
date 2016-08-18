// DOM stuff;
var canvas;
var ctx;
var div;
var canvWidth;
var canvHeight;
var errors;

// nonogram grid
var grid;
var nonoWidth;
var nonoHeight;
var vertLines;
var horiLines;

var currentTimeout;
var timeoutSpeed;

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

var ORIENTATION = {
  HORIZONTAL : 0,
  VERTICAL : 1,
}

// A rule for a line specifying the groups of squares to fill in
class Line {
  constructor(constraints, orientation){
    this.constraints = constraints;
    // Has something changed on the grid with this line?
    this.newInfo = false;
    // Orientation
    this.orientation = orientation;
    // Sequences
    this.sequences = new SequenceList(constraints, orientation);
  }
  solved(){
    return this.sequences.solved;
  }
}

class Sequence {
  constructor(type, start, end, lowest, highest){
    this.type = type;
    this.start = start;
    this.end = end;
    this.lowestIndex = lowest;
    this.hightestIndex = highest;
  }
}

class SequenceList {
  constructor(constraints, orientation){
    this.list = [];
    if(orientation == ORIENTATION.VERTICAL){
      this.list.push(new Sequence(
        TOKENS.UNKNOWN, 
        0, nonoHeight, 
        -0.5, constraints.length-0.5));
    } else {
      this.list.push(new Sequence(
        TOKENS.UNKNOWN, 
        0, nonoWidth, 
        -0.5, constraints.length-0.5));
    }
  }
  solved(){
    return this.list.length == 0;
  }
  start(){
    return this.list[0].start;
  }
  end(){
    return this.list[this.list.length-1].end;
  }
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
  clearTimeout(currentTimeout);
  nonoWidth = document.getElementById("nonoWidth").value;
  nonoHeight = document.getElementById("nonoHeight").value;
  var horizontal = document.getElementById("horizontal");
  var vertical = document.getElementById("vertical");
  var horiHTML = "Horizontal:<br> "
  var vertHTML = "Vertical:<br> ";
  grid = []
  for(var y  = 0; y < nonoHeight; y++){
    horiHTML += '<input' +
      ' id="hori' + y + '"' +
      ' class="hori"' +
      ' type="text"' +
      ' name="words"' +
      ' value="0"' +
      ' pattern="([0-9]| )*"' +
      '>';
  }
  for(var x = 0; x < nonoWidth; x++){
    vertHTML += '<input' +
      ' id="vert' + x + '"' +
      ' class="vert"' +
      ' type="text"' +
      ' name="words"' +
      ' value="0"' +
      ' pattern="([0-9]| )*"' +
      '>';
  }
  horizontal.innerHTML = horiHTML;
  vertical.innerHTML = vertHTML;
  grid = [];
  for(var x = 0; x < nonoWidth; x++){
    var column = [];
    for(var y = 0; y < nonoHeight; y++){
      column.push(TOKENS.UNKNOWN);
    }
    grid.push(column);
  }
  drawGrid();
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

function canTest(){
  var result = 0;
  for(var x in horiLines){
    if(horiLines[x].newInfo){
      result++;
    }
  }
  for(var y in vertLines){
    if(vertLines[y].newInfo){
      result++;
    }
  }
  return result;
}

function isSolved(){
  for(var y in vertLines){
    if(!vertLines[y].solved()){
      return false;
    }
  }
  for(var x in horiLines){
    if(!horiLines[x].solved()){
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

function mark(x, y, token, orientation){
  if(grid[x][y] == TOKENS.UNKNOWN){
    grid[x][y] = token;
    if(orientation == ORIENTATION.HORIZONTAL){
      horiLines[y].newInfo = true;
    } else {
      vertLines[x].newInfo = true;
    }
  } else if (grid[x][y] != token){
    throw "contradiction"
  }
}

// places a string of squares if can, and returns true if squares were placed in
// every spot
function placeSquares(a, b, c, numList){
  if(numList.orientation = ORIENTATION.VERTICAL){
    var x = a;
    var y1 = b;
    var y2 = c;
    if(numList.length == 0){
      for(var yi = y1; yi<y2; yi++){
        mark(x, yi, TOKENS.EMPTY, ORIENTATION.VERTICAL);
      }
    } else {
      var max = maxValue(numList);
      var size = sumWithGaps(numList);
      var dif = (y2-y1) - size;
      if(dif < 0){
        throw "overflow"
      } else {
        var yi = y1;
        for(var i in numList){
          for(var j = 0; j < numList[i]; j++){
            if(j >= dif){
              mark(x, yi, TOKENS.FILLED, ORIENTATION.VERTICAL);
            }
            yi++;
          }
          if(yi < y2 && dif == 0){
            mark(x, yi, TOKENS.EMPTY, ORIENTATION.VERTICAL);
          }
          yi++;
        }
      }
    }
  } else {
    var x1 = a;
    var x2 = b;
    var y = c;
    if(numList.length == 0){
      for(var xi = x1; xi<x2; xi++){
        mark(xi, y, TOKENS.EMPTY, ORIENTATION.HORIZONTAL);
      }
    } else {
      var max = maxValue(numList);
      var size = sumWithGaps(numList);
      var dif = (x2-x1) - size;
      if(dif < 0){
        throw "overflow";
      } else {
        var xi = x1;
        for(var i in numList){
          for(var j = 0; j < numList[i]; j++){
            if(j >= dif){
              mark(xi, y, TOKENS.FILLED, ORIENTATION.HORIZONTAL);
            }
            xi++;
          }
          if(xi < x2 && dif == 0){
            mark(xi, y, TOKENS.EMPTY, ORIENTATION.HORIZONTAL);
          }
          xi++;
        }
      }
    }
  }
}

function solve(){
  clearTimeout(currentTimeout);
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
      placeSquares(x, 0, nonoHeight, vertLines[x].constraints);
      drawGrid();
    }
    for(var y in horiLines){
      placeSquares(0, nonoWidth, y, horiLines[y].constraints);
      drawGrid();
    }
    while(canTest() > 0){
      for(var x in vertLines){
        if(vertLines[x].newInfo){
          throw "Function not yet programmed";
          vertLines[x].newInfo = false;
        }
      }
      for(var y in horiLines){
        if(horiLines[y].newInfo){
          throw "Function not yet programmed";
          horiLines[y].newInfo = false;
        }
      }
    }
    if(isSolved()){
      errors.innerHTML = "Solved!"
    } else {
      throw "no info";
    }
  } catch (err) {
    if(err == "no info"){
      errors.innerHTML = "No more information available, could not solve."
    } else if(err == "contradiction"){
      errors.innerHTML = "Constraints given are contradictory."
    } else if(err == "overflow"){
      errors.innerHTML = "Constraints given do not fit within grid specified."
    } else {
      errors.innerHTML = err;
    }
  }
}