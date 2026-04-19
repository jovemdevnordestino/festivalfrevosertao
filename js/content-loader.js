/**
 * Carrega `content.json` e preenche os slots da página.
 * Para atualizar textos, links e patrocinadores, edite apenas content.json na raiz do site.
 */

const DEFAULT_CONTENT_URL = "./content.json";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setHtml(el, html) {
  if (!el) return;
  el.innerHTML = html;
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

function renderParagraphs(container, paragraphs) {
  if (!container || !Array.isArray(paragraphs)) return;
  container.innerHTML = paragraphs.map((p) => `<p class="flow-text">${p}</p>`).join("");
}

function renderVencedoras(container, data) {
  if (!container || !data) return;
  if (Array.isArray(data.podium) && data.podium.length > 0) {
    const concurso = escapeHtml(data.concursoTitle || "Concurso Musical");
    const rankClass = (i) =>
      i === 0 ? "podium-card--gold" : i === 1 ? "podium-card--silver" : "podium-card--bronze";
    const podiumHtml = data.podium
      .map(
        (row, i) => `
    <article class="podium-card glass-panel ${rankClass(i)}" data-reveal>
      <p class="podium-card__place">${escapeHtml(row.place)}</p>
      <h3 class="podium-card__work">${escapeHtml(row.work)}</h3>
      <p class="podium-card__artist">${escapeHtml(row.artist)}</p>
      <p class="podium-card__city">${escapeHtml(row.city)}</p>
    </article>`
      )
      .join("");
    const specials = Array.isArray(data.specialAwards) ? data.specialAwards : [];
    const specialHeading = escapeHtml(data.specialAwardsTitle || "Prêmios de interpretação");
    const specialsHtml = specials
      .map(
        (a) => `
    <article class="special-award glass-panel" data-reveal>
      <p class="special-award__label">${escapeHtml(a.title)}</p>
      <p class="special-award__name">${escapeHtml(a.name)}</p>
      <p class="special-award__city">${escapeHtml(a.city)}</p>
    </article>`
      )
      .join("");
    container.innerHTML = `
  <div class="vencedoras__featured glass-panel" data-reveal>
    <header class="vencedoras__featured-head">
      <span class="vencedoras__featured-badge" aria-hidden="true">2024</span>
      <h3 class="vencedoras__concurso-title">${concurso}</h3>
    </header>
    <div class="podium">${podiumHtml}</div>
  </div>
  ${
    specialsHtml
      ? `<div class="vencedoras__special-wrap">
    <h3 class="vencedoras__special-title">${specialHeading}</h3>
    <div class="vencedoras__special-grid">${specialsHtml}</div>
  </div>`
      : ""
  }`;
    return;
  }
  if (!data.items?.length) return;
  container.innerHTML = data.items
    .map(
      (it) => `
    <article class="winner-card glass-panel" data-reveal>
      <div class="winner-card__media mask-organic">
        <img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.imageAlt || it.name)}" loading="lazy" width="480" height="360" />
      </div>
      <div class="winner-card__body">
        <p class="winner-card__category">${escapeHtml(it.category)}</p>
        <h3 class="winner-card__name">${escapeHtml(it.name)}</h3>
        <p class="winner-card__text">${escapeHtml(it.text)}</p>
      </div>
    </article>`
    )
    .join("");
}

function initBannerRotation(messages, rotateSeconds, el) {
  if (!el || !Array.isArray(messages) || messages.length === 0) return;
  let i = 0;
  setText(el, messages[0]);
  if (messages.length === 1) return;
  const sec = Math.max(3, Number(rotateSeconds) || 6);
  setInterval(() => {
    i = (i + 1) % messages.length;
    el.classList.add("is-changing");
    setTimeout(() => {
      setText(el, messages[i]);
      el.classList.remove("is-changing");
    }, 220);
  }, sec * 1000);
}

function injectSpotify(embedSrc, title, container, height = "352") {
  if (!container || !embedSrc) return;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-testid", "embed-iframe");
  iframe.style.borderRadius = "12px";
  iframe.src = embedSrc;
  iframe.width = "100%";
  iframe.height = String(height);
  iframe.frameBorder = "0";
  iframe.setAttribute("allowfullscreen", "");
  iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  iframe.loading = "lazy";
  iframe.title = title || "Spotify";
  container.innerHTML = "";
  container.appendChild(iframe);
}

function injectYoutubeEmbed(v, container) {
  if (!container || !v) return;
  const src =
    typeof v.youtubeEmbedSrc === "string" && v.youtubeEmbedSrc.trim() ? v.youtubeEmbedSrc.trim() : "";
  if (!src) return;
  let iframe = container.querySelector("iframe.midia__youtube-iframe");
  if (!iframe) {
    container.innerHTML = "";
    iframe = document.createElement("iframe");
    container.appendChild(iframe);
  }
  iframe.setAttribute("width", "560");
  iframe.setAttribute("height", "315");
  iframe.src = src;
  iframe.title = v.iframeTitle || "YouTube video player";
  iframe.setAttribute("frameborder", "0");
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  iframe.setAttribute("allowfullscreen", "");
  iframe.loading = "lazy";
  iframe.className = "midia__youtube-iframe";
}

export async function loadSiteContent(url = DEFAULT_CONTENT_URL) {
  let data;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    data = await res.json();
  } catch (e) {
    console.warn("[Frevo Sertão] Não foi possível carregar content.json:", e);
    return null;
  }

  const m = data.meta;
  if (m?.pageTitle) document.title = m.pageTitle;
  if (m?.siteUrl) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = m.siteUrl;
  }

  const editionEl = document.querySelector("[data-slot='edition-badge']");
  if (editionEl && m?.edition) setText(editionEl, m.edition);

  const bannerMsg = document.getElementById("bannerMessage");
  if (data.banner?.messages) initBannerRotation(data.banner.messages, data.banner.rotateSeconds, bannerMsg);

  const festivalTitle = document.querySelector("[data-slot='festival-title']");
  if (festivalTitle && data.festival?.title) setText(festivalTitle, data.festival.title);
  renderParagraphs(document.querySelector("[data-slot='festival-body']"), data.festival?.paragraphs);

  const cocarTitle = document.querySelector("[data-slot='cocar-title']");
  if (cocarTitle && data.cocar?.title) setText(cocarTitle, data.cocar.title);
  renderParagraphs(document.querySelector("[data-slot='cocar-body']"), data.cocar?.paragraphs);

  const regIntro = document.querySelector("[data-slot='regulamento-intro']");
  if (regIntro && data.regulamento?.intro) setText(regIntro, data.regulamento.intro);
  const regLink = document.querySelector("[data-slot='regulamento-link']");
  if (regLink && data.regulamento) {
    const url = data.regulamento.url || "#";
    regLink.href = url;
    const isRemote = /^https?:\/\//i.test(url);
    if (isRemote) {
      regLink.target = "_blank";
      regLink.rel = "noopener noreferrer";
      regLink.removeAttribute("download");
    } else {
      regLink.removeAttribute("target");
      regLink.removeAttribute("rel");
      const file = url.split("/").pop();
      if (file && /\.(docx|pdf)$/i.test(file)) {
        regLink.setAttribute("download", file);
      } else {
        regLink.removeAttribute("download");
      }
    }
    setText(regLink, data.regulamento.linkLabel || "Regulamento");
  }

  const spotifyTitle = data.spotify?.title || "Álbum do Festival Frevo Sertão no Spotify";
  const headerWrap = document.querySelector("[data-slot='header-spotify-embed']");
  const headerIframe = headerWrap?.querySelector("iframe");
  if (headerIframe && data.spotify?.embedSrc) {
    headerIframe.src = data.spotify.embedSrc;
    headerIframe.title = spotifyTitle;
    const h = data.spotify.headerEmbedHeight ?? "152";
    headerIframe.height = String(h);
  }
  injectSpotify(
    data.spotify?.embedSrc,
    spotifyTitle,
    document.querySelector("[data-slot='spotify-embed']"),
    data.spotify?.embedHeight ?? "352"
  );

  const vidTitle = document.querySelector("[data-slot='video-title']");
  if (vidTitle && data.video2024?.title) setText(vidTitle, data.video2024.title);
  const vidIntro = document.querySelector("[data-slot='video-intro']");
  if (vidIntro && data.video2024?.intro) setText(vidIntro, data.video2024.intro);
  injectYoutubeEmbed(data.video2024, document.querySelector("[data-slot='youtube-embed']"));
  const vidLink = document.querySelector("[data-slot='video-link']");
  if (vidLink && data.video2024?.youtubeUrl) {
    vidLink.href = data.video2024.youtubeUrl;
    vidLink.target = "_blank";
    vidLink.rel = "noopener noreferrer";
    setText(vidLink, data.video2024.linkLabel || "Abrir no YouTube");
  }

  const vencTitle = document.querySelector("[data-slot='vencedoras-title']");
  if (vencTitle && data.vencedoras2024?.title) setText(vencTitle, data.vencedoras2024.title);
  const vencIntro = document.querySelector("[data-slot='vencedoras-intro']");
  if (vencIntro && data.vencedoras2024?.intro) setText(vencIntro, data.vencedoras2024.intro);
  renderVencedoras(document.querySelector("[data-slot='vencedoras-grid']"), data.vencedoras2024);

  const patTitle = document.querySelector("[data-slot='patrocinadores-title']");
  if (patTitle && data.patrocinadores?.title) setText(patTitle, data.patrocinadores.title);
  const patIntro = document.querySelector("[data-slot='patrocinadores-intro']");
  if (patIntro && data.patrocinadores?.intro) setText(patIntro, data.patrocinadores.intro);
  const patTrack = document.querySelector("[data-slot='patrocinadores-track']");
  const patSrc = data.patrocinadores?.imageSrc || "assets/Patrocinadores.png";
  const patAlt = data.patrocinadores?.imageAlt || "";
  const patSec = Math.max(12, Number(data.patrocinadores?.marqueeSeconds) || 40);
  if (patTrack) {
    patTrack.style.setProperty("--patroc-duration", `${patSec}s`);
  }
  document.querySelectorAll(".patrocinadores__marquee .patrocinadores__img").forEach((img, i) => {
    img.src = patSrc;
    img.alt = i === 0 ? patAlt : "";
  });

  const fy = document.getElementById("footerYear");
  if (fy) fy.textContent = String(new Date().getFullYear());

  const footerUrl = document.querySelector("[data-slot='footer-site-url']");
  if (footerUrl && m?.siteUrl) {
    footerUrl.href = m.siteUrl;
    footerUrl.textContent = m.siteUrl.replace(/^https?:\/\//, "");
  }

  window.__FREVO_SITE_CONTENT__ = data;
  return data;
}
