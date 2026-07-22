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
