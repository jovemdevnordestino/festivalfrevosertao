/**
 * Frevo Sertão — carrega content.json, depois GSAP (parallax, revelações, sombrinha), tilt.
 */
import { loadSiteContent } from "./content-loader.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initUmbrellaTransition() {
  const el = document.getElementById("umbrellaTransition");
  const left = el?.querySelector(".umbrella-transition__panel--left");
  const right = el?.querySelector(".umbrella-transition__panel--right");
  if (!el || !left || !right || typeof gsap === "undefined") return;

  gsap.set([left, right], { scaleX: 1, transformOrigin: (i) => (i === 0 ? "right center" : "left center") });

  if (prefersReducedMotion) {
    gsap.set(el, { display: "none" });
    return;
  }

  gsap.to([left, right], {
    scaleX: 0,
    duration: 1.1,
    stagger: 0.06,
    ease: "elastic.out(1, 0.75)",
    onComplete: () => {
      gsap.set(el, { pointerEvents: "none" });
    },
  });

  const playTransition = (onMid) => {
    el.classList.add("is-active");
    const t = gsap.timeline({
      onComplete: () => {
        el.classList.remove("is-active");
      },
    });
    t.to([left, right], {
      scaleX: 1,
      duration: 0.35,
      stagger: 0.04,
      ease: "power2.in",
    })
      .add(() => {
        if (typeof onMid === "function") onMid();
      })
      .to([left, right], {
        scaleX: 0,
        duration: 0.55,
        stagger: 0.05,
        ease: "elastic.out(1, 0.8)",
      });
  };

  document.querySelectorAll('.site-header__nav a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      playTransition(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  });
}

function initParallax() {
  if (prefersReducedMotion || typeof gsap === "undefined") return;

  const hero = document.getElementById("hero");
  if (!hero) return;

  const slow = hero.querySelector('[data-parallax="slow"]');
  const fast = hero.querySelector('[data-parallax="fast"]');

  gsap.to(slow, {
    y: 80,
    rotation: 6,
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: 1.2,
    },
  });

  gsap.to(fast, {
    y: 140,
    rotation: -10,
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: 0.8,
    },
  });
}

function initReveal() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length) return;

  if (prefersReducedMotion) {
    gsap.set(elements, { clearProps: "opacity,transform" });
    return;
  }

  elements.forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 48, rotation: i % 2 === 0 ? -2 : 2 },
      {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: 1,
        ease: "elastic.out(1, 0.65)",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  });
}

function initInscricoes(cfg) {
  const buttons = document.querySelectorAll(".btn-inscricao");
  const dialog = document.getElementById("inscricoesDialog");
  if (!buttons.length) return;

  const isClosed = cfg?.isClosed === true;

  buttons.forEach((btn) => {
    btn.disabled = isClosed;
    btn.classList.toggle("is-disabled", isClosed);
    if (isClosed) {
      btn.setAttribute("aria-disabled", "true");
      btn.title = cfg?.closedMessage || "Inscrições encerradas";
    } else {
      btn.removeAttribute("aria-disabled");
      btn.removeAttribute("title");
    }
  });

  if (!dialog) return;

  if (isClosed) return;

  const url = String(cfg?.googleFormUrl || "").trim();

  const onClick = () => {
    if (url && /^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    }
  };

  buttons.forEach((btn) => btn.addEventListener("click", onClick));

  const close = () => {
    if (typeof dialog.close === "function") dialog.close();
  };

  dialog.querySelector(".inscricoes-dialog__close")?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
}

function initHeroDecorEntrance() {
  if (prefersReducedMotion || typeof gsap === "undefined") return;
  const hero = document.getElementById("hero");
  if (!hero) return;

  const u1 = hero.querySelector(".decor--umbrella-1");
  const u2 = hero.querySelector(".decor--umbrella-2");
  const c1 = hero.querySelector(".decor--cactus-1");

  gsap.fromTo(
    u1,
    { opacity: 0, scale: 0.3, rotation: -45, x: -80 },
    { opacity: 1, scale: 1, rotation: -12, x: 0, duration: 1.4, ease: "elastic.out(1, 0.5)", delay: 0.2 }
  );
  gsap.fromTo(
    u2,
    { opacity: 0, scale: 0.2, rotation: 60, x: 100 },
    { opacity: 1, scale: 1, rotation: 18, x: 0, duration: 1.5, ease: "elastic.out(1, 0.45)", delay: 0.35 }
  );
  if (c1) {
    gsap.fromTo(
      c1,
      { opacity: 0, y: 120, rotation: -20 },
      { opacity: 0.9, y: 0, rotation: 5, duration: 1.2, ease: "elastic.out(1, 0.55)", delay: 0.5 }
    );
  }
}

async function bootstrap() {
  const loaded = await loadSiteContent();
  if (!loaded) {
    const b = document.getElementById("bannerMessage");
    if (b) b.textContent = "FESTIVAL FREVO SERTÃO — 2ª EDIÇÃO (edite content.json)";
  }

  initInscricoes(loaded?.inscricoes || {});
  initUmbrellaTransition();
  initHeroDecorEntrance();

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    initParallax();
    initReveal();
    ScrollTrigger.refresh();
  }

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
