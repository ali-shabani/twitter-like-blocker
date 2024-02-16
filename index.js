// ==UserScript==
// @name         Twitter auto blocker
// @namespace    http://alish.me/
// @version      2024-02-16
// @description  auto block based on likes.
// @author       Ali Shabani
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  const pathParts = document.location.pathname.split("/");

  if (pathParts[2] === "status" && pathParts[4] === "likes") {
    start();
  }
})();

let blocking = false;
const blocked = new Set();
let stopButton = false;

async function start() {
  const likeContainer = await lookingFor(() =>
    document.querySelector('[aria-label="Timeline: Likes"]')
  );
  run(likeContainer);
}

function run(likeContainer) {
  if (blocking) {
    !stopButton && createStopButton();
    startBlock(likeContainer);
    return;
  }

  createStartButton(likeContainer);
}

async function startBlock(likeContainer) {
  const nodes = Array.from(likeContainer.lastChild.childNodes);

  let destination;
  for (let node of nodes) {
    destination = node.querySelector('[role="link"]').href;
    if (blocked.has(destination)) {
      node.remove();
      continue;
    }

    node.querySelector('[role="button"]').click();
    break;
  }

  await lookingFor(() => document.location.href === destination);
  blocked.add(destination);

  const more = await lookingFor(() =>
    document.querySelector('[aria-label="More"]')
  );
  more.click();

  const menu = await lookingFor(() => document.querySelector('[role="menu"]'));
  const blockButton = await lookingFor(() =>
    menu.querySelector('[data-testid="block"]')
  );
  blockButton.click();
  await lookingFor(() => document.querySelector('[data-testid="emptyState"]'));
  history.back();
  start();
}

function createStartButton(likeContainer) {
  const button = document.createElement("button");
  button.innerHTML = "start to block";
  button.addEventListener("click", () => {
    blocking = true;
    startBlock(likeContainer);
  });

  likeContainer.prepend(button);
}

function createStopButton() {
  stopButton = true;
  const button = document.createElement("button");
  button.innerText = "stop";
  button.style.position = "absolute";
  button.style.top = "0";
  button.style.right = "0";
  button.style.backgroundColor = "red";

  document.body.appendChild(button);

  button.addEventListener("click", () => {
    blocking = false;
  });
}

function lookingFor(cb) {
  return new Promise((resolve) => {
    const intId = setInterval(() => {
      const result = cb();
      if (result) {
        clearInterval(intId);
        resolve(result);
      }
    }, 100);
  });
}
