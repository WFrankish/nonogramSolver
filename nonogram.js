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

// classes moved to bottom due to size on internal functions

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
  nonoWidth = document.getElementById("nonoWidth").value * 1;
  nonoHeight = document.getElementById("nonoHeight").value * 1;
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
  horiBorder = 
    Math.trunc( ( canvWidth - ((blockWidth + 1) * nonoWidth - 1) ) / 2 );
  vertBorder = 
    Math.trunc( ( canvHeight - ((blockHeight + 1) * nonoHeight - 1) ) / 2 );
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
        if(temp.length > 1) throw "zero";
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
    if(!vertLines[y].isSolved()){
      return false;
    }
  }
  for(var x in horiLines){
    if(!horiLines[x].isSolved()){
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

function placeSquare(x, y, token, orientation, index){
  if(grid[x][y] == TOKENS.UNKNOWN){
    grid[x][y] = token;
    if(orientation == ORIENTATION.VERTICAL){
      vertLines[x].add(y, token, index);
      // likely to call mark several times on same x, so don't simplify
      horiLines[y].addBlind(x, token);
      horiLines[y].simplify();
      horiLines[y].newInfo = true;
      
    } else {
      horiLines[y].add(x, token, index);
      // likely to call mark several times on same y, so don't simplify
      vertLines[x].addBlind(y, token);
      horiLines[y].simplify();
      vertLines[x].newInfo = true;
    }
  } else if (grid[x][y] != token){
    throw "contradiction"
  }
}

// places a string of squares if can, and returns true if squares were placed in
// every spot
function placeSquares(a, b, c, line, minIndex = 0, maxIndex = Infinity){
  var numList = line.constraints.slice(minIndex, maxIndex);
  if(line.orientation == ORIENTATION.VERTICAL){
    var x = a;
    var y1 = b;
    var y2 = c;
    if(numList.length == 0){
      for(var yi = y1; yi<y2; yi++){
        placeSquare(x, yi, TOKENS.EMPTY, ORIENTATION.VERTICAL, -0.5);
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
              placeSquare(x, yi, TOKENS.FILLED, ORIENTATION.VERTICAL, i*1);
            }
            yi++;
          }
          if(yi < y2 && dif == 0){
            placeSquare(x, yi, TOKENS.EMPTY, ORIENTATION.VERTICAL, (i*1)+0.5);
          }
          yi++;
        }
      }
    }
    vertLines[x].simplify();
  } else {
    var x1 = a;
    var x2 = b;
    var y = c;
    if(numList.length == 0){
      for(var xi = x1; xi<x2; xi++){
        placeSquare(xi, y, TOKENS.EMPTY, ORIENTATION.HORIZONTAL, -0.5);
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
              placeSquare(xi, y, TOKENS.FILLED, ORIENTATION.HORIZONTAL, i*1);
            }
            xi++;
          }
          if(xi < x2 && dif == 0){
            placeSquare(xi, y, TOKENS.EMPTY, ORIENTATION.HORIZONTAL, (i*1)+0.5);
          }
          xi++;
        }
      }
    }
    horiLines[y].simplify();
  }
}

