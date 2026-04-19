/**
 * Primeiro toque: botão invisível em tela cheia. Depois: créditos ao compositor + controlo play/pause.
 */

export function resolveAudioSrc(relativePath) {
  if (!relativePath) return "";
  const normalized = String(relativePath).replace(/^\.\//, "").replace(/^\/+/, "");
  const parts = normalized.split("/");
  const file = parts.pop();
  const dir = parts.map((p) => encodeURIComponent(p)).join("/");
  return (dir ? `${dir}/` : "") + encodeURIComponent(file);
}

function bindPlayPauseUI(audio, cfg) {
  const bar = document.getElementById("themeMusicControlBar");
  const btn = document.getElementById("btnThemeMusicPlayPause");
  const iconEl = document.getElementById("themeMusicPlayIcon");
  const labelEl = document.getElementById("themeMusicPlayLabel");
  const creditEl = document.getElementById("themeMusicCredit");
  if (!bar || !btn || !iconEl || !labelEl) return;

  const pauseL = cfg.pauseLabel || "Pausar música";
  const playL = cfg.playLabel || "Continuar música";

  if (creditEl) {
    if (cfg.composerCredit) {
      creditEl.textContent = cfg.composerCredit;
    } else {
      creditEl.hidden = true;
    }
  }

  function syncButton() {
    const playing = !audio.paused;
    btn.setAttribute("aria-pressed", String(playing));
    btn.setAttribute("aria-label", playing ? pauseL : playL);
    iconEl.textContent = playing ? "⏸" : "▶";
    labelEl.textContent = playing ? pauseL : playL;
  }

  audio.addEventListener("play", syncButton);
  audio.addEventListener("pause", syncButton);
  syncButton();

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  bar.hidden = false;
  bar.setAttribute("aria-hidden", "false");
}

export function initThemeMusic(cfg) {
  const audioSrc = cfg?.audioSrc ? resolveAudioSrc(cfg.audioSrc) : "";
  if (!audioSrc) return;

  const capture = document.getElementById("themeMusicCapture");
  const host = document.getElementById("themeMusicAudioHost");
  if (!capture || !host) return;

  const label = cfg.captureAriaLabel || "Ativar som do festival — toque uma vez em qualquer lugar da tela";
  capture.setAttribute("aria-label", label);

  document.body.classList.add("theme-music-locked");

  let started = false;
  let audioRef = null;

  function unlock() {
    if (started) return;
    started = true;

    const audio = document.createElement("audio");
    audio.src = audioSrc;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.loop = cfg.loop !== false;
    audio.title = cfg.title ? `${cfg.title}` : "Trilha do festival";
    audio.className = "theme-music-audio";
    host.innerHTML = "";
    host.appendChild(audio);
    audioRef = audio;

    const play = async () => {
      try {
        await audio.play();
      } catch (err) {
        console.warn("[theme-music]", err);
      }
    };

    play();

    capture.remove();
    document.body.classList.remove("theme-music-locked");

    bindPlayPauseUI(audio, cfg);
  }

  capture.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      unlock();
    },
    { once: true }
  );

  capture.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        unlock();
      }
    },
    { once: true }
  );

  requestAnimationFrame(() => {
    try {
      capture.focus({ preventScroll: true });
    } catch {
      capture.focus();
    }
  });
}
