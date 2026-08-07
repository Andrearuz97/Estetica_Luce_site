const yearSpan = document.getElementById("current-year");
const hamburgerToggle = document.getElementById("hamburger-toggle");
const navLinks = document.querySelector(".nav-links");
const scrollTopBtn = document.getElementById("scroll-top-btn");
const pageLanguage = document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "it";
const cookieConsentKey = "esteticaLuceCookieConsent";
const menuLabels = {
    it: { open: "Apri menu", close: "Chiudi menu" },
    en: { open: "Open menu", close: "Close menu" },
};

if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

const setMenuState = (isOpen) => {
    hamburgerToggle.classList.toggle("active", isOpen);
    navLinks.classList.toggle("active", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    hamburgerToggle.setAttribute("aria-expanded", String(isOpen));
    hamburgerToggle.setAttribute("aria-label", isOpen ? menuLabels[pageLanguage].close : menuLabels[pageLanguage].open);
};

if (hamburgerToggle && navLinks) {
    hamburgerToggle.addEventListener("click", () => {
        setMenuState(!navLinks.classList.contains("active"));
    });

    navLinks.querySelectorAll("a").forEach((item) => {
        item.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenuState(false);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 992) setMenuState(false);
    });
}

const setupPageTransitions = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const transitionDuration = 180;
    let navigationLocked = false;

    const normalizePath = (pathname) => {
        const withoutIndex = pathname.replace(/\/index\.html$/i, "/");
        return withoutIndex.endsWith("/") ? withoutIndex : `${withoutIndex}/`;
    };

    const isSameDocument = (url) => (
        url.origin === window.location.origin
        && normalizePath(url.pathname) === normalizePath(window.location.pathname)
        && url.search === window.location.search
    );

    const getHashTarget = (url) => {
        if (!url.hash) return document.getElementById("home") || document.body;

        try {
            return document.getElementById(decodeURIComponent(url.hash.slice(1)));
        } catch {
            return document.getElementById(url.hash.slice(1));
        }
    };

    const jumpToTarget = (target, url) => {
        const headerOffset = document.querySelector(".main-header")?.offsetHeight || 0;
        const targetTop = target === document.body || target.id === "home"
            ? 0
            : target.getBoundingClientRect().top + window.scrollY - headerOffset - 8;

        window.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });

        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextUrl !== currentUrl) history.pushState(null, "", nextUrl);
    };

    const revealCurrentPage = () => {
        navigationLocked = false;
        document.body.classList.remove("is-navigation-fading");
    };

    window.addEventListener("pageshow", revealCurrentPage);

    document.addEventListener("click", (event) => {
        const clickedElement = event.target instanceof Element ? event.target : null;
        const link = clickedElement?.closest("a[href]");
        if (!link || event.defaultPrevented || navigationLocked) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.hasAttribute("download") || link.target === "_blank" || link.dataset.noTransition !== undefined) return;

        let url;
        try {
            url = new URL(link.href, window.location.href);
        } catch {
            return;
        }

        if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return;

        const sameDocument = isSameDocument(url);
        const target = sameDocument ? getHashTarget(url) : null;
        if (sameDocument && !target) return;

        event.preventDefault();
        if (hamburgerToggle && navLinks) setMenuState(false);

        if (reducedMotion.matches) {
            if (sameDocument) jumpToTarget(target, url);
            else window.location.assign(url.href);
            return;
        }

        navigationLocked = true;
        document.body.classList.add("is-navigation-fading");

        window.setTimeout(() => {
            if (!sameDocument) {
                window.location.assign(url.href);
                return;
            }

            jumpToTarget(target, url);
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(revealCurrentPage);
            });
        }, transitionDuration);
    });
};

setupPageTransitions();

const setupActiveNavLinks = () => {
    if (!navLinks) return;

    const sectionLinks = [...navLinks.querySelectorAll('a[href^="#"]')]
        .map((link) => {
            const sectionId = decodeURIComponent(link.hash.slice(1));
            const section = sectionId ? document.getElementById(sectionId) : null;
            return section ? { link, section } : null;
        })
        .filter(Boolean);

    if (sectionLinks.length < 2) return;

    const setActiveLink = (activeLink) => {
        sectionLinks.forEach(({ link }) => {
            link.classList.toggle("is-active", link === activeLink);
        });
    };

    const updateActiveLink = () => {
        const headerOffset = document.querySelector(".main-header")?.offsetHeight || 0;
        const probeY = window.scrollY + headerOffset + Math.min(window.innerHeight * 0.28, 190);
        let activeLink = sectionLinks[0].link;

        sectionLinks.forEach(({ link, section }) => {
            if (section.offsetTop <= probeY) {
                activeLink = link;
            }
        });

        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            activeLink = sectionLinks[sectionLinks.length - 1].link;
        }

        setActiveLink(activeLink);
    };

    sectionLinks.forEach(({ link }) => {
        link.addEventListener("click", () => setActiveLink(link));
    });

    updateActiveLink();
    window.addEventListener("scroll", updateActiveLink, { passive: true });
    window.addEventListener("resize", updateActiveLink);
};