// A rule for a line specifying the groups of squares to fill in
class Line {
  constructor(constraints, orientation){
    this.constraints = constraints;
    // Has something changed on the grid with this line?
    this.newInfo = false;
    // Orientation
    this.orientation = orientation;
    // Chains
    this.chains = [];
    if(orientation == ORIENTATION.VERTICAL){
      this.chains.push(new Chain(
        TOKENS.UNKNOWN, 
        0, nonoHeight, 
        -0.5, constraints.length-0.5));
    } else {
      this.chains.push(new Chain(
        TOKENS.UNKNOWN, 
        0, nonoWidth, 
        -0.5, constraints.length-0.5));
    }
  }
  isSolved(){
    return this.chains.length == 0;
  }
  start(){
    return this.chains[0].start;
  }
  end(){
    return this.chains[this.chains.length-1].end;
  }
  check(){
    for(var i in this.chains){
      if(this.chains[i].lowestIndex > this.chains[i].highestIndex){
        throw "contradiction";
      }
    }
  }
  simplify(){
    while(this.chains.length > 0 && this.chains[0].type == TOKENS.EMPTY){
      this.chains.shift();
    }
    while(this.chains.length > 0 && this.chains[this.chains.length-1] == TOKENS.EMPTY){
      this.chains.pop();
    }
    var i = 1;
    var prev = this.chains[0];
    while(i < this.chains.length){
      var cur = this.chains[i];
      if(cur.type == prev.type){
        this.chains.splice(i, 1);
        prev.end = cur.end;
        prev.lowestIndex = cur.lowestIndex;
      } else if(prev.type == TOKENS.UNKNOWN && 
        cur.highestIndex < prev.highestIndex
      ) {
        prev.highestIndex = cur.HighestIndex;
      } else if(cur.type == TOKENS.UNKNOWN && 
        cur.lowestIndex < prev.lowestIndex
      ) {
        cur.lowestIndex = prev.lowestIndex;     
      } else {
        // types differ but neither are unknown;
        if(cur.highestIndex < prev.highestIndex){
          prev.highestIndex = cur.HighestIndex - 0.5;
        }
        if(cur.lowestIndex < prev.lowestIndex){
          cur.lowestIndex = prev.lowestIndex + 0.5;
        }
      }
      prev = cur;
      i++;
    }
    this.check();
  }
  addBlind(xy, token){
    var i = 0;
    while(this.chains[i].end < xy+1){
      i++;
    }
    var newLow;
    var newHigh;
    if(token == TOKENS.FILLED){
      newLow = Math.ceil(this.chains[i].lowestIndex);
      newHigh = Math.floor(this.chains[i].highestIndex);
    } else {
      newLow = Math.ceil(this.chains[i].lowestIndex-0.5)+0.5;
      newHigh = Math.floor(this.chains[i].highestIndex+0.5)-0.5;
    }
    if(this.chains[i].end == xy+1){
      this.chains[i].end = xy;
      this.chains[i].highestIndex = newHigh;
      if(this.chains[i].start == this.chains[i].end){
        this.chains[i] = new Chain(token, xy, xy+1, newLow, newHigh);
      } else {
        this.chains.splice(i+1, 0, new Chain(token, xy, xy+1, newLow, newHigh));
      }
    } else {
      var oldEnd = this.chains[i].end;
      var oldHigh = this.chains[i].highestIndex;
      this.chains[i].end = xy;
      this.chains[i].highestIndex = newHigh;
      if(this.chains[i].start == this.chains[i].end){
        this.chains.splice(i, 1, 
          new Chain(token, xy, xy+1, newLow, newHigh),
          new Chain(this.chains[i].token, xy+1, oldEnd, newLow, oldHigh)
        );
      } else {
        this.chains.splice(i+1, 0, 
          new Chain(token, xy, xy+1, newLow, newHigh),
          new Chain(this.chains[i].token, xy+1, oldEnd, newLow, oldHigh)
        );
      }
    }
  }
  add(xy, token, index){
    var i = 0;
    while(this.chains[i].end < xy+1){
      i++;
    }
    if(this.chains[i].end == xy+1){
      this.chains[i].end--;
      this.chains[i].highestIndex = index;
      if(this.chains[i].start == this.chains[i].end){
        this.chains[i] = new Chain(token, xy, xy+1, index, index);
      } else {
        this.chains.splice(i+1, 0, new Chain(token, xy, xy+1, index, index));
      }
    } else {
      var oldEnd = this.chains[i].end;
      var oldHigh = this.chains[i].highestIndex;
      this.chains[i].end = xy;
      this.chains[i].highestIndex = index;
      if(this.chains[i].start == this.chains[i].end){
        this.chains.splice(i, 1, 
          new Chain(token, xy, xy+1, index, index),
          new Chain(this.chains[i].token, xy+1, oldEnd, index, oldHigh)
        );
      } else {
        this.chains.splice(i+1, 0, 
          new Chain(token, xy, xy+1, index, index),
          new Chain(this.chains[i].token, xy+1, oldEnd, index, oldHigh)
        );
      }
    }
  }
}

class Chain {
  constructor(type, start, end, lowest, highest){
    this.type = type;
    this.start = start;
    this.end = end;
    this.lowestIndex = lowest;
    this.highestIndex = highest;
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
      vertLines.push(new Line(sanitizeInput(input), ORIENTATION.VERTICAL));
    }
    for(var y = 0; y < nonoHeight; y++){
      var input = document.getElementById("hori"+y).value;
      horiLines.push(new Line(sanitizeInput(input), ORIENTATION.HORIZONTAL));
    }
    for(var x in vertLines){
      placeSquares(x*1, 0, nonoHeight, vertLines[x]);
      drawGrid();
    }
    for(var y in horiLines){
      placeSquares(0, nonoWidth, y*1, horiLines[y]);
      drawGrid();
    }
    while(!isSolved() && canTest() > 0){
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
    } else if(err == "zero"){
      errors.innerHTML = "Input contains zero length chains."
    } else {
      errors.innerHTML = err;
    }
  }
}