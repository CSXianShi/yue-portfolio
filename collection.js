(() => {
  "use strict";
  const dialog = document.getElementById("card-dialog");
  if (!dialog) return;
  const image = document.getElementById("card-dialog-image");
  const title = document.getElementById("card-dialog-title");
  const caption = document.getElementById("card-dialog-caption");
  let previousFocus = null;
  document.querySelectorAll("[data-card-open]").forEach(button => {
    button.addEventListener("click", () => {
      previousFocus = button;
      image.src = button.dataset.cardSrc;
      image.alt = button.dataset.cardTitle;
      title.textContent = button.dataset.cardTitle;
      caption.textContent = button.dataset.cardSummary;
      dialog.showModal();
      document.body.classList.add("modal-open");
    });
  });
  dialog.querySelector("[data-card-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    image.removeAttribute("src");
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
})();
