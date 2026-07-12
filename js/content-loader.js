/**
 * Carrega `content.json` e preenche os slots da página.
 * Textos e URLs editáveis ficam apenas em content.json na raiz do site.
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

/** Player Spotify na barra superior: URL compacta + iframe mais baixo */
function spotifyEmbedSrcForHeader(embedSrc) {
  if (!embedSrc) return "";
  try {
    const u = new URL(embedSrc);
    if (!u.searchParams.has("compact")) u.searchParams.set("compact", "true");
    return u.href;
  } catch {
    return embedSrc.includes("compact=")
      ? embedSrc
      : `${embedSrc}${embedSrc.includes("?") ? "&" : "?"}compact=true`;
  }
}

function normalizeInstagramPermalink(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "instagram.com") return "";
    u.search = "";
    u.hash = "";
    return u.href;
  } catch {
    return "";
  }
}

function queueInstagramEmbeds() {
  const processEmbeds = () => {
    try {
      const ig = window.instgrm?.Embeds;
      if (!ig) return;
      ig.process();
      requestAnimationFrame(() => ig.process());
    } catch (_) {
      /* embed.js opcional */
    }
  };

  if (window.instgrm?.Embeds) {
    processEmbeds();
    return;
  }

  let script = document.querySelector("script[data-instagram-embed-js]");
  if (!script) {
    script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.dataset.instagramEmbedJs = "1";
    document.body.appendChild(script);
  }
  script.addEventListener("load", processEmbeds);
}

function renderParagraphs(container, paragraphs) {
  if (!container || !Array.isArray(paragraphs)) return;
  container.innerHTML = paragraphs.map((p) => `<p class="flow-text">${p}</p>`).join("");
}

function applyDocumentLink(linkEl, labelEl, cfg, fallbackLabel) {
  if (!linkEl || !cfg) return;
  const url = String(cfg.url || cfg.href || "#").trim();
  linkEl.href = url || "#";
  const isRemote = /^https?:\/\//i.test(url);
  if (isRemote) {
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
    linkEl.removeAttribute("download");
  } else {
    linkEl.removeAttribute("target");
    linkEl.removeAttribute("rel");
    const file = url.split("/").pop();
    if (file && /\.(docx|pdf)$/i.test(file)) {
      linkEl.setAttribute("download", file);
    } else {
      linkEl.removeAttribute("download");
    }
  }
  if (labelEl) setText(labelEl, cfg.label || fallbackLabel || "Documento");
}

function renderNoticias(container, data) {
  if (!container || !data) return false;
  const items = Array.isArray(data.items) ? data.items : [];
  const emptyMsg = escapeHtml(data.emptyMessage || "Novidades em breve.");
  if (items.length === 0) {
    container.innerHTML = `<li class="noticias__item noticias__item--solo"><p class="noticias__placeholder">${emptyMsg}</p></li>`;
    return false;
  }

  let needsInstagram = false;
  container.innerHTML = items
    .map((it) => {
      const title = escapeHtml(it.title || "");
      const date = escapeHtml(it.date || "");
      const summaryRaw = it.summary != null ? String(it.summary).trim() : "";
      const summary = summaryRaw
        ? `<p class="noticias__summary">${escapeHtml(summaryRaw)}</p>`
        : "";
      const href = String(it.href || "").trim();
      const titleInner =
        href && /^https?:\/\//i.test(href)
          ? `<a class="noticias__link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${title}<span class="noticias__link-hint" aria-hidden="true"> ↗</span></a>`
          : `<span class="noticias__headline">${title}</span>`;
      const dateEl = date ? `<span class="noticias__date">${date}</span>` : "";

      const rawEmbedHtml = typeof it.instagramEmbedHtml === "string" ? it.instagramEmbedHtml.trim() : "";
      let igBlock = "";
      let hasInstagram = false;

      if (rawEmbedHtml) {
        hasInstagram = true;
        const cleaned = rawEmbedHtml.replace(/<script\b[\s\S]*?<\/script>/gi, "").trim();
        igBlock = `<div class="noticias__instagram-wrap"><div class="noticias__instagram-scale">${cleaned}</div></div>`;
      } else {
        const igPermalink = normalizeInstagramPermalink(it.instagramPermalink || it.instagramEmbedUrl || "");
        if (igPermalink) {
          hasInstagram = true;
          const captionAttr = it.instagramCaptioned === true ? ' data-instgrm-captioned=""' : "";
          igBlock = `<div class="noticias__instagram-wrap"><div class="noticias__instagram-scale"><blockquote class="instagram-media"${captionAttr} data-instgrm-permalink="${escapeHtml(
            igPermalink
          )}" data-instgrm-version="14"></blockquote></div></div>`;
        }
      }

      if (hasInstagram) needsInstagram = true;
      const extraClass = hasInstagram ? " noticias__item--has-instagram" : "";
      return `<li class="noticias__item${extraClass}">
      ${dateEl ? `<div class="noticias__meta">${dateEl}</div>` : ""}
      <div class="noticias__body">
        <h3 class="noticias__item-title">${titleInner}</h3>
        ${summary}
        ${igBlock}
      </div>
    </li>`;
    })
    .join("");

  return needsInstagram;
}

