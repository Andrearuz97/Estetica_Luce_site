const yearSpan = document.getElementById("current-year");
const hamburgerToggle = document.getElementById("hamburger-toggle");
const navLinks = document.querySelector(".nav-links");
const scrollTopBtn = document.getElementById("scroll-top-btn");

yearSpan.textContent = new Date().getFullYear();

const setMenuState = (isOpen) => {
    hamburgerToggle.classList.toggle("active", isOpen);
    navLinks.classList.toggle("active", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    hamburgerToggle.setAttribute("aria-expanded", String(isOpen));
    hamburgerToggle.setAttribute("aria-label", isOpen ? "Chiudi menu" : "Apri menu");
};

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

const updateScrollTopButton = () => {
    scrollTopBtn.classList.toggle("show", window.scrollY > 300);
};

updateScrollTopButton();
window.addEventListener("scroll", updateScrollTopButton, { passive: true });
scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

const galleryCarousel = document.querySelector("[data-gallery-carousel]");

if (galleryCarousel) {
    const galleryViewport = galleryCarousel.querySelector("[data-carousel-viewport]");
    const galleryTrack = galleryCarousel.querySelector(".gallery-track");
    const gallerySlides = [...galleryCarousel.querySelectorAll(".gallery-slide")];
    const galleryPrev = galleryCarousel.querySelector("[data-carousel-prev]");
    const galleryNext = galleryCarousel.querySelector("[data-carousel-next]");
    const galleryCurrent = galleryCarousel.querySelector("[data-carousel-current]");
    const galleryProgress = galleryCarousel.querySelector("[data-carousel-progress]");
    const autoplayDelay = 5500;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let autoplayTimer;

    const getGalleryStep = () => {
        const slideWidth = gallerySlides[0]?.getBoundingClientRect().width || 0;
        const gap = parseFloat(window.getComputedStyle(galleryTrack).columnGap) || 0;
        return slideWidth + gap;
    };

    const updateGalleryState = () => {
        const step = getGalleryStep();
        const currentIndex = step ? Math.round(galleryViewport.scrollLeft / step) : 0;
        const isAtEnd = galleryViewport.scrollLeft + galleryViewport.clientWidth >= galleryViewport.scrollWidth - 2;

        galleryCurrent.textContent = String(Math.min(currentIndex + 1, gallerySlides.length)).padStart(2, "0");
        gallerySlides.forEach((slide, index) => slide.classList.toggle("is-active", index === currentIndex));
        galleryPrev.disabled = galleryViewport.scrollLeft <= 2;
        galleryNext.disabled = isAtEnd;
    };

    const moveGallery = (direction) => {
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
            const isAtEnd = galleryViewport.scrollLeft + galleryViewport.clientWidth >= galleryViewport.scrollWidth - 2;

            if (isAtEnd) {
                galleryViewport.scrollTo({ left: 0, behavior: "smooth" });
            } else {
                moveGallery(1);
            }

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
