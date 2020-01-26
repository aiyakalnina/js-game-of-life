let canvas;
let ctx;
let cells = [];
let currentCellStates = [];
const cellSize = 20;
const circleRadius = 8;
let colCount;
let rowCount;
let xClickPosition;
let yClickPosition;
let isSelectingOnDrag = false;
const toolbarHeight = 70;
let stepsAnimation;

function resizeCanvas() {
  canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - toolbarHeight;
  colCount = window.innerWidth / cellSize;
  rowCount = (window.innerHeight - toolbarHeight) / cellSize;
}

function createCells(ctx) {
  for (var i = 0; i < rowCount + 1; i++) {
    for (var j = 0; j < colCount + 1; j++) {
      cells.push({
        isLive: false,
        neighbourCount: 0,
        x: j * cellSize,
        y: i * cellSize,
        radius: circleRadius,

        // draw: function () {
        //   ctx.beginPath();
        //   ctx.fillRect(this.x + 1, this.y + 1, cellSize - 1, cellSize - 1);

        //   ctx.fill();

        //   if (this.isLive) {
        //     ctx.fillStyle = '#2EC0F9';
        //   }
        //   else {
        //     ctx.fillStyle = '#ffffff';
        //   }
        // }

        draw: function () {
          ctx.strokeStyle = '#2EC0F9';
          ctx.fillStyle = '#2EC0F9';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);

          if (this.isLive) {
            ctx.fill();
          }
          else {
            ctx.stroke();
          }
        }
      });
    }
  }
}

function createCurrentCellStates() {
  for (var i = 0; i < rowCount + 1; i++) {
    for (var j = 0; j < colCount + 1; j++) {
      currentCellStates.push({
        isLive: false,
        neighbourCount: 0,
        x: j * cellSize,
        y: i * cellSize,
      });
    }
  }
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = 0; i < cells.length; i++) {
    cells[i].draw();
  }
}

function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  createCells(ctx);
  createCurrentCellStates();
  render();
}

function getCoordinates() {
  xClickPosition = event.clientX;
  yClickPosition = event.clientY;
}

function findClickedCell() {
  for (let i = 0; i < cells.length; i++) {
    let xCircleStartPosition = cells[i].x - circleRadius;
    let xCircleEndPosition = cells[i].x + circleRadius;
    let yCircleStartPosition = cells[i].y - circleRadius;
    let yCircleEndPosition = cells[i].y + circleRadius;

    let xMatches = (xClickPosition >= xCircleStartPosition) && (xClickPosition < xCircleEndPosition);
    let yMatches = (yClickPosition >= yCircleStartPosition) && (yClickPosition < yCircleEndPosition);

    if (xMatches && yMatches) {
      return i;
    }
  }

}

// this just selects cell, doesn't toggle for now
function toggleCell(findClickedCell) {
  let selectedCellId = findClickedCell();

  if (selectedCellId) {
    currentCellStates[selectedCellId].isLive = true;
    cells[selectedCellId].isLive = true;
  }

  // toggle - works weirdly in conjunction with drag select
  // if (selectedCellId) {
  //   if (currentCellStates[selectedCellId].isLive) {
  //     currentCellStates[selectedCellId].isLive = false;
  //     cells[selectedCellId].isLive = false;
  //   } else {
  //     currentCellStates[selectedCellId].isLive = true;
  //     cells[selectedCellId].isLive = true;
  //   }
  // }
}

function setCellState() {
  currentCellStates.forEach((currentCellId, index) => {
    if (currentCellId.isLive) {
      cells[index].isLive = true;
    }
  });
}

function handleClick() {
  document.addEventListener('click', function (event) {
    getCoordinates();
    toggleCell(findClickedCell);
    setCellState();
    render();
  });
}

