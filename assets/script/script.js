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

const galleryCarousel = document.querySelector("[data-gallery-carousel]");

if (galleryCarousel) {
    const galleryViewport = galleryCarousel.querySelector("[data-carousel-viewport]");
    const galleryTrack = galleryCarousel.querySelector(".gallery-track");
    const gallerySlides = [...galleryCarousel.querySelectorAll(".gallery-slide")];
    const galleryPrev = galleryCarousel.querySelector("[data-carousel-prev]");
    const galleryNext = galleryCarousel.querySelector("[data-carousel-next]");
    const galleryCurrent = galleryCarousel.querySelector("[data-carousel-current]");
    const galleryProgress = galleryCarousel.querySelector("[data-carousel-progress]");
    const autoplayDelay = 3500;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let autoplayTimer;

    const getGalleryStep = () => {
        const slideWidth = gallerySlides[0]?.getBoundingClientRect().width || 0;
        const gap = parseFloat(window.getComputedStyle(galleryTrack).columnGap) || 0;
        return slideWidth + gap;
    };

    const isGalleryAtStart = () => galleryViewport.scrollLeft <= 2;
    const isGalleryAtEnd = () => galleryViewport.scrollLeft + galleryViewport.clientWidth >= galleryViewport.scrollWidth - 2;

    const updateGalleryState = () => {
        const step = getGalleryStep();
        const currentIndex = step ? Math.round(galleryViewport.scrollLeft / step) : 0;

        galleryCurrent.textContent = String(Math.min(currentIndex + 1, gallerySlides.length)).padStart(2, "0");
        gallerySlides.forEach((slide, index) => slide.classList.toggle("is-active", index === currentIndex));
        galleryPrev.disabled = gallerySlides.length <= 1;
        galleryNext.disabled = gallerySlides.length <= 1;
    };

    const moveGallery = (direction) => {
        if (direction > 0 && isGalleryAtEnd()) {
            galleryViewport.scrollTo({ left: 0, behavior: "smooth" });
            return;
        }

        if (direction < 0 && isGalleryAtStart()) {
            galleryViewport.scrollTo({ left: galleryViewport.scrollWidth, behavior: "smooth" });
            return;
        }

        galleryViewport.scrollBy({ left: direction * getGalleryStep(), behavior: "smooth" });
    };

    const resetProgressAnimation = () => {
        galleryCarousel.classList.remove("is-timing");
        void galleryProgress.offsetWidth;
        galleryCarousel.classList.add("is-timing");
    };

    const pauseAutoplay = () => {
        window.clearTimeout(autoplayTimer);
        galleryCarousel.classList.add("is-paused");
    };

    const startAutoplay = () => {
        window.clearTimeout(autoplayTimer);

        if (prefersReducedMotion || document.hidden) {
            galleryCarousel.classList.add("is-autoplay-disabled");
            return;
        }

        galleryCarousel.classList.remove("is-paused", "is-autoplay-disabled");
        resetProgressAnimation();
        autoplayTimer = window.setTimeout(() => {
            moveGallery(1);
            startAutoplay();
        }, autoplayDelay);
    };

    const moveGalleryManually = (direction) => {
        moveGallery(direction);
        startAutoplay();
    };

    galleryPrev.addEventListener("click", () => moveGalleryManually(-1));
    galleryNext.addEventListener("click", () => moveGalleryManually(1));
    galleryViewport.addEventListener("scroll", updateGalleryState, { passive: true });
    galleryViewport.addEventListener("pointerdown", pauseAutoplay);
    galleryViewport.addEventListener("pointerup", startAutoplay);
    galleryViewport.addEventListener("pointercancel", startAutoplay);
    galleryCarousel.addEventListener("mouseenter", pauseAutoplay);
    galleryCarousel.addEventListener("mouseleave", startAutoplay);
    galleryCarousel.addEventListener("focusin", pauseAutoplay);
    galleryCarousel.addEventListener("focusout", (event) => {
        if (!galleryCarousel.contains(event.relatedTarget)) startAutoplay();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) pauseAutoplay();
        else startAutoplay();
    });
    window.addEventListener("resize", updateGalleryState);
    updateGalleryState();
    startAutoplay();
}

const reviewsCarousel = document.querySelector("[data-reviews-carousel]");