function renderNav(container, items) {
  if (!container || !Array.isArray(items)) return;
  container.replaceChildren(
    ...items.map((item) => {
      const a = document.createElement("a");
      const href = item.href || "#";
      a.href = href;
      a.textContent = item.label || "";
      if (/^https?:\/\//i.test(href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.classList.add("site-header__nav-link--external");
      }
      return a;
    })
  );
}

function renderVencedoras(container, data) {
  if (!container || !data) return;
  if (Array.isArray(data.podium) && data.podium.length > 0) {
    const badgeYear = escapeHtml(data.badgeYear || "2024");
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
      <span class="vencedoras__featured-badge" aria-hidden="true">${badgeYear}</span>
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

  const md = document.querySelector('meta[name="description"]');
  if (md && m?.metaDescription != null) md.setAttribute("content", m.metaDescription);

  if (m?.siteUrl) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = m.siteUrl;
  }

  const headerCfg = data.header || {};
  const brand = document.querySelector("[data-slot='header-brand']");
  if (brand) {
    brand.setAttribute("aria-label", headerCfg.brandAriaLabel || "");
  }
  const logoImg = document.querySelector("[data-slot='header-logo']");
  if (logoImg && headerCfg.logoSrc) {
    logoImg.src = headerCfg.logoSrc;
    if (headerCfg.logoAlt != null) logoImg.alt = headerCfg.logoAlt;
  }

  const navEl = document.querySelector("[data-slot='site-nav']");
  if (navEl) {
    if (headerCfg.navAriaLabel) navEl.setAttribute("aria-label", headerCfg.navAriaLabel);
    renderNav(navEl, data.nav);
  }

  const headerInstagram = document.querySelector("[data-slot='header-instagram']");
  if (headerInstagram) {
    const igUrl = String(
      headerCfg.instagramUrl || data.footer?.instagramUrl || ""
    ).trim();
    if (igUrl) {
      headerInstagram.href = igUrl;
      headerInstagram.hidden = false;
      headerInstagram.setAttribute(
        "aria-label",
        headerCfg.instagramAriaLabel || "Instagram — Festival Frevo Sertão"
      );
    } else {
      headerInstagram.hidden = true;
    }
  }

  const bannerStrip = document.getElementById("bannerStrip");
  if (bannerStrip && data.banner?.stripAriaLabel) {
    bannerStrip.setAttribute("aria-label", data.banner.stripAriaLabel);
  }
  const domainBadge = document.querySelector("[data-slot='banner-domain']");
  if (domainBadge && data.banner?.domainBadge) setText(domainBadge, data.banner.domainBadge);

  const editionEl = document.querySelector("[data-slot='edition-badge']");
  if (editionEl && m?.edition) setText(editionEl, m.edition);

  const bannerMsg = document.getElementById("bannerMessage");
  if (bannerMsg && data.banner?.messages) {
    initBannerRotation(data.banner.messages, data.banner.rotateSeconds, bannerMsg);
  }

  const heroEyebrow = document.querySelector("[data-slot='hero-eyebrow']");
  const heroTitle = document.querySelector("[data-slot='hero-title']");
  const heroLead = document.querySelector("[data-slot='hero-lead']");
  const heroCta = document.querySelector("[data-slot='hero-cta']");
  const heroCtaLabel = document.querySelector("[data-slot='hero-cta-label']");
  const h = data.hero || {};
  if (heroEyebrow && h.eyebrow) setText(heroEyebrow, h.eyebrow);
  if (heroTitle && h.title) setText(heroTitle, h.title);
  if (heroLead && h.lead) setHtml(heroLead, h.lead);
  if (heroCta && h.ctaHref) heroCta.setAttribute("href", h.ctaHref);
  if (heroCtaLabel && h.ctaLabel) setText(heroCtaLabel, h.ctaLabel);

  const homeBannerEyebrow = document.querySelector("[data-slot='home-banner-eyebrow']");
  const homeBannerTitle = document.querySelector("[data-slot='home-banner-title']");
  const homeBannerText = document.querySelector("[data-slot='home-banner-text']");
  const homeBannerCta = document.querySelector("[data-slot='home-banner-cta']");
  const homeBannerCtaLabel = document.querySelector("[data-slot='home-banner-cta-label']");
  const hb = data.homeBanner || {};
  if (homeBannerEyebrow && hb.eyebrow) setText(homeBannerEyebrow, hb.eyebrow);
  if (homeBannerTitle && hb.title) setText(homeBannerTitle, hb.title);
  if (homeBannerText && hb.text) setText(homeBannerText, hb.text);
  if (homeBannerCta && hb.ctaHref) homeBannerCta.setAttribute("href", hb.ctaHref);
  if (homeBannerCtaLabel && hb.ctaLabel) setText(homeBannerCtaLabel, hb.ctaLabel);

  const notTitle = document.querySelector("[data-slot='noticias-title']");
  const notIntro = document.querySelector("[data-slot='noticias-intro']");
  const notList = document.querySelector("[data-slot='noticias-list']");
  const n = data.noticias || {};
  if (notTitle && n.title) setText(notTitle, n.title);
  if (notIntro) {
    const intro = n.intro != null ? String(n.intro).trim() : "";
    if (intro) {
      setText(notIntro, intro);
      notIntro.hidden = false;
    } else {
      notIntro.textContent = "";
      notIntro.hidden = true;
    }
  }
  const noticiasNeedsInstagram = renderNoticias(notList, n);
  if (noticiasNeedsInstagram) queueInstagramEmbeds();

  const festivalTitle = document.querySelector("[data-slot='festival-title']");
  if (festivalTitle && data.festival?.title) setText(festivalTitle, data.festival.title);
  renderParagraphs(document.querySelector("[data-slot='festival-body']"), data.festival?.paragraphs);

  const cocarTitle = document.querySelector("[data-slot='cocar-title']");
  if (cocarTitle && data.cocar?.title) setText(cocarTitle, data.cocar.title);
  renderParagraphs(document.querySelector("[data-slot='cocar-body']"), data.cocar?.paragraphs);

  const docHeading = document.querySelector("[data-slot='documentos-heading']");
  if (docHeading && data.documentos?.cardHeading) setText(docHeading, data.documentos.cardHeading);

  const regIntro = document.querySelector("[data-slot='regulamento-intro']");
  if (regIntro && data.regulamento?.intro) setText(regIntro, data.regulamento.intro);
  const regLink = document.querySelector("[data-slot='regulamento-link']");
  const regLabel = document.querySelector("[data-slot='regulamento-link-label']");
  if (regLink && data.regulamento) {
    applyDocumentLink(regLink, regLabel, { url: data.regulamento.url, label: data.regulamento.linkLabel }, "Regulamento");
  }

  const analiseLink = document.querySelector("[data-slot='analise-link']");
  const analiseLabel = document.querySelector("[data-slot='analise-link-label']");
  if (analiseLink && data.documentos) {
    applyDocumentLink(analiseLink, analiseLabel, { url: data.documentos.analiseUrl, label: data.documentos.analiseLabel }, "Relação da análise documental");
  }

  const recursoLink = document.querySelector("[data-slot='recurso-link']");
  const recursoLabel = document.querySelector("[data-slot='recurso-link-label']");
  if (recursoLink && data.documentos) {
    applyDocumentLink(recursoLink, recursoLabel, { url: data.documentos.recursoUrl, label: data.documentos.recursoLabel }, "------------");
  }

  const inc = data.inscricoes || {};
  const insTitle = document.querySelector("[data-slot='inscricoes-title']");
  const insSub = document.querySelector("[data-slot='inscricoes-subtitle']");
  const insCta = document.querySelector("[data-slot='inscricoes-cta-label']");
  const insPending = document.querySelector("[data-slot='inscricoes-pending-message']");
  const heroInsLink = document.querySelector("[data-slot='hero-inscricao-link']");
  if (insTitle && inc.title) setText(insTitle, inc.title);
  if (insSub) {
    const sub = inc.subtitle != null ? String(inc.subtitle).trim() : "";
    if (sub) {
      setText(insSub, sub);
      insSub.hidden = false;
    } else {
      insSub.textContent = "";
      insSub.hidden = true;
    }
  }
  if (insCta && inc.ctaLabel) setText(insCta, inc.ctaLabel);
  const heroInsLabel = document.querySelector("[data-slot='hero-inscricao-label']");
  if (heroInsLabel) {
    const heroLabel = data.documentos?.analiseLabel || inc.ctaLabel || "Relação da análise documental";
    setText(heroInsLabel, heroLabel);
  }
  if (heroInsLink && data.documentos?.analiseUrl) {
    heroInsLink.href = data.documentos.analiseUrl;
    heroInsLink.target = "_blank";
    heroInsLink.rel = "noopener noreferrer";
    heroInsLink.removeAttribute("download");
  }
  if (insPending && inc.pendingMessage) setText(insPending, inc.pendingMessage);

  const inscricoesButtons = document.querySelectorAll(".btn-inscricao");
  inscricoesButtons.forEach((btn) => {
    const isDocumentLink = btn.classList.contains("btn-inscricao--documento");
    const isClosed = inc.isClosed === true && !isDocumentLink;
    btn.disabled = isClosed;
    btn.classList.toggle("is-disabled", isClosed);
    if (isClosed) {
      btn.setAttribute("aria-disabled", "true");
      btn.title = inc.closedMessage || "Inscrições encerradas";
    } else {
      btn.removeAttribute("aria-disabled");
      btn.removeAttribute("title");
    }
  });

  const ms = data.midiaSection || {};
  const memTitle = document.querySelector("[data-slot='memoria-title']");
  const memSub = document.querySelector("[data-slot='memoria-subtitle']");
  const spotifyCardTitle = document.querySelector("[data-slot='midia-spotify-title']");
  const spotifyFallback = document.querySelector("[data-slot='spotify-placeholder']");
  if (memTitle && ms.title) setText(memTitle, ms.title);
  if (memSub && ms.subtitle) setText(memSub, ms.subtitle);
  if (spotifyCardTitle && ms.spotifyCardTitle) setText(spotifyCardTitle, ms.spotifyCardTitle);
  if (spotifyFallback && ms.spotifyPlaceholder) setText(spotifyFallback, ms.spotifyPlaceholder);

  const spotifyIframeTitle = data.spotify?.iframeTitle || data.spotify?.title || "Spotify";
  const spotifyTitle = spotifyIframeTitle;
  const headerWrap = document.querySelector("[data-slot='header-spotify-embed']");
  const headerIframe = headerWrap?.querySelector("iframe");
  if (headerIframe && data.spotify?.embedSrc) {
    headerIframe.src = spotifyEmbedSrcForHeader(data.spotify.embedSrc);
    headerIframe.title = spotifyIframeTitle;
    const he = data.spotify.headerEmbedHeight ?? "80";
    headerIframe.height = String(he);
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
  const patMarquee = document.querySelector("[data-slot='patrocinadores-marquee']");
  if (patMarquee && data.patrocinadores?.marqueeAriaLabel) {
    patMarquee.setAttribute("aria-label", data.patrocinadores.marqueeAriaLabel);
  }
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

  const footerBefore = document.querySelector("[data-slot='footer-before-year']");
  const footerAfter = document.querySelector("[data-slot='footer-after-year']");
  const fy = document.getElementById("footerYear");
  const foot = data.footer || {};
  if (footerBefore && foot.beforeYear != null) setText(footerBefore, foot.beforeYear);
  if (footerAfter && foot.afterYear != null) setText(footerAfter, foot.afterYear);
  if (fy) fy.textContent = String(new Date().getFullYear());
  const footerUrl = document.querySelector("[data-slot='footer-site-url']");
  if (footerUrl && m?.siteUrl) {
    footerUrl.href = m.siteUrl;
    footerUrl.textContent = m.siteUrl.replace(/^https?:\/\//, "");
  }

  const footerDevWrap = document.querySelector("[data-slot='footer-developer-wrap']");
  const footerDevPrefix = document.querySelector("[data-slot='footer-developer-prefix']");
  const footerDevLink = document.querySelector("[data-slot='footer-developer-link']");
  const devUrl = String(foot.developerInstagramUrl || "").trim();
  if (footerDevWrap && footerDevLink) {
    if (devUrl) {
      footerDevLink.href = devUrl;
      setText(footerDevLink, foot.developerLinkLabel || "Instagram");
      footerDevLink.setAttribute(
        "aria-label",
        foot.developerAriaLabel || "Instagram do desenvolvedor — Jeferson Nogueira"
      );
      if (footerDevPrefix && foot.developerPrefix != null) {
        setText(footerDevPrefix, foot.developerPrefix);
      }
      footerDevWrap.hidden = false;
    } else {
      footerDevWrap.hidden = true;
    }
  }

  window.__FREVO_SITE_CONTENT__ = data;
  return data;
}
