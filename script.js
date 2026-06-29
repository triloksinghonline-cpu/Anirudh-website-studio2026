const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");
const backToTop = document.querySelector(".back-to-top");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const updateScrollUI = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progress) {
    progress.style.width = `${percent}%`;
  }

  if (header) {
    header.classList.toggle("scrolled", scrollTop > 24);
  }

  if (backToTop) {
    backToTop.classList.toggle("visible", scrollTop > 500);
  }
};

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

document.querySelectorAll(".btn").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    button.style.setProperty("--x", `${event.clientX - rect.left}px`);
    button.style.setProperty("--y", `${event.clientY - rect.top}px`);
  });
});

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

const counters = document.querySelectorAll("[data-count]");
if ("IntersectionObserver" in window && counters.length) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = Number(counter.dataset.count);
        const suffix = counter.dataset.suffix || "";
        const duration = 1200;
        const start = performance.now();

        const tick = (now) => {
          const progressValue = Math.min((now - start) / duration, 1);
          counter.textContent = `${Math.floor(target * progressValue)}${suffix}`;
          if (progressValue < 1) {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
        counterObserver.unobserve(counter);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

document.querySelectorAll(".faq-question").forEach((question) => {
  question.addEventListener("click", () => {
    const item = question.closest(".faq-item");
    const answer = item.querySelector(".faq-answer");
    const isOpen = item.classList.toggle("open");

    answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : "0px";
    question.setAttribute("aria-expanded", String(isOpen));
  });
});

const placeholderTrack = document.querySelector(".placeholder-testimonial-track");
if (placeholderTrack) {
  let placeholderSlide = 0;
  const cards = placeholderTrack.querySelectorAll(".placeholder-testimonial");

  setInterval(() => {
    if (!cards.length) return;
    const visible = window.innerWidth < 640 ? 1 : window.innerWidth < 980 ? 2 : 3;
    const maxSlide = Math.max(cards.length - visible, 0);
    placeholderSlide = placeholderSlide >= maxSlide ? 0 : placeholderSlide + 1;
    const cardWidth = cards[0].getBoundingClientRect().width + 18;
    placeholderTrack.style.transform = `translateX(-${placeholderSlide * cardWidth}px)`;
  }, 3800);
}

const contactForm = document.querySelector("#contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#name").value.trim();
    const phone = document.querySelector("#phone").value.trim();
    const message = document.querySelector("#message").value.trim();

    const text = `Hello Anirudh Singh, I want a website design.\n\nName: ${name}\nPhone: ${phone}\nMessage: ${message}`;
    window.open(`https://wa.me/919467165134?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}

const renderIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

renderIcons();
window.addEventListener("DOMContentLoaded", renderIcons);
window.addEventListener("load", renderIcons);
