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
