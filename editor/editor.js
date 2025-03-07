var editor = {
  mousePos: [0, 0],
  editMode: false,
  buildSelect: new Block(0, 0, 0, 50),
  selectStart: [0, 0],
  moveStart: [0, 0],
  moveSelect: [0, 0],
  editSelect: [],
  clipboard: [],
  selectBox: {
    x: Infinity,
    y: Infinity,
    maxx: -Infinity,
    maxy: -Infinity,
    width: 0,
    height: 0,
    maxs: -Infinity,
    mins: Infinity
  },
  gridSize: 50,
  gridSnap: [false, false, false],
  snapOverride: false,
  snapRadius: 12.5,
  expandAmt: 1,
  invertExpand: false,
  actionList: [],
  currentAction: -1,
  actionLimit: 25,
  totalScale: 1,
  scaleStart: false,
  editBlock: undefined,
  editBlockProp: [],
  saveOrder:
    JSON.parse(localStorage.getItem("just-an-editor-save-2"))?.[1] ?? [],
  saves: JSON.parse(localStorage.getItem("just-an-editor-save-2"))?.[0] ?? {},
  currentSave: undefined,
  autoSave: true,
  showTooltips: true,
  godMode: false,
  showMenus: true
};
const propData = {
  // general
  type: ["blockType", "t"],
  x: ["num", "x", () => 0, (block) => level.length * maxBlockSize - block.size],
  y: [
    "num",
    "y",
    () => 0,
    (block) => level[0].length * maxBlockSize - block.size
  ],
  size: ["num", "s", () => 6.25, () => 50],
  giveJump: ["bool", "j"],
  eventPriority: ["int", "ep", () => 0, () => Infinity],
  strictPriority: ["bool", "sp"],
  invisible: ["bool", "v"],
  dynamic: ["bool", "d"],
  pushable: ["bool", "u"],
  interactive: ["bool", "i"],
  // special
  power: ["num", "p"],
  color: ["color", "c"]
};
const propAliasReverse = {};
const blockList = {
  Special: [2],
  Basic: [0, 1],
  Movement: [3]
};
var level =
  "NrDeCIBcE8AcFNwC4AMAacAPZAmArBtLngL5oQwLLrhFJ4pkVyKqHICMKj5UL17JBwZM+VNrVzdRlVjTr4ezcfOQBmab1kDJSNSK38JdNQHYCWYjKM1s9JWLkY7DQQBZNyp5aGfHOuy5VJEVrFWdOfEEcczDvQO53P20JQIMvAM5zQQ4o8ABnK0Nwn2FgjjMAOgtCoRxquMyhV11cmsiG4vjOFroOXOqMWoHSLqaynMSCjtGM1M4ANnqLPqnh5cb5oWzWtZnN204ADlNB3Zp1zrnDoROzvpGh-bGtidb0-1fe9WSbCObgh4HCkbjhfiU7GDghpgX8fFCkrCIcQkd0Qjs+nlavgDv8cHcVpxHtM6ldPqCCZMLs9rniMZw9qTZuS8Ut7gzqUzcfDvr5OSNuZDef1lk8uS9QcKsTSWTzylV2uLaXKch8QXTCejmeqVboYYKUYiDXpwWiYdE1XC7ObdEDjfpUU0zJqcRL-s7BM77by7W6fEDBJbkUgA+djaG+kG0RGpI6tjGQlGmgn9X67CmRABdNAATlzmaAA";
