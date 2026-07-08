console.log("Сайт Ивана Корытника загружен");
const galleryImages = document.querySelectorAll(".photo-gallery img");
const photoModal = document.getElementById("photoModal");
const photoModalImage = document.getElementById("photoModalImage");
const photoModalClose = document.querySelector(".photo-modal__close");

galleryImages.forEach((image) => {
  image.addEventListener("click", () => {
    photoModalImage.src = image.src;
    photoModalImage.alt = image.alt;
    photoModal.classList.add("active");
  });
});

photoModalClose.addEventListener("click", () => {
  photoModal.classList.remove("active");
  photoModalImage.src = "";
});

photoModal.addEventListener("click", (event) => {
  if (event.target === photoModal) {
    photoModal.classList.remove("active");
    photoModalImage.src = "";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    photoModal.classList.remove("active");
    photoModalImage.src = "";
  }
});
const photoImages = document.querySelectorAll(".photo-card img");
const photoModal = document.getElementById("photoModal");
const photoModalImage = document.getElementById("photoModalImage");
const photoModalClose = document.getElementById("photoModalClose");

photoImages.forEach((image) => {
  image.addEventListener("click", () => {
    photoModalImage.src = image.src;
    photoModalImage.alt = image.alt;
    photoModal.classList.add("active");
  });
});

photoModalClose.addEventListener("click", () => {
  photoModal.classList.remove("active");
  photoModalImage.src = "";
});

photoModal.addEventListener("click", (event) => {
  if (event.target === photoModal) {
    photoModal.classList.remove("active");
    photoModalImage.src = "";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    photoModal.classList.remove("active");
    photoModalImage.src = "";
  }
});
