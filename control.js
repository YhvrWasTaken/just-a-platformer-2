let controlSchemes = {
  keyboard: {
    left: false,
    right: false,
    up: false,
    down: false,
    shift: false,
  },
  slider: {
    slider: 0,
    jump: false,
    unjump: false,
  },
};
let control = {};
let controlMethod = "unset";

function setControlMethod(method) {
  if (controlMethod === method) return;
  controlMethod = method;
  try {
    mobileSlider.controlMethod = method;
  } catch (e) {}
  control = controlSchemes[method];
}

document.addEventListener("keydown", function (event) {
  setControlMethod("keyboard");
  let key = event.code;
  switch (key) {
    case "ArrowLeft":
    case "KeyA":
      control.left = true;
      break;
    case "ArrowRight":
    case "KeyD":
      control.right = true;
      break;
    case "ArrowUp":
    case "KeyW":
      control.up = true;
      break;
    case "ArrowDown":
    case "KeyS":
      control.down = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      control.shift = true;
      break;
    case "KeyR":
      respawn(event.shiftKey && editor !== undefined);
      break;
    default:
  }
});

document.addEventListener("keyup", function (event) {
  let key = event.code;
  switch (key) {
    case "ArrowLeft":
    case "KeyA":
      control.left = false;
      if (player.xg) canJump = true;
      break;
    case "ArrowRight":
    case "KeyD":
      control.right = false;
      if (player.xg) canJump = true;
      break;
    case "ArrowUp":
    case "KeyW":
      control.up = false;
      if (!player.xg) canJump = true;
      break;
    case "ArrowDown":
    case "KeyS":
      control.down = false;
      if (!player.xg) canJump = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      control.shift = false;
      canSave = true;
      break;
    default:
  }
});

// stolen from https://stackoverflow.com/a/11381730
function detectMobile() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  return toMatch.some(toMatchItem => navigator.userAgent.match(toMatchItem));
}

const isMobile = detectMobile();
if (isMobile) {
  id("editOptions").style.display = "none";
  id("blockSelect").style.display = "none";
  id("blockEdit").style.display = "none";
  id("saveMenu").style.display = "none";
  setControlMethod("slider");
}

const mobileSlider = new Vue({
  el: "#sliderControls",
  data: {
    controlMethod,
    // might use later?
    control,
  },
});

const slider = id("slider");
slider.addEventListener("touchmove", e => {
  e.preventDefault();
  const style = getComputedStyle(slider);
  let startX = parseInt(style.left);
  let endX = startX + parseInt(style.width);
  const touch = e.changedTouches.item(0);
  const touchX = touch.pageX;

  // handle (literal) edge cases
  if (startX > touchX) control.slider = -1;
  else if (touchX > endX) control.slider = 1;
  // calculate slider position
  else {
    let percent = (touchX - startX) / (endX - startX);
    control.slider = Math.min(Math.max((percent - .5) * 15, -1), 1);
  }
});

slider.addEventListener("touchend", e => {
  control.slider = 0;
});

document.addEventListener("touchstart", e => {
  setControlMethod("slider");
});

const sliderJump = id("sliderJump");
sliderJump.addEventListener("touchstart", () => {
  control.jump = true;
});
sliderJump.addEventListener("touchend", () => {
  control.jump = false;
  canJump = true;
});

document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});

function touchHandler(event) {
  var touches = event.changedTouches,
    first = touches[0],
    type = "";
  switch (event.type) {
    case "touchstart":
      type = "mousedown";
      break;
    case "touchmove":
      type = "mousemove";
      break;
    case "touchend":
      type = "mouseup";
      break;
    default:
      return;
  }

  // initMouseEvent(type, canBubble, cancelable, view, clickCount,
  //                screenX, screenY, clientX, clientY, ctrlKey,
  //                altKey, shiftKey, metaKey, button, relatedTarget);

  var simulatedEvent = document.createEvent("MouseEvent");
  simulatedEvent.initMouseEvent(
    type,
    true,
    true,
    window,
    1,
    first.screenX,
    first.screenY,
    first.clientX,
    first.clientY,
    false,
    false,
    false,
    false,
    0, // left
    null
  );

  first.target.dispatchEvent(simulatedEvent);
  // event.preventDefault();
}

document.addEventListener("touchstart", touchHandler, true);
document.addEventListener("touchmove", touchHandler, true);
document.addEventListener("touchend", touchHandler, true);