var blockSelect = new Vue({
  el: "#blockSelect",
  data: {
    blocks: blockList,
    selectType: 0
  }
});
var blockEdit = new Vue({
  el: "#blockEdit",
  data: {
    editor: editor,
    editOrder: [
      "type",
      "x",
      "y",
      "size",
      "giveJump",
      "eventPriority",
      "strictPriority",
      "invisible"
      //"dynamic",
      //"pushable",
      //"interactive"
    ],
    propData: propData,
    inputType: {
      num: "text",
      int: "text",
      bool: "checkbox",
      blockType: "select",
      color: "color"
    },
    blocks: blockList
  }
});
var selectLayer = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  view: id("selectLayer"),
  transparent: true,
  resizeTo: window
});
var gridDisp = new PIXI.Graphics();
gridDisp.visible = false;
selectLayer.stage.addChild(gridDisp);
var buildDisp = new PIXI.Graphics();
selectLayer.stage.addChild(buildDisp);
if (isMobile) buildDisp.visible = false;
var selectDisp = new PIXI.Graphics();
selectDisp.visible = false;
selectLayer.stage.addChild(selectDisp);
var selectBox = new PIXI.Graphics();
selectBox.visible = false;
selectLayer.stage.addChild(selectBox);
var editOptions = new Vue({
  el: "#editOptions",
  data: {
    grid: gridDisp,
    editor: editor
  }
});
var saveMenu = new Vue({
  el: "#saveMenu",
  data: {
    editor: editor
  }
});
var editing = false;
document.addEventListener("keydown", function (event) {
  event.preventDefault();
  let key = event.code;
  switch (key) {
    case "KeyE":
      editor.editMode = !editor.editMode;
      buildDisp.visible = !editor.editMode;
      selectDisp.visible = editor.editMode;
      break;
    case "Backspace":
      if (editor.editMode) {
        addAction("removeBlock", deepCopy(editor.editSelect));
        for (let i in editor.editSelect) {
          removeBlock(editor.editSelect[i]);
        }
        deselect();
      }
      break;
    case "KeyZ":
      if (event.ctrlKey || event.metaKey) {
        if (event.shiftKey) {
          redo();
        } else undo();
      }
      break;
    case "KeyX":
      if (event.ctrlKey || event.metaKey) {
        copy();
        addAction("removeBlock", deepCopy(editor.editSelect));
        for (let i in editor.editSelect) {
          removeBlock(editor.editSelect[i]);
        }
        deselect();
      }
      break;
    case "KeyC":
      if (event.ctrlKey || event.metaKey) {
        copy();
      }
      break;
    case "KeyV":
      if (event.ctrlKey || event.metaKey) {
        paste(editor.mousePos[0] - camx, editor.mousePos[1] - camy);
      }
      break;
    case "KeyG":
      editor.godMode = !editor.godMode;
      break;
    case "KeyM":
      editor.showMenus = !editor.showMenus;
      break;
    default:
  }
});
id("selectLayer").addEventListener("mousedown", function (event) {
  let button = event.button;
  switch (button) {
    case 0: // left
      if (event.ctrlKey || event.metaKey) {
        player.x = event.clientX - camx - player.size / 2;
        player.y = event.clientY - camy - player.size / 2;
      } else {
        if (editor.editMode) {
          editor.selectStart = [event.clientX - camx, event.clientY - camy];
          selectBox.visible = true;
          selectBox.clear();
        } else {
          updateBuildLocation(event.clientX, event.clientY);
          addAction("addBlock", [addBlock(deepCopy(editor.buildSelect))]);
        }
      }
      break;
    case 2: // right
      editor.moveSelect = [0, 0];
      editor.moveStart = [editor.selectBox.x, editor.selectBox.y];
      break;
    case 1: // middle
      event.preventDefault();
      if (!editor.editMode) {
        select(
          {
            x: event.clientX - camx,
            y: event.clientY - camy,
            width: 0,
            height: 0
          },
          true,
          undefined,
          true
        );
        updateBuildDisp();
      }
      break;
    default:
  }
});
document.addEventListener("mousemove", function (event) {
  editor.scaleStart = false;
  editor.mousePos = [event.clientX, event.clientY];
  if (editor.editMode) {
    switch (event.buttons) {
      case 1: {
        let x = Math.min(editor.selectStart[0] + camx, event.clientX);
        let y = Math.min(editor.selectStart[1] + camy, event.clientY);
        let w = Math.abs(editor.selectStart[0] - event.clientX + camx);
        let h = Math.abs(editor.selectStart[1] - event.clientY + camy);
        selectBox.clear();
        selectBox.lineStyle(2, 0x000000, 0.5, 1);
        selectBox.drawRect(x, y, w, h);
        selectBox.lineStyle(2, 0xffffff, 0.5, 0);
        selectBox.drawRect(x, y, w, h);
        break;
      }
      case 2:
        editor.moveSelect[0] += event.movementX;
        editor.moveSelect[1] += event.movementY;
        let newBox = deepCopy(editor.selectBox);
        newBox.x += editor.moveSelect[0];
        newBox.y += editor.moveSelect[1];
        let snapPos = getSnapPos(newBox);
        let dx = snapPos[0] - editor.selectBox.x;
        let dy = snapPos[1] - editor.selectBox.y;
        selectDisp.x += dx;
        selectDisp.y += dy;
        for (let i in editor.editSelect) {
          moveBlock(editor.editSelect[i], dx, dy);
        }
        editor.selectBox.x += dx;
        editor.selectBox.y += dy;
        if (dx !== 0 || dy !== 0) editor.moveSelect = [0, 0];
        updateSelectDisp();
        break;
      default:
    }
  } else {
    updateBuildLocation(event.clientX, event.clientY);
  }
  if (
    event.clientX < 200 &&
    editor.showMenus &&
    controlMethod === "keyboard"
  ) {
    if (id("editOptions").style.right === "100%") {
      id("editOptions").style.right = `calc(100% - 200px)`;
    }
  } else if (controlMethod === "keyboard") {
    id("editOptions").style.right = "100%";
  }
  if (
    event.clientX > window.innerWidth - 200 &&
    editor.showMenus &&
    controlMethod === "keyboard"
  ) {
    if (id("saveMenu").style.left === "100%") {
      id("saveMenu").style.left = `calc(100% - 200px)`;
    }
  } else if (controlMethod === "keyboard") {
    id("saveMenu").style.left = "100%";
  }
  if (
    event.clientY > window.innerHeight - 200 &&
    editor.showMenus &&
    controlMethod === "keyboard"
  ) {
    if (editor.editMode) {
      if (editor.editBlock !== undefined) {
        if (id("blockEdit").style.top === "100%") {
          id("blockEdit").style.top = `calc(100% - 200px)`;
        }
      }
    } else {
      if (id("blockSelect").style.top === "100%") {
        id("blockSelect").style.top = `calc(100% - 200px)`;
      }
    }
  } else if (controlMethod === "keyboard") {
    id("blockSelect").style.top = "100%";
    if (editor.editBlock !== undefined) {
      id("blockEdit").style.top = "100%";
    }
  }
});
id("selectLayer").addEventListener("mouseup", function (event) {
  let button = event.button;
  switch (button) {
    case 0: // left
      if (editor.editMode && !(event.ctrlKey || event.metaKey)) {
        let prev = editor.editSelect[0];
        if (!event.shiftKey) deselect();
        let x = Math.min(editor.selectStart[0], event.clientX - camx);
        let y = Math.min(editor.selectStart[1], event.clientY - camy);
        let w = Math.abs(editor.selectStart[0] - event.clientX + camx);
        let h = Math.abs(editor.selectStart[1] - event.clientY + camy);
        select(
          { x: x, y: y, width: w, height: h },
          w === 0 && h === 0 && !event.shiftKey,
          prev
        );
      }
      selectBox.visible = false;
      break;
    case 2: // right
      if (editor.editMode) {
        addAction(
          "moveBlock",
          [...editor.editSelect],
          editor.selectBox.x - editor.moveStart[0],
          editor.selectBox.y - editor.moveStart[1]
        );
      }
      break;
    case 1: // middle
      break;
    default:
  }
});
id("selectLayer").addEventListener("contextmenu", function (event) {
  event.preventDefault();
});
id("selectLayer").addEventListener("wheel", function (event) {
  event.preventDefault();
  let factor = event.shiftKey ? 2 : 1.1;
  factor **= Math.sign(-event.deltaY);
  if (editor.selectBox.maxs * factor > 50) factor = 50 / editor.selectBox.maxs;
  if (editor.selectBox.mins * factor < 6.25)
    factor = 6.25 / editor.selectBox.mins;
  if (editor.editMode) {
    for (let i in editor.editSelect) {
      if (factor === 1) break;
      scaleBlock(
        editor.editSelect[i],
        factor,
        event.clientX - camx,
        event.clientY - camy
      );
    }
    if (editor.editSelect.length > 0) {
      if (editor.scaleStart) {
        editor.totalScale *= factor;
        editor.actionList[editor.actionList.length - 1][1] = deepCopy(
          editor.editSelect
        );
        editor.actionList[editor.actionList.length - 1][2] = editor.totalScale;
      } else {
        editor.scaleStart = true;
        editor.totalScale = factor;
        addAction(
          "scaleBlock",
          [...editor.editSelect],
          editor.totalScale,
          event.clientX - camx,
          event.clientY - camy
        );
      }
    }
    updateSelectDisp();
  } else {
    scaleBlock(editor.buildSelect, factor, undefined, undefined, false);
    updateBuildDisp();
  }
});
function changeBuildSelect(block) {
  editor.buildSelect = deepCopy(block);
  updateBuildDisp();
}
function updateBuildLocation(x, y) {
  editor.buildSelect.x = Math.min(
    Math.max(x - camx - editor.buildSelect.size / 2, 0),
    level.length * maxBlockSize - editor.buildSelect.size
  );
  editor.buildSelect.y = Math.min(
    Math.max(y - camy - editor.buildSelect.size / 2, 0),
    level[0].length * maxBlockSize - editor.buildSelect.size
  );
  let snapPos = getSnapPos(editor.buildSelect);
  editor.buildSelect.x = snapPos[0];
  editor.buildSelect.y = snapPos[1];
  buildDisp.x = editor.buildSelect.x + camx;
  buildDisp.y = editor.buildSelect.y + camy;
}
function updateBuildDisp() {
  let block = editor.buildSelect;
  block.size = +parseFloat(block.size).toFixed(2);
  if (isNaN(block.size)) block.size = 50;
  block.size = Math.min(Math.max(block.size, 6.25), 50);
  blockSelect.selectType = block.type;
  buildDisp.clear();
  buildDisp.lineStyle(2, 0x000000, 0.5, 1);
  buildDisp.drawRect(0, 0, block.size, block.size);
  buildDisp.lineStyle(2, 0xffffff, 0.5, 0);
  buildDisp.drawRect(0, 0, block.size, block.size);
  editor.buildSelect.x = Math.min(
    Math.max(event.clientX - camx - editor.buildSelect.size / 2, 0),
    level.length * maxBlockSize - editor.buildSelect.size
  );
  editor.buildSelect.y = Math.min(
    Math.max(event.clientY - camy - editor.buildSelect.size / 2, 0),
    level.length * maxBlockSize - editor.buildSelect.size
  );
  buildDisp.x = editor.buildSelect.x + camx;
  buildDisp.y = editor.buildSelect.y + camy;
}
function confirmPropEdit(block) {
  let newBlock = deepCopy(block);
  let editBlock = editor.editBlock;
  for (let i in block) {
    if (editBlock[i] !== "MIXED" && i !== "index") {
      if (parseFloat(editBlock[i]) == editBlock[i]) {
        let limIndex = 2;
        let propLimit = propData[i];
        if (propLimit === undefined) {
          propLimit = blockData[block.type].props[i];
          limIndex = 0;
        }
        let newNum = parseFloat(editBlock[i]);
        if (propData[i][0] === "int") newNum = Math.round(newNum);
        if (propLimit[limIndex] !== undefined) {
          newNum = Math.min(
            Math.max(parseFloat(editBlock[i]), propLimit[limIndex](block)),
            propLimit[limIndex + 1](block)
          );
        }
        if (newNum !== parseFloat(editBlock[i]))
          editBlock[i] = newNum.toString();
        newBlock[i] = newNum;
      } else newBlock[i] = editBlock[i];
    }
  }
  for (let i in blockData[newBlock.type].props) {
    newBlock[i] ??= blockData[newBlock.type].defaultBlock[i];
  }
  removeBlock(block);
  addBlock(newBlock);
  return newBlock;
}
function confirmEditAll() {
  let prevBlocks = deepCopy(editor.editSelect);
  for (let i in editor.editSelect)
    editor.editSelect[i] = confirmPropEdit(editor.editSelect[i]);
  reselect();
  addAction("editProp", prevBlocks, [...editor.editSelect]);
}
function select(selectRect, single = false, prev, build = false) {
  let first;
  let found = prev === undefined;
  let cycled = false;
  for (
    let x = gridUnit(selectRect.x) - 1;
    x <= gridUnit(selectRect.x + selectRect.width);
    x++
  ) {
    for (
      let y = gridUnit(selectRect.y) - 1;
      y <= gridUnit(selectRect.y + selectRect.height);
      y++
    ) {
      let gridSpace = level[x]?.[y];
      if (gridSpace === undefined) continue;
      for (let i in gridSpace) {
        let block = gridSpace[i];
        if (
          isColliding(selectRect, block) &&
          !editor.editSelect.includes(block)
        ) {
          if (single) {
            first ??= block;
            if (prev === block) {
              found = true;
              continue;
            }
            if (!found) continue;
          }
          if (single || editor.editBlock === undefined) {
            editor.editBlock = deepCopy(block);
            editor.editBlockProp = Object.keys(blockData[block.type].props);
          } else {
            for (let i in block) {
              if (editor.editBlock[i] === "MIXED") continue;
              if (editor.editBlock[i] === undefined) {
                editor.editBlock[i] = block[i];
                editor.editBlockProp.push(i);
              }
              if (block[i] != editor.editBlock[i]) {
                editor.editBlock[i] = "MIXED";
              }
            }
          }
          if (single) {
            if (build) {
              changeBuildSelect(block);
            } else editor.editSelect = [block];
            cycled = true;
            break;
          } else editor.editSelect.push(block);
        }
      }
      if (single && cycled) break;
    }
    if (single && cycled) break;
  }
  if (single && !cycled && first !== undefined) {
    editor.editBlock = deepCopy(first);
    editor.editBlockProp = Object.keys(blockData[first.type].props);
    editor.editSelect = [first];
  }
  updateSelectDisp();
}
function deselect() {
  editor.editSelect = [];
  editor.selectBox.x = Infinity;
  editor.selectBox.y = Infinity;
  editor.selectBox.maxx = -Infinity;
  editor.selectBox.maxy = -Infinity;
  editor.selectBox.width = 0;
  editor.selectBox.height = 0;
  selectDisp.clear();
  editor.editBlock = undefined;
  editor.editBlockProp = [];
}
function reselect() {
  for (let j in editor.editSelect) {
    let block = editor.editSelect[j];
    if (j === "0") {
      editor.editBlock = deepCopy(block);
      editor.editBlockProp = Object.keys(blockData[block.type].props);
      continue;
    }
    for (let i in block) {
      if (editor.editBlock[i] === "MIXED") continue;
      if (editor.editBlock[i] === undefined) {
        editor.editBlock[i] = block[i];
        editor.editBlockProp.push(i);
      }
      if (block[i] !== editor.editBlock[i]) {
        editor.editBlock[i] = "MIXED";
      }
    }
  }
  updateSelectDisp();
}
function updateSelectDisp() {
  selectDisp.clear();
  editor.selectBox.maxx = -Infinity;
  editor.selectBox.maxy = -Infinity;
  editor.selectBox.x = Infinity;
  editor.selectBox.y = Infinity;
  editor.selectBox.maxs = -Infinity;
  editor.selectBox.mins = Infinity;
  for (let i in editor.editSelect) {
    let block = editor.editSelect[i];
    selectDisp.lineStyle(2, 0x000000, 0.5, 1);
    selectDisp.drawRect(block.x, block.y, block.size, block.size);
    selectDisp.lineStyle(2, 0xffffff, 0.5, 0);
    selectDisp.drawRect(block.x, block.y, block.size, block.size);
    editor.selectBox.x = Math.min(editor.selectBox.x, block.x);
    editor.selectBox.y = Math.min(editor.selectBox.y, block.y);
    editor.selectBox.maxx = Math.max(
      editor.selectBox.maxx,
      block.x + block.size
    );
    editor.selectBox.maxy = Math.max(
      editor.selectBox.maxy,
      block.y + block.size
    );
    editor.selectBox.maxs = Math.max(editor.selectBox.maxs, block.size);
    editor.selectBox.mins = Math.min(editor.selectBox.mins, block.size);
  }
  editor.selectBox.width = editor.selectBox.maxx - editor.selectBox.x;
  editor.selectBox.height = editor.selectBox.maxy - editor.selectBox.y;
  selectDisp.x = camx;
  selectDisp.y = camy;
}
function copy() {
  if (editor.editSelect.length < 1) return;
  editor.clipboard = deepCopy(editor.editSelect);
  for (let i in editor.clipboard) {
    let block = editor.clipboard[i];
    block.x -= editor.selectBox.x;
    block.y -= editor.selectBox.y;
  }
}
function paste(x, y) {
  let added = [];
  for (let i in editor.clipboard) {
    let block = addBlock(deepCopy(editor.clipboard[i]));
    moveBlock(block, x, y);
    editor.editSelect.push(block);
    added.push(block);
  }
  addAction("addBlock", added);
  updateSelectDisp();
}
function changeGridSize(size) {
  editor.gridSize = size;
  updateGrid();
}
function updateGrid() {
  editor.gridSize = +parseFloat(editor.gridSize).toFixed(2);
  if (isNaN(editor.gridSize)) editor.gridSize = 50;
  editor.gridSize = Math.min(Math.max(editor.gridSize, 6.25), 50);
  gridDisp.clear();
  for (
    let i = 1;
    i <
    Math.min(level.length * maxBlockSize, window.innerWidth) / editor.gridSize;
    i++
  ) {
    gridDisp.lineStyle(2, 0x000000, 0.5, 1);
    gridDisp.moveTo(i * editor.gridSize, 0);
    gridDisp.lineTo(i * editor.gridSize, level[0].length * maxBlockSize);
    gridDisp.lineStyle(2, 0xffffff, 0.5, 0);
    gridDisp.moveTo(i * editor.gridSize, 0);
    gridDisp.lineTo(i * editor.gridSize, level[0].length * maxBlockSize);
  }
  for (
    let i = 1;
    i <
    Math.min(level[0].length * maxBlockSize, window.innerHeight) /
      editor.gridSize;
    i++
  ) {
    gridDisp.lineStyle(2, 0x000000, 0.5, 1);
    gridDisp.moveTo(0, i * editor.gridSize);
    gridDisp.lineTo(level.length * maxBlockSize, i * editor.gridSize);
    gridDisp.lineStyle(2, 0xffffff, 0.5, 0);
    gridDisp.moveTo(0, i * editor.gridSize);
    gridDisp.lineTo(level.length * maxBlockSize, i * editor.gridSize);
  }
}
function getSnapPos(box) {
  let width = box.size;
  if (width === undefined) width = box.width;
  let height = box.size;
  if (height === undefined) height = box.height;
  let normX = Math.min(Math.max(box.x, 0), level.length * maxBlockSize - width);
  let normY = Math.min(
    Math.max(box.y, 0),
    level[0].length * maxBlockSize - height
  );
  let snapX = [];
  let snapY = [];
  let gx1 = normX / editor.gridSize;
  let gx2 = gx1 + width / editor.gridSize;
  let gy1 = normY / editor.gridSize;
  let gy2 = gy1 + height / editor.gridSize;
  let x1 = Math.min(gx1 % 1, 1 - (gx1 % 1));
  let x2 = Math.min(gx2 % 1, 1 - (gx2 % 1));
  let y1 = Math.min(gy1 % 1, 1 - (gy1 % 1));
  let y2 = Math.min(gy2 % 1, 1 - (gy2 % 1));
  if (editor.gridSnap[0]) {
    if (x1 < x2) {
      snapX[0] = Math.round(gx1) * editor.gridSize;
    } else snapX[0] = Math.round(gx2) * editor.gridSize - width;
    if (y1 < y2) {
      snapY[0] = Math.round(gy1) * editor.gridSize;
    } else snapY[0] = Math.round(gy2) * editor.gridSize - height;
  }
  if (editor.gridSnap[1]) {
    let min = Math.min(x1, x2, y1, y2);
    if (min === x1 || min === x2) {
      if (min === x1) {
        snapX[1] = Math.round(gx1) * editor.gridSize;
      } else {
        snapX[1] = Math.round(gx2) * editor.gridSize - width;
      }
      snapY[1] =
        (Math.floor((gy1 + gy2) / 2) + 0.5) * editor.gridSize - height / 2;
    } else {
      if (min === y1) {
        snapY[1] = Math.round(gy1) * editor.gridSize;
      } else {
        snapY[1] = Math.round(gy2) * editor.gridSize - height;
      }
      snapX[1] =
        (Math.floor((gx1 + gx2) / 2) + 0.5) * editor.gridSize - width / 2;
    }
  }
  if (editor.gridSnap[2]) {
    let gx = Math.min(
      Math.max((box.x + width / 2) / editor.gridSize, 0),
      (level.length * maxBlockSize) / editor.gridSize - 0.01
    );
    let gy = Math.min(
      Math.max((box.y + height / 2) / editor.gridSize, 0),
      (level[0].length * maxBlockSize) / editor.gridSize - 0.01
    );
    snapX[2] = (Math.floor(gx) + 0.5) * editor.gridSize - width / 2;
    snapY[2] = (Math.floor(gy) + 0.5) * editor.gridSize - height / 2;
  }
  let newX = normX;
  let newY = normY;
  let minD = Infinity;
  if (!editor.snapOverride) {
    for (let i = 0; i < 3; i++) {
      if (editor.gridSnap[i]) {
        let d = dist(normX, normY, snapX[i], snapY[i]);
        if (d < minD && d < editor.snapRadius) {
          minD = d;
          newX = snapX[i];
          newY = snapY[i];
        }
      }
    }
  }
  return [newX, newY];
}
function changeLevelSize(dir, num, action = true) {
  let prevX = level.length;
  let prevY = level[0].length;
  let removed = [];
  switch (dir) {
    case "left": {
      num = Math.max(num, 1 - prevX);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) =>
          Array(prevY)
            .fill(0)
            .map((x) => Array(0))
        );
      level.splice(0, -num, ...add).map((x) =>
        x.map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
          })
        )
      );
      level.map((x) =>
        x.map((y) =>
          y.map((b) => {
            b.x += maxBlockSize * num;
          })
        )
      );
      saveState.x += maxBlockSize * num;
      player.x += maxBlockSize * num;
      break;
    }
    case "right": {
      num = Math.max(num, 1 - prevX);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) =>
          Array(prevY)
            .fill(0)
            .map((x) => Array(0))
        );
      level.splice(prevX + Math.min(num, 0), -num, ...add).map((x) =>
        x.map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
          })
        )
      );
      break;
    }
    case "up": {
      num = Math.max(num, 1 - prevY);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) => Array(0));
      level.map((x) =>
        x.splice(0, -num, ...deepCopy(add)).map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
          })
        )
      );
      level.map((x) =>
        x.map((y) =>
          y.map((b) => {
            b.y += maxBlockSize * num;
          })
        )
      );
      saveState.y += maxBlockSize * num;
      player.y += maxBlockSize * num;
      break;
    }
    case "down": {
      num = Math.max(num, 1 - prevY);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) => Array(0));
      level.map((x) =>
        x.splice(prevY + Math.min(num, 0), -num, ...deepCopy(add)).map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
          })
        )
      );
      break;
    }
    default:
  }
  if (action) addAction("changeLevelSize", dir, num, deepCopy(removed));
  drawLevel(true);
  adjustLevelSize();
  updateGrid();
}
function addAction(type, ...values) {
  if (editor.currentAction >= editor.actionLimit) {
    editor.actionList.shift();
  } else editor.currentAction++;
  editor.actionList.length = editor.currentAction + 1;
  editor.actionList[editor.currentAction] = [type, ...values];
}
function doAction(action) {
  switch (action[0]) {
    case "addBlock":
      for (let i in action[1]) addBlock(action[1][i]);
      editor.editSelect.push(...action[1]);
      reselect();
      break;
    case "removeBlock":
      for (let i in action[1]) {
        removeBlock(action[1][i]);
        if (editor.editSelect.includes(action[1][i]))
          editor.editSelect.splice(editor.editSelect.indexOf(action[1][i]), 1);
      }
      reselect();
      break;
    case "moveBlock":
      for (let i in action[1]) moveBlock(action[1][i], action[2], action[3]);
      editor.editSelect = action[1];
      updateSelectDisp();
      break;
    case "scaleBlock":
      for (let i in action[1]) {
        let block = action[1][i];
        scaleBlock(block, action[2], action[3], action[4]);
      }
      editor.scaleStart = false;
      editor.editSelect = action[1];
      updateSelectDisp();
      break;
    case "changeLevelSize":
      changeLevelSize(action[1], action[2]);
      break;
    case "editProp":
      for (let i in action[1]) {
        addBlock(action[2][i]);
        removeBlock(action[1][i]);
      }
      editor.editSelect = deepCopy(action[2]);
      updateSelectDisp();
      break;
    default:
  }
}
function undoAction(action) {
  switch (action[0]) {
    case "addBlock":
      for (let i in action[1]) {
        removeBlock(action[1][i]);
        if (editor.editSelect.includes(action[1][i]))
          editor.editSelect.splice(editor.editSelect.indexOf(action[1][i]), 1);
      }
      reselect();
      break;
    case "removeBlock":
      for (let i in action[1]) addBlock(action[1][i]);
      editor.editSelect.push(...action[1]);
      reselect();
      break;
    case "moveBlock":
      for (let i in action[1]) moveBlock(action[1][i], -action[2], -action[3]);
      editor.editSelect = action[1];
      updateSelectDisp();
      break;
    case "scaleBlock":
      for (let i in action[1]) {
        let block = action[1][i];
        scaleBlock(block, 1 / action[2], action[3], action[4]);
      }
      editor.scaleStart = false;
      editor.editSelect = action[1];
      updateSelectDisp();
      break;
    case "changeLevelSize":
      changeLevelSize(action[1], -action[2], false);
      for (let i in action[3]) addBlock(action[3][i]);
      break;
    case "editProp":
      for (let i in action[1]) {
        addBlock(action[1][i]);
        removeBlock(action[2][i]);
      }
      editor.editSelect = deepCopy(action[1]);
      updateSelectDisp();
      break;
    default:
  }
}
function undo() {
  if (editor.currentAction < 0) return;
  undoAction(editor.actionList[editor.currentAction]);
  editor.currentAction--;
}
function redo() {
  if (editor.currentAction >= editor.actionList.length - 1) return;
  editor.currentAction++;
  doAction(editor.actionList[editor.currentAction]);
}
function lvl2str(lvl) {
  let w = lvl.length;
  let h = lvl[0].length;
  lvl = deepCopy(lvl).flat().flat();
  for (let i in lvl) {
    let block = lvl[i];
    for (let prop in block) {
      if (prop === "type") continue;
      if (
        block[prop] === blockData[block.type].defaultBlock[prop] ||
        prop === "index"
      ) {
        delete block[prop];
        continue;
      }
      if (propData[prop][1] !== prop) {
        block[propData[prop][1]] = block[prop];
        delete block[prop];
      }
    }
  }
  let str = JSON.stringify([lvl, w, h]);
  return LZString.compressToEncodedURIComponent(str);
}
function str2lvl(str) {
  let lvlData = JSON.parse(LZString.decompressFromEncodedURIComponent(str));
  let blocks = lvlData[0];
  let w = lvlData[1];
  let h = lvlData[2];
  let lvl = Array(w)
    .fill(0)
    .map((x) =>
      Array(h)
        .fill(0)
        .map((x) => Array(0))
    );
  for (let i in blocks) {
    let block = blocks[i];
    for (let prop in block) {
      if (
        propAliasReverse[prop] !== undefined &&
        propAliasReverse[prop] !== prop
      ) {
        block[propAliasReverse[prop]] = block[prop];
        delete block[prop];
      }
    }
    for (let prop in blockData[block.type].defaultBlock) {
      block[prop] ??= blockData[block.type].defaultBlock[prop];
    }
    lvl[gridUnit(block.x)][gridUnit(block.y)].push(block);
  }
  return lvl;
}
function pState2str(pState) {
  pState = deepCopy(pState);
  for (let prop in pState) {
    if (pState[prop] === defaultPlayer[prop]) delete pState[prop];
  }
  let str = JSON.stringify(pState);
  return LZString.compressToEncodedURIComponent(str);
}
function str2pState(str) {
  let pState = JSON.parse(LZString.decompressFromEncodedURIComponent(str));
  pState = { ...defaultPlayer, ...pState };
  return pState;
}
function storeSave() {
  localStorage.setItem(
    "just-an-editor-save-2",
    JSON.stringify([editor.saves, editor.saveOrder])
  );
}
function addSave() {
  let name = prompt("Please input save name.");
  while (editor.saveOrder.includes(name))
    name = prompt("Name taken. Please input new save name.");
  editor.saveOrder.push(name);
  editor.currentSave = name;
  save();
}
function save() {
  if (editor.currentSave !== undefined)
    editor.saves[editor.currentSave] = [lvl2str(level), pState2str(startState)];
  storeSave();
}
function load(name) {
  let save = editor.saves[name];
  if (save) {
    setLevel(str2lvl(save[0]));
    startState = str2pState(save[1]);
    respawn(true);
    deselect();
    editor.currentSave = name;
  }
}
function exportSave(name) {
  let exportData = [...editor.saves[name], name];
  id("exportArea").value = JSON.stringify(exportData);
  id("exportArea").style.display = "inline";
  id("exportArea").focus();
  id("exportArea").select();
  document.execCommand("copy");
  id("exportArea").style.display = "none";
  alert("Level data copied to clipboard!");
}
function importSave() {
  let exportData = JSON.parse(prompt("Please input export data."));
  if (exportData === null) return;
  let name = exportData.pop();
  while (
    editor.saveOrder.includes(name) &&
    !confirm("Name taken. Replace current?")
  ) {
    name = prompt("Please rename or cancel.");
    if (name === null) return;
  }
  editor.saves[name] = exportData;
  if (!editor.saveOrder.includes(name)) editor.saveOrder.push(name);
  load(name);
  storeSave();
}
function deleteSave(name) {
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;
  delete editor.saves[name];
  editor.saveOrder.splice(editor.saveOrder.indexOf(name), 1);
  if (editor.currentSave === name) editor.currentSave = undefined;
  storeSave();
}
function renameSave(name) {
  let newName = prompt("Please input new name.");
  if (newName !== null && newName !== name) {
    editor.saveOrder.splice(editor.saveOrder.indexOf(name), 1, newName);
    editor.saves[newName] = deepCopy(editor.saves[name]);
    delete editor.saves[name];
    if (editor.currentSave === name) editor.currentSave = newName;
    storeSave();
  }
}
function moveSave(name, dir) {
  let index = editor.saveOrder.indexOf(name);
  if (index + dir < 0 || index + dir >= editor.saveOrder.length) return;
  editor.saveOrder.splice(index, 1);
  editor.saveOrder.splice(index + dir, 0, name);
  storeSave();
}
function addTooltip(elem, text) {
  elem.addEventListener("mousemove", function (event) {
    if (editor.showTooltips) {
      id("tooltip").textContent = text;
      id("tooltip").style.display = "block";
      id("tooltip").style.left =
        Math.min(
          event.clientX + 5,
          window.innerWidth - id("tooltip").clientWidth
        ) + "px";
      id("tooltip").style.top =
        Math.max(event.clientY - id("tooltip").clientHeight - 5, 0) + "px";
    }
  });
  elem.addEventListener("mouseleave", function () {
    id("tooltip").style.display = "none";
  });
}
function blurAll() {
  id("exportArea").style.display = "inline";
  id("exportArea").focus();
  id("exportArea").style.display = "none";
}
function init() {
  document.querySelectorAll(".hasTooltip").forEach(function (ele) {
    addTooltip(ele, ele.dataset.tooltip);
  });
  setInterval(function () {
    if (editor.autoSave) save();
  }, 5000);
  startState.x = 215;
  startState.y = 280;
  for (let i in blockData) {
    let btn = new PIXI.Application({
      width: 50,
      height: 50,
      view: id("blockSelect" + i),
      transparent: true
    });
    let s = new PIXI.Sprite(
      blockData[i].getTexture(blockData[i].defaultBlock, btn)
    );
    blockData[i].update(blockData[i].defaultBlock, s);
    btn.stage.addChild(s);
  }
  for (let i in propData) propAliasReverse[propData[i][1]] = i;
  setLevel(str2lvl(level));
  drawLevel(true);
  adjustLevelSize();
  updateGrid();
  respawn(true);
  changeBuildSelect(new Block(0, 0, 0, 50));
  window.requestAnimationFrame(nextFrame);
}
