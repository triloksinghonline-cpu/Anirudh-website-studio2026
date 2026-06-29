const REVIEW_STORAGE_KEY = "anirudhCustomerReviews";

const reviewStore = {
  all() {
    return JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "[]");
  },
  save(reviews) {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
  },
  approved() {
    return this.all()
      .filter((review) => review.status === "approved" && !review.hidden)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt) - new Date(a.createdAt));
  }
};

const starText = (rating) => "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
const escapeHtml = (value = "") => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const reviewAvatar = (review) => {
  if (review.photo) {
    return `<img src="${review.photo}" alt="${escapeHtml(review.fullName)}">`;
  }
  return `<span>${escapeHtml((review.fullName || "C").slice(0, 1).toUpperCase())}</span>`;
};

const reviewCard = (review) => `
  <article class="review-card reveal visible">
    <div class="review-card-top">
      <div class="review-avatar">${reviewAvatar(review)}</div>
      <div>
        <h3>${escapeHtml(review.fullName)}</h3>
        <p>${escapeHtml([review.businessName, review.city].filter(Boolean).join(" • ")) || "Customer"}</p>
      </div>
    </div>
    <div class="review-stars">${starText(Number(review.rating))}</div>
    <p>${escapeHtml(review.message)}</p>
    <small>${new Date(review.createdAt).toLocaleDateString()}</small>
  </article>
`;

function renderEmptyReviews(target) {
  target.innerHTML = `
    <div class="empty-reviews">
      <div class="empty-illustration"><i data-lucide="star"></i></div>
      <h3>No customer reviews yet.</h3>
      <p>Be the first customer to share your experience.</p>
    </div>
  `;
}

function renderPublicReviews() {
  const homeTarget = document.querySelector("#homeReviews");
  const listTarget = document.querySelector("#reviewsList");
  const approved = reviewStore.approved();

  if (homeTarget) {
    const latest = approved.filter((review) => review.featured || review.pinned).concat(approved.filter((review) => !review.featured && !review.pinned)).slice(0, 4);
    latest.length ? homeTarget.innerHTML = latest.map(reviewCard).join("") : renderEmptyReviews(homeTarget);
  }

  if (listTarget) {
    approved.length ? listTarget.innerHTML = approved.map(reviewCard).join("") : renderEmptyReviews(listTarget);
  }

  renderRatingSummary(approved);
  if (window.lucide) window.lucide.createIcons();
}

function renderRatingSummary(reviews) {
  const averageRating = document.querySelector("#averageRating");
  const averageStars = document.querySelector("#averageStars");
  const totalReviews = document.querySelector("#totalReviews");
  const breakdown = document.querySelector("#ratingBreakdown");
  if (!averageRating || !averageStars || !totalReviews || !breakdown) return;

  if (!reviews.length) {
    averageRating.textContent = "No ratings yet";
    averageStars.textContent = "★★★★★";
    totalReviews.textContent = "No approved reviews yet";
  } else {
    const average = reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
    averageRating.textContent = average.toFixed(1);
    averageStars.textContent = starText(Math.round(average));
    totalReviews.textContent = `${reviews.length} total approved review${reviews.length === 1 ? "" : "s"}`;
  }

  breakdown.innerHTML = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => Number(review.rating) === rating).length;
    return `<div class="rating-row"><span>${"★".repeat(rating)}</span><div><i style="width:${reviews.length ? (count / reviews.length) * 100 : 0}%"></i></div><strong>${count}</strong></div>`;
  }).join("");
}

function setupReviewForm() {
  const form = document.querySelector("#reviewForm");
  if (!form) return;

  const ratingInput = form.querySelector("#ratingValue");
  const starButtons = [...form.querySelectorAll(".star-input button")];
  const paintStars = (rating) => starButtons.forEach((button) => button.classList.toggle("active", Number(button.dataset.rating) <= rating));

  starButtons.forEach((button) => {
    button.addEventListener("mouseenter", () => paintStars(Number(button.dataset.rating)));
    button.addEventListener("click", () => {
      ratingInput.value = button.dataset.rating;
      paintStars(Number(button.dataset.rating));
    });
  });
  form.querySelector(".star-input").addEventListener("mouseleave", () => paintStars(Number(ratingInput.value)));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const rating = Number(data.get("rating"));
    if (!rating) {
      alert("Please select a star rating.");
      return;
    }

    const photoFile = data.get("photo");
    const photo = photoFile && photoFile.size ? await fileToDataUrl(photoFile) : "";
    const reviews = reviewStore.all();
    reviews.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      fullName: data.get("fullName").trim(),
      businessName: data.get("businessName").trim(),
      city: data.get("city").trim(),
      email: data.get("email").trim(),
      websiteCreated: data.get("websiteCreated").trim(),
      rating,
      message: data.get("message").trim(),
      photo,
      status: "pending",
      hidden: false,
      pinned: false,
      featured: false,
      createdAt: new Date().toISOString()
    });
    reviewStore.save(reviews);
    form.reset();
    ratingInput.value = "0";
    paintStars(0);
    alert("Thank you. Your real review has been submitted for approval.");
    renderAdminReviews();
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function renderAdminReviews() {
  const target = document.querySelector("#adminReviews");
  if (!target) return;
  const reviews = reviewStore.all();
  if (!reviews.length) {
    target.innerHTML = `<div class="empty-reviews"><h3>No submitted reviews yet.</h3><p>Reviews submitted from the public form will appear here.</p></div>`;
    return;
  }

  target.innerHTML = reviews.map((review) => `
    <article class="admin-review-card">
      ${reviewCard(review)}
      <textarea data-edit="${review.id}">${escapeHtml(review.message)}</textarea>
      <div class="admin-actions">
        <button data-action="approve" data-id="${review.id}">Approve</button>
        <button data-action="reject" data-id="${review.id}">Reject</button>
        <button data-action="pin" data-id="${review.id}">${review.pinned ? "Unpin" : "Pin"}</button>
        <button data-action="hide" data-id="${review.id}">${review.hidden ? "Show" : "Hide"}</button>
        <button data-action="feature" data-id="${review.id}">${review.featured ? "Unfeature" : "Mark Featured"}</button>
        <button data-action="edit" data-id="${review.id}">Save Edit</button>
        <button data-action="delete" data-id="${review.id}">Delete</button>
      </div>
      <p class="form-note">Status: ${review.status}${review.hidden ? " • Hidden" : ""}${review.pinned ? " • Pinned" : ""}${review.featured ? " • Featured" : ""}</p>
    </article>
  `).join("");

  target.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => updateReview(button.dataset.id, button.dataset.action));
  });
}

function updateReview(id, action) {
  let reviews = reviewStore.all();
  const review = reviews.find((item) => item.id === id);
  if (!review) return;

  if (action === "delete") {
    reviews = reviews.filter((item) => item.id !== id);
  } else if (action === "approve") {
    review.status = "approved";
  } else if (action === "reject") {
    review.status = "rejected";
  } else if (action === "pin") {
    review.pinned = !review.pinned;
  } else if (action === "hide") {
    review.hidden = !review.hidden;
  } else if (action === "feature") {
    review.featured = !review.featured;
  } else if (action === "edit") {
    const editBox = document.querySelector(`[data-edit="${id}"]`);
    review.message = editBox.value.trim();
  }

  reviewStore.save(reviews);
  renderAdminReviews();
  renderPublicReviews();
}

setupReviewForm();
renderPublicReviews();
renderAdminReviews();