if (reviewsCarousel) {
    const reviewsViewport = reviewsCarousel.querySelector("[data-reviews-viewport]");
    const reviewsTrack = reviewsCarousel.querySelector(".reviews-grid");
    const reviewCards = [...reviewsCarousel.querySelectorAll(".review-card")];
    const reviewsPrev = reviewsCarousel.querySelector("[data-reviews-prev]");
    const reviewsNext = reviewsCarousel.querySelector("[data-reviews-next]");
    const reviewsCurrent = reviewsCarousel.querySelector("[data-reviews-current]");
    const reviewsProgress = reviewsCarousel.querySelector("[data-reviews-progress]");
    const reviewsAutoplayDelay = 3500;
    const reviewsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let reviewsAutoplayTimer;

    const getReviewsStep = () => {
        const cardWidth = reviewCards[0]?.getBoundingClientRect().width || 0;
        const gap = parseFloat(window.getComputedStyle(reviewsTrack).columnGap) || 0;
        return cardWidth + gap;
    };

    const isReviewsAtStart = () => reviewsViewport.scrollLeft <= 2;
    const isReviewsAtEnd = () => reviewsViewport.scrollLeft + reviewsViewport.clientWidth >= reviewsViewport.scrollWidth - 2;

    const updateReviewsState = () => {
        const step = getReviewsStep();
        const currentIndex = step ? Math.round(reviewsViewport.scrollLeft / step) : 0;
        const displayedIndex = isReviewsAtEnd() ? reviewCards.length - 1 : currentIndex;

        reviewsCurrent.textContent = String(Math.min(displayedIndex + 1, reviewCards.length)).padStart(2, "0");
        reviewsPrev.disabled = reviewCards.length <= 1;
        reviewsNext.disabled = reviewCards.length <= 1;
    };

    const moveReviews = (direction) => {
        if (direction > 0 && isReviewsAtEnd()) {
            reviewsViewport.scrollTo({ left: 0, behavior: "smooth" });
            return;
        }

        if (direction < 0 && isReviewsAtStart()) {
            reviewsViewport.scrollTo({ left: reviewsViewport.scrollWidth, behavior: "smooth" });
            return;
        }

        reviewsViewport.scrollBy({ left: direction * getReviewsStep(), behavior: "smooth" });
    };

    const resetReviewsProgress = () => {
        reviewsCarousel.classList.remove("is-timing");
        void reviewsProgress.offsetWidth;
        reviewsCarousel.classList.add("is-timing");
    };

    const pauseReviewsAutoplay = () => {
        window.clearTimeout(reviewsAutoplayTimer);
        reviewsCarousel.classList.add("is-paused");
    };

    const startReviewsAutoplay = () => {
        window.clearTimeout(reviewsAutoplayTimer);

        if (reviewsReducedMotion || document.hidden) {
            reviewsCarousel.classList.add("is-autoplay-disabled");
            return;
        }

        reviewsCarousel.classList.remove("is-paused", "is-autoplay-disabled");
        resetReviewsProgress();
        reviewsAutoplayTimer = window.setTimeout(() => {
            moveReviews(1);
            startReviewsAutoplay();
        }, reviewsAutoplayDelay);
    };

    const moveReviewsManually = (direction) => {
        moveReviews(direction);
        startReviewsAutoplay();
    };

    reviewsPrev.addEventListener("click", () => moveReviewsManually(-1));
    reviewsNext.addEventListener("click", () => moveReviewsManually(1));
    reviewsViewport.addEventListener("scroll", updateReviewsState, { passive: true });
    reviewsViewport.addEventListener("pointerdown", pauseReviewsAutoplay);
    reviewsViewport.addEventListener("pointerup", startReviewsAutoplay);
    reviewsViewport.addEventListener("pointercancel", startReviewsAutoplay);
    reviewsCarousel.addEventListener("mouseenter", pauseReviewsAutoplay);
    reviewsCarousel.addEventListener("mouseleave", startReviewsAutoplay);
    reviewsCarousel.addEventListener("focusin", pauseReviewsAutoplay);
    reviewsCarousel.addEventListener("focusout", (event) => {
        if (!reviewsCarousel.contains(event.relatedTarget)) startReviewsAutoplay();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) pauseReviewsAutoplay();
        else startReviewsAutoplay();
    });
    window.addEventListener("resize", updateReviewsState);
    updateReviewsState();
    startReviewsAutoplay();
}
