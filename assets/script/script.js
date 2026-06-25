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