function handleMouseDrag() {
  let currentSelectedCell = findClickedCell();

  window.addEventListener('mousedown', e => {
    xClickPosition = e.clientX;
    yClickPosition = e.clientY;
    isSelectingOnDrag = true;
  });

  window.addEventListener('mousemove', e => {
    if (isSelectingOnDrag === true) {
      let newSelectedCell = findClickedCell();

      xClickPosition = e.clientX;
      yClickPosition = e.clientY;

      if (newSelectedCell !== currentSelectedCell) {
        currentCellStates[newSelectedCell].isLive = true;
        cells[newSelectedCell].isLive = true;

        setCellState();
        render();
      }

    }
  });

  window.addEventListener('mouseup', e => {
    if (isSelectingOnDrag === true) {
      xClickPosition = 0;
      yClickPosition = 0;
      isSelectingOnDrag = false;
    }
  });

}

function handleNextStep() {
  currentCellStates.forEach((currentCell, index) => {

    currentCell.neighbourCount = countLiveNeighbours(currentCell);

    if (currentCell.isLive) {
      if (currentCell.neighbourCount < 2 || currentCell.neighbourCount > 3) {
        cells[index].isLive = false;
      }
    }

    if (!currentCell.isLive && (currentCell.neighbourCount === 3)) {
      cells[index].isLive = true;
    }
  });

  render();
  resetCurrentCellStates();
}

function onNextStep() {
  const nextStepButton = document.getElementById('nextBtn');

  nextStepButton.addEventListener('click', event => {
    handleNextStep();
  });

  document.addEventListener('keydown', event => {
    if (event.keyCode === 39) {
      handleNextStep();
    }
  });
}

function onAutoPlay() {
  const autoplayButton = document.getElementById('autoplayBtn');
  let autoplayStart = null;

  function step(timestamp) {
    if (!autoplayStart) {
      autoplayStart = timestamp
    }
    let progress = timestamp - autoplayStart;
    handleNextStep();

    stepsAnimation = window.requestAnimationFrame(step);
    if (progress < 60000) {
      stepsAnimation;
    }
  }

  autoplayButton.addEventListener('click', event => {
    window.requestAnimationFrame(step);
  });
}

function onClear() {
  const clearButton = document.getElementById('clearBtn');

  clearButton.addEventListener('click', event => {
    reset();
  });
}

function resetCurrentCellStates() {
  cells.forEach((cell, index) => {
    currentCellStates[index].isLive = cell.isLive;
  });
}

function countLiveNeighbours(thisCell) {
  let neighbourCount = 0;

  // neighbours starting from top left corner clockwise
  let a = currentCellStates.find(cell => (cell.x === thisCell.x - cellSize && cell.y === thisCell.y - cellSize));
  let b = currentCellStates.find(cell => (cell.x === thisCell.x && cell.y === thisCell.y - cellSize));
  let c = currentCellStates.find(cell => (cell.x === thisCell.x + cellSize && cell.y === thisCell.y - cellSize));
  let d = currentCellStates.find(cell => (cell.x === thisCell.x + cellSize && cell.y === thisCell.y));
  let e = currentCellStates.find(cell => (cell.x === thisCell.x + cellSize && cell.y === thisCell.y + cellSize));
  let f = currentCellStates.find(cell => (cell.x === thisCell.x && cell.y === thisCell.y + cellSize));
  let g = currentCellStates.find(cell => (cell.x === thisCell.x - cellSize && cell.y === thisCell.y + cellSize));
  let h = currentCellStates.find(cell => (cell.x === thisCell.x - cellSize && cell.y === thisCell.y));

  let allNeighbours = [a, b, c, d, e, f, g, h];

  allNeighbours.forEach(neighbour => {
    if (neighbour !== undefined && neighbour.isLive) {
      neighbourCount++;
    };
  });

  return neighbourCount;
}

function reset() {
  cells = [];
  currentCellStates = [];
  window.cancelAnimationFrame(stepsAnimation);
  resizeCanvas();
  init();
}


document.addEventListener('DOMContentLoaded', (e) => {
  resizeCanvas();
  init();
  handleClick();
  handleMouseDrag();
  onNextStep();
  onAutoPlay();
  onClear();
});

// this doesn't work properly yet
// window.addEventListener('resize', (e) => {
//   cells = [];
//   currentCellStates = [];
//   resizeCanvas();
//   init();
// });

