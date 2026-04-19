/**
 * Carrega `content.json` e preenche os slots da página.
 * Para atualizar textos, links e notícias, edite apenas content.json na raiz do site.
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
  if (!container || !data?.items) return;
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

function renderNoticiasList(container, items) {
  if (!container || !Array.isArray(items)) return;
  container.innerHTML = items
    .map((n) => {
      const date = n.date ? new Date(n.date + "T12:00:00").toLocaleDateString("pt-BR") : "";
      const link = n.url
        ? `<a class="news-list__link" href="${escapeHtml(n.url)}">${escapeHtml(n.title)}</a>`
        : `<span class="news-list__static">${escapeHtml(n.title)}</span>`;
      return `
      <li class="news-list__item">
        <time class="news-list__date" datetime="${escapeHtml(n.date || "")}">${escapeHtml(date)}</time>
        <div class="news-list__content">
          ${link}
          ${n.excerpt ? `<p class="news-list__excerpt">${escapeHtml(n.excerpt)}</p>` : ""}
        </div>
      </li>`;
    })
    .join("");
}

function buildTickerInner(items) {
  const chips = items
    .filter((n) => n.title)
    .map((n) => {
      const label = n.url
        ? `<a href="${escapeHtml(n.url)}">${escapeHtml(n.title)}</a>`
        : `<span>${escapeHtml(n.title)}</span>`;
      return `<span class="news-ticker__chip">${label}</span>`;
    })
    .join('<span class="news-ticker__dot" aria-hidden="true">·</span>');
  return `${chips}${chips ? '<span class="news-ticker__dot" aria-hidden="true">·</span>' : ""}`;
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
    regLink.href = data.regulamento.url || "#";
    regLink.target = "_blank";
    regLink.rel = "noopener noreferrer";
    setText(regLink, data.regulamento.linkLabel || "Regulamento");
  }

  const insIntro = document.querySelector("[data-slot='inscricao-intro']");
  if (insIntro && data.inscricao?.intro) setText(insIntro, data.inscricao.intro);
  const insLink = document.querySelector("[data-slot='inscricao-link']");
  if (insLink && data.inscricao) {
    insLink.href = data.inscricao.url || "#";
    insLink.target = "_blank";
    insLink.rel = "noopener noreferrer";
    setText(insLink, data.inscricao.linkLabel || "Inscrição");
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
  const vidLink = document.querySelector("[data-slot='video-link']");
  if (vidLink && data.video2024) {
    vidLink.href = data.video2024.youtubeUrl || "#";
    vidLink.target = "_blank";
    vidLink.rel = "noopener noreferrer";
    setText(vidLink, data.video2024.linkLabel || "YouTube");
  }

  const vencTitle = document.querySelector("[data-slot='vencedoras-title']");
  if (vencTitle && data.vencedoras2024?.title) setText(vencTitle, data.vencedoras2024.title);
  const vencIntro = document.querySelector("[data-slot='vencedoras-intro']");
  if (vencIntro && data.vencedoras2024?.intro) setText(vencIntro, data.vencedoras2024.intro);
  renderVencedoras(document.querySelector("[data-slot='vencedoras-grid']"), data.vencedoras2024);

  const newsTitle = document.querySelector("[data-slot='noticias-title']");
  if (newsTitle && data.noticias?.title) setText(newsTitle, data.noticias.title);
  const newsIntro = document.querySelector("[data-slot='noticias-intro']");
  if (newsIntro && data.noticias?.intro) setText(newsIntro, data.noticias.intro);

  const items = data.noticias?.items || [];
  renderNoticiasList(document.querySelector("[data-slot='noticias-list']"), items);

  const tickerTrack = document.querySelector("[data-slot='news-ticker-track']");
  const tickerBox = document.querySelector(".news-ticker");
  if (tickerTrack && items.length) {
    const inner = buildTickerInner(items);
    tickerTrack.innerHTML = `<div class="news-ticker__group">${inner}</div><div class="news-ticker__group" aria-hidden="true">${inner}</div>`;
  } else if (tickerBox) {
    tickerBox.hidden = true;
  }

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