setupActiveNavLinks();

const setupHeaderState = () => {
    const header = document.querySelector(".main-header");
    if (!header) return;

    const updateHeaderState = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
};

setupHeaderState();

const setupScrollReveals = () => {
    const revealSelectors = [
        ".manifesto-section .container-small",
        ".experiences-section > .section-header",
        ".ritual-row",
        ".pillars-container > .pillar-card",
        ".gallery-section > .section-header",
        ".gallery-carousel",
        ".before-after-section > .section-header",
        ".before-after-grid > .before-after-card",
        ".before-after-note",
        ".reviews-heading",
        ".reviews-carousel",
        ".reviews-footer",
        ".social-header-block",
        ".social-luxury-grid > .social-card-link",
        ".products-intro-copy",
        ".products-intro-image",
        ".marzia-products-intro",
        ".marzia-line-grid > .marzia-line-card",
        ".marzia-products-note",
        ".products-cta-band > *",
        ".treatment-intro-copy",
        ".treatment-needs > .treatment-need",
        ".treatment-catalog-heading",
        ".treatment-filters",
        ".treatment-card-grid > .treatment-card",
        ".treatment-catalog-note",
        ".treatment-products-link > *",
        ".contact-container",
        ".legal-page-header",
        ".legal-content",
        ".footer-main-grid > *",
        ".footer-divider",
    ];

    const elements = [...new Set(revealSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
    if (!elements.length) return;

    const delayByParent = new Map();

    elements.forEach((element) => {
        const parent = element.parentElement;
        const siblingIndex = delayByParent.get(parent) || 0;
        delayByParent.set(parent, siblingIndex + 1);

        element.classList.add("reveal-on-scroll");
        element.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 35, 140)}ms`);
    });

    const revealElement = (element) => {
        element.classList.add("is-revealed");
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
        elements.forEach(revealElement);
        return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            revealElement(entry.target);
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
    });

    elements.forEach((element) => revealObserver.observe(element));
};

setupScrollReveals();

const setupTreatmentFilters = () => {
    const buttons = [...document.querySelectorAll("[data-treatment-filter]")];
    const needButtons = [...document.querySelectorAll("[data-treatment-need]")];
    const cards = [...document.querySelectorAll("[data-treatment-card]")];
    const status = document.querySelector("[data-treatment-status]");
    const viewShareButton = document.querySelector("[data-treatment-view-share]");

    if (!buttons.length || !cards.length) return;

    const statusLabels = {
        it: (count) => `${count} ${count === 1 ? "trattamento" : "trattamenti"} da scoprire`,
        en: (count) => `${count} ${count === 1 ? "treatment" : "treatments"} to discover`,
    };
    const needStatusLabels = {
        it: (count, need) => `${count} ${count === 1 ? "trattamento" : "trattamenti"} per “${need}”`,
        en: (count, need) => `${count} ${count === 1 ? "treatment" : "treatments"} for “${need}”`,
    };
    const treatmentNeedMap = [
        ["radiance"],
        ["radiance", "hydration", "firmness"],
        ["radiance", "firmness"],
        ["radiance"],
        [],
        ["hydration"],
        ["lightness", "drainage"],
        ["lightness", "drainage"],
        ["lightness", "drainage", "firmness"],
        ["firmness"],
        ["lightness", "drainage"],
        ["lightness", "drainage"],
        ["lightness", "drainage", "relaxation"],
        ["drainage", "relaxation"],
        ["relaxation"],
        ["hydration", "relaxation"],
        ["lightness", "drainage", "firmness"],
        ["relaxation"],
    ];
    const guideRouting = {
        it: {
            categoryParam: "categoria",
            needParam: "esigenza",
            catalogHash: "catalogo",
            categories: { viso: "viso", corpo: "corpo", pressoterapia: "pressoterapia", massaggi: "massaggi" },
            needs: {
                radiance: "luminosita",
                hydration: "idratazione",
                lightness: "leggerezza",
                firmness: "compattezza",
                drainage: "drenaggio",
                relaxation: "relax",
            },
        },
        en: {
            categoryParam: "category",
            needParam: "need",
            catalogHash: "catalogue",
            categories: { viso: "face", corpo: "body", pressoterapia: "pressotherapy", massaggi: "massage" },
            needs: {
                radiance: "radiance",
                hydration: "hydration",
                lightness: "lightness",
                firmness: "firmness",
                drainage: "drainage",
                relaxation: "relaxation",
            },
        },
    };
    const viewShareLabels = {
        it: {
            button: "Condividi questa selezione",
            copied: "Link copiato",
            title: (selection) => `Trattamenti: ${selection} | Estetica Luce`,
            text: (selection) => `Guarda i trattamenti della selezione “${selection}” di Estetica Luce.`,
        },
        en: {
            button: "Share this selection",
            copied: "Link copied",
            title: (selection) => `Treatments: ${selection} | Estetica Luce`,
            text: (selection) => `View the “${selection}” treatment selection from Estetica Luce.`,
        },
    };
    const route = guideRouting[pageLanguage];
    const shareLabels = {
        it: {
            group: "Condividi questo trattamento",
            copy: "Copia link",
            copied: "Link copiato",
            copyAria: (name) => `Copia il link diretto a ${name}`,
            whatsappAria: (name) => `Invia ${name} su WhatsApp`,
            message: (name, url) => `Guarda il trattamento “${name}” di Estetica Luce: ${url}`,
            fallback: "Copia questo link:",
        },
        en: {
            group: "Share this treatment",
            copy: "Copy link",
            copied: "Link copied",
            copyAria: (name) => `Copy the direct link to ${name}`,
            whatsappAria: (name) => `Send ${name} on WhatsApp`,
            message: (name, url) => `Take a look at the “${name}” treatment at Estetica Luce: ${url}`,
            fallback: "Copy this link:",
        },
    };
    const labels = shareLabels[pageLanguage];

    const slugify = (value) => value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\+/g, " plus ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const getTreatmentName = (card) => {
        const heading = card.querySelector("h3");
        if (!heading) return "";

        const headingCopy = heading.cloneNode(true);
        headingCopy.querySelectorAll("small").forEach((item) => item.remove());
        return headingCopy.textContent.replace(/\s+/g, " ").trim();
    };

    const getDirectUrl = (card) => {
        const url = new URL(window.location.href);
        url.search = "";
        url.hash = card.id;
        return url.href;
    };

    const copyLink = async (value) => {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return;
        }

        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Copy not available");
    };

    const getInternalRouteValue = (values, publicValue) => Object.entries(values)
        .find(([, value]) => value === publicValue)?.[0];

    const updateGuideUrl = (type, value) => {
        const url = new URL(window.location.href);
        url.search = "";

        if (type === "category" && value !== "all") {
            url.searchParams.set(route.categoryParam, route.categories[value]);
        }

        if (type === "need") {
            url.searchParams.set(route.needParam, route.needs[value]);
        }

        url.hash = route.catalogHash;
        window.history.replaceState(null, "", url.href);
    };

    const updateViewShareButton = (selection = "") => {
        if (!viewShareButton) return;

        viewShareButton.hidden = !selection;
        viewShareButton.dataset.selection = selection;
        const label = viewShareButton.querySelector("span");
        if (label) label.textContent = viewShareLabels[pageLanguage].button;
    };

    if (viewShareButton) {
        let shareFeedbackTimer;

        viewShareButton.addEventListener("click", async () => {
            const selection = viewShareButton.dataset.selection;
            const buttonLabel = viewShareButton.querySelector("span");
            const shareData = {
                title: viewShareLabels[pageLanguage].title(selection),
                text: viewShareLabels[pageLanguage].text(selection),
                url: window.location.href,
            };

            window.clearTimeout(shareFeedbackTimer);

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    return;
                }

                await copyLink(shareData.url);
                viewShareButton.classList.add("is-copied");
                if (buttonLabel) buttonLabel.textContent = viewShareLabels[pageLanguage].copied;
                shareFeedbackTimer = window.setTimeout(() => {
                    viewShareButton.classList.remove("is-copied");
                    if (buttonLabel) buttonLabel.textContent = viewShareLabels[pageLanguage].button;
                }, 2200);
            } catch (error) {
                if (error?.name !== "AbortError") window.prompt(labels.fallback, shareData.url);
            }
        });
    }

    const usedIds = new Set([...document.querySelectorAll("[id]")].map((element) => element.id));

    cards.forEach((card, index) => {
        const treatmentName = getTreatmentName(card) || `${pageLanguage === "en" ? "treatment" : "trattamento"}-${index + 1}`;
        const baseId = slugify(treatmentName) || `treatment-${index + 1}`;
        let cardId = baseId;
        let duplicateIndex = 2;

        while (usedIds.has(cardId)) {
            cardId = `${baseId}-${duplicateIndex}`;
            duplicateIndex += 1;
        }

        card.id = cardId;
        card.dataset.needs = treatmentNeedMap[index]?.join(" ") || "";
        usedIds.add(cardId);

        const directUrl = getDirectUrl(card);
        const actions = document.createElement("div");
        actions.className = "treatment-card-share";
        actions.setAttribute("role", "group");
        actions.setAttribute("aria-label", labels.group);

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "treatment-share-action";
        copyButton.setAttribute("aria-label", labels.copyAria(treatmentName));
        copyButton.innerHTML = `<i class="fa-solid fa-link" aria-hidden="true"></i><span aria-live="polite">${labels.copy}</span>`;

        const whatsappLink = document.createElement("a");
        whatsappLink.className = "treatment-share-action";
        whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(labels.message(treatmentName, directUrl))}`;
        whatsappLink.target = "_blank";
        whatsappLink.rel = "noopener";
        whatsappLink.setAttribute("aria-label", labels.whatsappAria(treatmentName));
        whatsappLink.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i><span>WhatsApp</span>';

        let feedbackTimer;
        copyButton.addEventListener("click", async () => {
            const copyLabel = copyButton.querySelector("span");
            window.clearTimeout(feedbackTimer);

            try {
                await copyLink(directUrl);
                copyButton.classList.add("is-copied");
                copyLabel.textContent = labels.copied;
                feedbackTimer = window.setTimeout(() => {
                    copyButton.classList.remove("is-copied");
                    copyLabel.textContent = labels.copy;
                }, 2200);
            } catch {
                window.prompt(labels.fallback, directUrl);
            }
        });

        actions.append(copyButton, whatsappLink);
        card.appendChild(actions);
    });

    const selectFilter = (selectedButton, { updateUrl = true } = {}) => {
        const filter = selectedButton.dataset.treatmentFilter;
        const selectedLabel = selectedButton.textContent.trim();
        let visibleCount = 0;

        needButtons.forEach((button) => {
            button.classList.remove("is-active");
            button.setAttribute("aria-pressed", "false");
        });

        buttons.forEach((button) => {
            const isSelected = button === selectedButton;
            button.classList.toggle("is-active", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });

        cards.forEach((card) => {
            const isVisible = filter === "all" || card.dataset.category === filter;
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        if (status) status.textContent = statusLabels[pageLanguage](visibleCount);
        updateViewShareButton(filter === "all" ? "" : selectedLabel);
        if (updateUrl) updateGuideUrl("category", filter);
    };

    buttons.forEach((button) => button.addEventListener("click", () => selectFilter(button)));

    const selectNeed = (selectedButton, { updateUrl = true, scroll = true } = {}) => {
        const selectedNeed = selectedButton.dataset.treatmentNeed;
        const selectedLabel = selectedButton.textContent.trim();
        let visibleCount = 0;

        buttons.forEach((button) => {
            button.classList.remove("is-active");
            button.setAttribute("aria-pressed", "false");
        });

        needButtons.forEach((button) => {
            const isSelected = button === selectedButton;
            button.classList.toggle("is-active", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });

        cards.forEach((card) => {
            const isVisible = card.dataset.needs.split(" ").includes(selectedNeed);
            card.hidden = !isVisible;
            card.classList.remove("is-linked");
            if (isVisible) visibleCount += 1;
        });

        if (status) status.textContent = needStatusLabels[pageLanguage](visibleCount, selectedLabel);
        updateViewShareButton(selectedLabel);
        if (updateUrl) updateGuideUrl("need", selectedNeed);

        if (scroll) {
            document.querySelector(".treatment-catalog-heading")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                block: "start",
            });
        }
    };

    needButtons.forEach((button) => button.addEventListener("click", () => selectNeed(button)));

    const initialParams = new URLSearchParams(window.location.search);
    const initialNeed = getInternalRouteValue(route.needs, initialParams.get(route.needParam));
    const initialCategory = getInternalRouteValue(route.categories, initialParams.get(route.categoryParam));

    if (initialNeed) {
        const initialNeedButton = needButtons.find((button) => button.dataset.treatmentNeed === initialNeed);
        if (initialNeedButton) selectNeed(initialNeedButton, { updateUrl: false, scroll: false });
    } else if (initialCategory) {
        const initialCategoryButton = buttons.find((button) => button.dataset.treatmentFilter === initialCategory);
        if (initialCategoryButton) selectFilter(initialCategoryButton, { updateUrl: false });
    }

    const revealLinkedTreatment = (smooth = true) => {
        let hashId;

        try {
            hashId = decodeURIComponent(window.location.hash.slice(1));
        } catch {
            hashId = window.location.hash.slice(1);
        }

        const linkedCard = hashId ? document.getElementById(hashId) : null;
        if (!linkedCard?.matches("[data-treatment-card]")) return;

        if (linkedCard.hidden) {
            const allButton = buttons.find((button) => button.dataset.treatmentFilter === "all");
            if (allButton) selectFilter(allButton, { updateUrl: false });
        }

        cards.forEach((card) => card.classList.toggle("is-linked", card === linkedCard));
        const details = linkedCard.querySelector("details");
        if (details) details.open = true;

        linkedCard.tabIndex = -1;
        window.requestAnimationFrame(() => {
            linkedCard.scrollIntoView({
                behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto",
                block: "start",
            });
            linkedCard.focus({ preventScroll: true });
        });
    };

    revealLinkedTreatment(false);
    window.addEventListener("hashchange", () => revealLinkedTreatment(true));
};

setupTreatmentFilters();

const updateScrollTopButton = () => {
    scrollTopBtn.classList.toggle("show", window.scrollY > 300);
};

if (scrollTopBtn) {
    updateScrollTopButton();
    window.addEventListener("scroll", updateScrollTopButton, { passive: true });
    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

const cookieTexts = {
    it: {
        title: "Cookie e contenuti esterni",
        message: "Usiamo cookie tecnici per far funzionare il sito. Con Accetta tutto abiliti anche contenuti esterni, come la mappa Google, che possono usare cookie propri.",
        accept: "Accetta tutto",
        essential: "Solo necessari",
        policy: "Cookie Policy",
        mapTitle: "Carica la mappa",
        mapText: "La mappa Google viene caricata solo dopo il consenso ai contenuti esterni.",
        mapButton: "Accetta e carica mappa",
    },
    en: {
        title: "Cookies and external content",
        message: "We use technical cookies to keep the website working. By choosing Accept all, you also enable external content such as Google Maps, which may use its own cookies.",
        accept: "Accept all",
        essential: "Necessary only",
        policy: "Cookie Policy",
        mapTitle: "Load the map",
        mapText: "Google Maps is loaded only after consent for external content.",
        mapButton: "Accept and load map",
    },
};

const getCookieConsent = () => {
    try {
        return window.localStorage.getItem(cookieConsentKey);
    } catch (error) {
        return null;
    }
};

const setCookieConsent = (value) => {
    try {
        window.localStorage.setItem(cookieConsentKey, value);
    } catch (error) {
        // The banner still closes if localStorage is unavailable.
    }
};

const loadCookieControlledContent = () => {
    document.querySelectorAll("[data-cookie-src]").forEach((item) => {
        if (!item.getAttribute("src")) {
            item.setAttribute("src", item.dataset.cookieSrc);
        }

        item.classList.remove("is-deferred");
        item.closest(".map-section")?.classList.remove("has-cookie-pending");
    });
};

const updateCookieControlledContent = () => {
    const consent = getCookieConsent();

    if (consent === "all") {
        loadCookieControlledContent();
        return;
    }

    document.querySelectorAll("[data-cookie-src]").forEach((item) => {
        item.removeAttribute("src");
        item.classList.add("is-deferred");
        item.closest(".map-section")?.classList.add("has-cookie-pending");
    });
};

const createCookieBanner = () => {
    if (document.querySelector("[data-cookie-banner]")) return;

    const texts = cookieTexts[pageLanguage];
    const policyLink = document.querySelector("[data-cookie-policy-link]")?.getAttribute("href") || "#";
    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.setAttribute("data-cookie-banner", "");
    banner.setAttribute("aria-label", texts.title);
    banner.innerHTML = `
        <h2>${texts.title}</h2>
        <p>${texts.message}</p>
        <div class="cookie-banner-actions">
            <button type="button" class="btn-luxury" data-cookie-accept-all>${texts.accept}</button>
            <button type="button" class="btn-luxury btn-luxury-secondary" data-cookie-essential>${texts.essential}</button>
            <a href="${policyLink}" class="cookie-link-button">${texts.policy}</a>
        </div>
    `;

    document.body.appendChild(banner);

    banner.querySelector("[data-cookie-accept-all]").addEventListener("click", () => {
        setCookieConsent("all");
        banner.hidden = true;
        loadCookieControlledContent();
    });

    banner.querySelector("[data-cookie-essential]").addEventListener("click", () => {
        setCookieConsent("essential");
        banner.hidden = true;
        updateCookieControlledContent();
    });
};

const setupCookieConsent = () => {
    const texts = cookieTexts[pageLanguage];

    document.querySelectorAll("[data-map-consent-title]").forEach((item) => {
        item.textContent = texts.mapTitle;
    });

    document.querySelectorAll("[data-map-consent-text]").forEach((item) => {
        item.textContent = texts.mapText;
    });

    document.querySelectorAll("[data-cookie-accept-map]").forEach((item) => {
        item.textContent = texts.mapButton;
        item.addEventListener("click", () => {
            setCookieConsent("all");
            document.querySelector("[data-cookie-banner]")?.setAttribute("hidden", "");
            loadCookieControlledContent();
        });
    });

    document.querySelectorAll("[data-cookie-reset]").forEach((item) => {
        item.addEventListener("click", () => {
            try {
                window.localStorage.removeItem(cookieConsentKey);
            } catch (error) {
                // Ignore storage errors.
            }

            updateCookieControlledContent();
            createCookieBanner();
            document.querySelector("[data-cookie-banner]")?.removeAttribute("hidden");
        });
    });

    updateCookieControlledContent();

    if (!getCookieConsent()) {
        createCookieBanner();
    }
};

setupCookieConsent();

const setupGalleryCarousel = ({
    carousel,
    viewportSelector,
    trackSelector,
    itemSelector,
    prevSelector,
    nextSelector,
    currentSelector,
    progressSelector,
    autoplayDelay,
    activeClass,
}) => {
    if (!carousel) return;

    const viewport = carousel.querySelector(viewportSelector);
    const track = carousel.querySelector(trackSelector);
    const originalItems = [...carousel.querySelectorAll(itemSelector)];
    const previousButton = carousel.querySelector(prevSelector);
    const nextButton = carousel.querySelector(nextSelector);
    const currentLabel = carousel.querySelector(currentSelector);
    const progress = carousel.querySelector(progressSelector);

    if (!viewport || !track || !originalItems.length || !previousButton || !nextButton || !currentLabel || !progress) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cloneCount = originalItems.length > 1 ? Math.min(2, originalItems.length) : 0;
    const transitionMs = prefersReducedMotion ? 0 : 720;
    let trackIndex = cloneCount;
    let currentRealIndex = 0;
    let autoplayTimer;
    let transitionTimer;
    let isAnimating = false;
    let isPointerDown = false;
    let didDrag = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerStartTime = 0;
    let dragVelocity = 0;
    let lastPointerX = 0;
    let lastPointerTime = 0;
    let dragOffset = 0;
    let wheelDelta = 0;
    let wheelResetTimer;
    let lastWheelMoveAt = 0;

    carousel.style.setProperty("--carousel-timer-duration", `${autoplayDelay}ms`);

    const makeClone = (item) => {
        const clone = item.cloneNode(true);
        if (activeClass) clone.classList.remove(activeClass);
        clone.classList.add("is-carousel-clone");
        clone.setAttribute("aria-hidden", "true");
        return clone;
    };

    if (cloneCount) {
        originalItems.slice(-cloneCount).reverse().forEach((item) => {
            track.insertBefore(makeClone(item), track.firstChild);
        });

        originalItems.slice(0, cloneCount).forEach((item) => {
            track.appendChild(makeClone(item));
        });
    }

    const items = [...track.querySelectorAll(itemSelector)];

    const getGap = () => parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const getStep = () => {
        const firstItem = items[0];
        return firstItem ? firstItem.offsetWidth + getGap() : 0;
    };

    const normalizeIndex = (index) => {
        const shiftedIndex = index - cloneCount;
        return ((shiftedIndex % originalItems.length) + originalItems.length) % originalItems.length;
    };

    const getTranslateX = (index) => -(index * getStep());

    const setPosition = (index, animate = true, offset = 0) => {
        track.style.transition = animate && transitionMs
            ? `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : "none";
        track.style.transform = `translate3d(${getTranslateX(index) + offset}px, 0, 0)`;
    };

    const updateState = () => {
        currentRealIndex = normalizeIndex(trackIndex);
        currentLabel.textContent = String(currentRealIndex + 1).padStart(2, "0");

        if (activeClass) {
            items.forEach((item, index) => {
                item.classList.toggle(activeClass, normalizeIndex(index) === currentRealIndex);
            });
        }

        previousButton.disabled = originalItems.length <= 1;
        nextButton.disabled = originalItems.length <= 1;
    };

    const clearTransitionFallback = () => {
        window.clearTimeout(transitionTimer);
    };

    const finishTransition = () => {
        clearTransitionFallback();

        if (trackIndex >= cloneCount + originalItems.length) {
            trackIndex = cloneCount;
            setPosition(trackIndex, false);
        } else if (trackIndex < cloneCount) {
            trackIndex = cloneCount + originalItems.length - 1;
            setPosition(trackIndex, false);
        }

        updateState();
        isAnimating = false;
    };

    const armTransitionFallback = () => {
        clearTransitionFallback();
        transitionTimer = window.setTimeout(finishTransition, transitionMs + 80);
    };

    const move = (direction) => {
        if (originalItems.length <= 1 || isAnimating) return false;

        isAnimating = true;
        trackIndex += direction;
        setPosition(trackIndex, true);
        updateState();

        if (transitionMs) {
            armTransitionFallback();
        } else {
            finishTransition();
        }

        return true;
    };

    const resetProgressAnimation = () => {
        carousel.classList.remove("is-timing");
        void progress.offsetWidth;
        carousel.classList.add("is-timing");
    };

    const pauseAutoplay = () => {
        window.clearTimeout(autoplayTimer);
        carousel.classList.add("is-paused");
    };

    const startAutoplay = () => {
        window.clearTimeout(autoplayTimer);

        if (prefersReducedMotion || document.hidden || originalItems.length <= 1) {
            carousel.classList.add("is-autoplay-disabled");
            return;
        }

        carousel.classList.remove("is-paused", "is-autoplay-disabled");
        resetProgressAnimation();
        autoplayTimer = window.setTimeout(() => {
            move(1);
            startAutoplay();
        }, autoplayDelay);
    };

    const moveManually = (direction) => {
        move(direction);
        startAutoplay();
    };

    const scheduleWheelReset = () => {
        window.clearTimeout(wheelResetTimer);
        wheelResetTimer = window.setTimeout(() => {
            wheelDelta = 0;
            startAutoplay();
        }, transitionMs + 260);
    };

    const handleWheel = (event) => {
        const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.shiftKey
                ? event.deltaY
                : 0;

        if (!horizontalDelta) return;

        event.preventDefault();
        pauseAutoplay();

        if (isAnimating || originalItems.length <= 1) {
            scheduleWheelReset();
            return;
        }

        const now = Date.now();
        const wheelCooldown = transitionMs + 180;

        if (now - lastWheelMoveAt < wheelCooldown) {
            scheduleWheelReset();
            return;
        }

        wheelDelta += horizontalDelta;

        const threshold = Math.min(220, Math.max(120, viewport.clientWidth * 0.22));

        if (Math.abs(wheelDelta) >= threshold) {
            const direction = wheelDelta > 0 ? 1 : -1;
            wheelDelta = 0;
            lastWheelMoveAt = now;
            move(direction);
        }

        scheduleWheelReset();
    };

    const endDrag = () => {
        if (!isPointerDown) return;

        isPointerDown = false;
        carousel.classList.remove("is-dragging");

        const threshold = Math.min(64, Math.max(24, viewport.clientWidth * 0.075));
        const isQuickFlick = Math.abs(dragVelocity) > 0.26
            && performance.now() - pointerStartTime < 500;

        if (didDrag && (Math.abs(dragOffset) >= threshold || isQuickFlick)) {
            move(dragOffset < 0 ? 1 : -1);
        } else if (didDrag) {
            isAnimating = true;
            setPosition(trackIndex, true);
            armTransitionFallback();
        }

        didDrag = false;
        dragOffset = 0;
        dragVelocity = 0;
        startAutoplay();
    };

    previousButton.addEventListener("click", () => moveManually(-1));
    nextButton.addEventListener("click", () => moveManually(1));
    track.addEventListener("transitionend", (event) => {
        if (event.target === track && event.propertyName === "transform") {
            finishTransition();
        }
    });
    viewport.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveManually(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            moveManually(1);
        }
    });
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    viewport.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary || isAnimating) return;

        pauseAutoplay();
        isPointerDown = true;
        didDrag = false;
        dragOffset = 0;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        pointerStartTime = performance.now();
        lastPointerX = event.clientX;
        lastPointerTime = pointerStartTime;
        dragVelocity = 0;
        viewport.setPointerCapture?.(event.pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
        if (!isPointerDown) return;

        const deltaX = event.clientX - pointerStartX;
        const deltaY = event.clientY - pointerStartY;

        if (Math.abs(deltaX) <= 6 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

        event.preventDefault();
        didDrag = true;
        const now = performance.now();
        const elapsed = now - lastPointerTime;
        if (elapsed > 0) dragVelocity = (event.clientX - lastPointerX) / elapsed;
        lastPointerX = event.clientX;
        lastPointerTime = now;
        dragOffset = deltaX * 0.78;
        carousel.classList.add("is-dragging");
        setPosition(trackIndex, false, dragOffset);
    });
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("lostpointercapture", endDrag);
    carousel.addEventListener("mouseenter", pauseAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", pauseAutoplay);
    carousel.addEventListener("focusout", (event) => {
        if (!carousel.contains(event.relatedTarget)) startAutoplay();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) pauseAutoplay();
        else startAutoplay();
    });
    if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(() => setPosition(trackIndex, false));
        resizeObserver.observe(viewport);
    } else {
        window.addEventListener("resize", () => setPosition(trackIndex, false));
    }

    setPosition(trackIndex, false);
    updateState();
    window.requestAnimationFrame(startAutoplay);
};

const setupLoopingCarousel = ({
    carousel,
    viewportSelector,
    trackSelector,
    itemSelector,
    prevSelector,
    nextSelector,
    currentSelector,
    progressSelector,
    autoplayDelay,
    activeClass,
}) => {
    if (!carousel) return;

    const viewport = carousel.querySelector(viewportSelector);
    const track = carousel.querySelector(trackSelector);
    const originalItems = [...carousel.querySelectorAll(itemSelector)];
    const previousButton = carousel.querySelector(prevSelector);
    const nextButton = carousel.querySelector(nextSelector);
    const currentLabel = carousel.querySelector(currentSelector);
    const progress = carousel.querySelector(progressSelector);

    if (!viewport || !track || !originalItems.length || !previousButton || !nextButton || !currentLabel || !progress) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cloneCount = Math.min(3, originalItems.length);
    const supportsScrollEnd = "onscrollend" in viewport;
    let autoplayTimer;
    let loopCorrectionTimer;
    let currentRealIndex = 0;
    let isCorrectingLoop = false;

    const makeClone = (item) => {
        const clone = item.cloneNode(true);
        clone.classList.remove("is-active");
        clone.classList.add("is-carousel-clone");
        clone.setAttribute("aria-hidden", "true");
        return clone;
    };

    originalItems.slice(-cloneCount).reverse().forEach((item) => {
        track.insertBefore(makeClone(item), track.firstChild);
    });

    originalItems.slice(0, cloneCount).forEach((item) => {
        track.appendChild(makeClone(item));
    });

    const items = [...track.querySelectorAll(itemSelector)];

    const getStep = () => {
        if (items.length > 1) {
            const firstItemLeft = items[0].getBoundingClientRect().left;
            const secondItemLeft = items[1].getBoundingClientRect().left;
            const measuredStep = Math.abs(secondItemLeft - firstItemLeft);

            if (measuredStep) return measuredStep;
        }

        const itemWidth = originalItems[0]?.offsetWidth || originalItems[0]?.getBoundingClientRect().width || 0;
        const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
        return itemWidth + gap;
    };

    const getTrackIndex = () => {
        const step = getStep();
        return step ? Math.round(viewport.scrollLeft / step) : cloneCount;
    };

    const normalizeIndex = (trackIndex) => {
        const shiftedIndex = trackIndex - cloneCount;
        return ((shiftedIndex % originalItems.length) + originalItems.length) % originalItems.length;
    };

    const setInstantScroll = (trackIndex) => {
        const previousScrollBehavior = viewport.style.scrollBehavior;
        const previousScrollSnapType = viewport.style.scrollSnapType;
        viewport.style.scrollBehavior = "auto";
        viewport.style.scrollSnapType = "none";
        viewport.scrollTo({ left: trackIndex * getStep(), behavior: "auto" });
        viewport.style.scrollBehavior = previousScrollBehavior;
        window.requestAnimationFrame(() => {
            viewport.style.scrollSnapType = previousScrollSnapType;
        });
    };

    const updateState = () => {
        const trackIndex = getTrackIndex();
        currentRealIndex = normalizeIndex(trackIndex);
        currentLabel.textContent = String(currentRealIndex + 1).padStart(2, "0");

        if (activeClass) {
            items.forEach((item, index) => {
                item.classList.toggle(activeClass, index === trackIndex);
            });
        }

        previousButton.disabled = originalItems.length <= 1;
        nextButton.disabled = originalItems.length <= 1;
    };

    const correctLoopPosition = () => {
        const trackIndex = getTrackIndex();
        let correctedIndex = null;

        if (trackIndex >= cloneCount + originalItems.length) {
            correctedIndex = trackIndex - originalItems.length;
        } else if (trackIndex < cloneCount) {
            correctedIndex = trackIndex + originalItems.length;
        }

        if (correctedIndex !== null) {
            isCorrectingLoop = true;
            setInstantScroll(correctedIndex);
            updateState();
            window.requestAnimationFrame(() => {
                isCorrectingLoop = false;
            });
        }
    };

    const scheduleLoopCorrection = () => {
        if (supportsScrollEnd) return;

        window.clearTimeout(loopCorrectionTimer);
        loopCorrectionTimer = window.setTimeout(correctLoopPosition, 260);
    };

    const move = (direction) => {
        viewport.scrollTo({ left: (getTrackIndex() + direction) * getStep(), behavior: "smooth" });
    };

    const resetProgressAnimation = () => {
        carousel.classList.remove("is-timing");
        void progress.offsetWidth;
        carousel.classList.add("is-timing");
    };

    const pauseAutoplay = () => {
        window.clearTimeout(autoplayTimer);
        carousel.classList.add("is-paused");
    };

    const startAutoplay = () => {
        window.clearTimeout(autoplayTimer);

        if (prefersReducedMotion || document.hidden) {
            carousel.classList.add("is-autoplay-disabled");
            return;
        }

        carousel.classList.remove("is-paused", "is-autoplay-disabled");
        resetProgressAnimation();
        autoplayTimer = window.setTimeout(() => {
            move(1);
            startAutoplay();
        }, autoplayDelay);
    };

    const moveManually = (direction) => {
        move(direction);
        startAutoplay();
    };

    previousButton.addEventListener("click", () => moveManually(-1));
    nextButton.addEventListener("click", () => moveManually(1));
    viewport.addEventListener("scroll", () => {
        if (isCorrectingLoop) return;

        updateState();
        scheduleLoopCorrection();
    }, { passive: true });
    if (supportsScrollEnd) {
        viewport.addEventListener("scrollend", correctLoopPosition);
    }
    viewport.addEventListener("pointerdown", pauseAutoplay);
    viewport.addEventListener("pointerup", startAutoplay);
    viewport.addEventListener("pointercancel", startAutoplay);
    viewport.addEventListener("touchstart", pauseAutoplay, { passive: true });
    viewport.addEventListener("touchend", startAutoplay, { passive: true });
    viewport.addEventListener("touchcancel", startAutoplay, { passive: true });
    carousel.addEventListener("mouseenter", pauseAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", pauseAutoplay);
    carousel.addEventListener("focusout", (event) => {
        if (!carousel.contains(event.relatedTarget)) startAutoplay();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) pauseAutoplay();
        else startAutoplay();
    });
    window.addEventListener("resize", () => {
        setInstantScroll(cloneCount + currentRealIndex);
        updateState();
    });

    window.requestAnimationFrame(() => {
        setInstantScroll(cloneCount);
        updateState();
        startAutoplay();
    });
};

setupGalleryCarousel({
    carousel: document.querySelector("[data-gallery-carousel]"),
    viewportSelector: "[data-carousel-viewport]",
    trackSelector: ".gallery-track",
    itemSelector: ".gallery-slide",
    prevSelector: "[data-carousel-prev]",
    nextSelector: "[data-carousel-next]",
    currentSelector: "[data-carousel-current]",
    progressSelector: "[data-carousel-progress]",
    autoplayDelay: 4600,
    activeClass: "is-active",
});

setupGalleryCarousel({
    carousel: document.querySelector("[data-reviews-carousel]"),
    viewportSelector: "[data-reviews-viewport]",
    trackSelector: ".reviews-grid",
    itemSelector: ".review-card",
    prevSelector: "[data-reviews-prev]",
    nextSelector: "[data-reviews-next]",
    currentSelector: "[data-reviews-current]",
    progressSelector: "[data-reviews-progress]",
    autoplayDelay: 4600,
});
