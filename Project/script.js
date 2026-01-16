// calc.js
(() => {
  const display = document.getElementById("display");
  const keys = document.querySelector(".keys");
  let expr = "";

  function update() {
    display.textContent = expr || "0";
  }

  // Animations for equals and errors
  function animateEquals() {
    display.classList.add('eq-animate');
    const onEnd = () => { display.classList.remove('eq-animate'); display.removeEventListener('animationend', onEnd); };
    display.addEventListener('animationend', onEnd);
  }

  function animateError() {
    display.classList.add('err');
    const onEnd = () => { display.classList.remove('err'); display.removeEventListener('animationend', onEnd); };
    display.addEventListener('animationend', onEnd);
  }

  function safeEval(s) {
    // allow only digits, whitespace, operators and parentheses
    if (!/^[0-9+\-*/().\s]+$/.test(s)) throw new Error("Invalid");
    // replace ×/÷ if used
    return Function(`"use strict"; return (${s})`)();
  }

  keys.addEventListener("click", (e) => {
    const b = e.target;
    if (b.tagName !== "BUTTON") return;
    const action = b.dataset.action;
    const v = b.textContent;
    let animation = null;

    switch (action) {
      case "clear":
        expr = "";
        break;
      case "back":
        expr = expr.slice(0, -1);
        break;
      case "paren":
        expr += expr.endsWith("(") ? ")" : "(";
        break;
      case "dot":
        expr += ".";
        break;
      case "neg":
        expr = expr ? `(-1)*(${expr})` : expr;
        break;
      case "op":
        expr += ` ${v} `;
        break;
      case "equals":
        try {
          expr = String(safeEval(expr));
          animation = 'eq';
        } catch (err) {
          expr = "Error";
          animation = 'err';
        }
        break;
      default: // digits
        expr += v;
    }
    update();
    if (animation === 'eq') animateEquals();
    else if (animation === 'err') animateError();
  });

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    let animation = null;
    if (e.key >= "0" && e.key <= "9") expr += e.key;
    else if ("+-*/().".includes(e.key)) expr += e.key;
    else if (e.key === "Enter") {
      try {
        expr = String(safeEval(expr));
        animation = 'eq';
      } catch {
        expr = "Error";
        animation = 'err';
      }
    } else if (e.key === "Backspace") expr = expr.slice(0, -1);
    else if (e.key.toLowerCase() === "c") expr = "";
    update();
    if (animation === 'eq') animateEquals();
    else if (animation === 'err') animateError();
  });

  update();

  // Make the calculator installable as a PWA
  let deferredPrompt = null;
  const installBtn = document.getElementById('installCalcBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  // Register the service worker (root sw handles caching)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js').catch(err => console.warn('SW register failed', err));
  }
})();