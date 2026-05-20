const times = document.querySelectorAll(".time");

times.forEach((btn) => {

  btn.addEventListener("click", () => {

    times.forEach((item) => {
      item.classList.remove("active");
    });

    btn.classList.add("active");

  });

}); const selected = document.getElementById("selected-text");
const options = document.getElementById("select-options");
const arrow = document.querySelector(".arrow");

function toggleOptions() {
  options.classList.toggle("show");
  arrow.style.transform = options.classList.contains("show")
    ? "rotate(180deg)"
    : "rotate(0deg)";
}

function selectOption(option) {
  const img = option.querySelector("img").src;
  const categoria = option.querySelector(".categoria").textContent;
  const titulo = option.querySelector("h3").textContent;
  const quantidadej = option.querySelector("p").textContent;
  const valorh = option.querySelector("strong").textContent;
  selected.innerHTML = `
        <div class="selected-card">
            <img src="${img}">
            <div class="option-info">
              <span class="categoria">${categoria}</span>
              <h3>${titulo}</h3>
              <p>${quantidadej}</p>
              <strong>${valorh}</strong>
            </div>
        </div>
    `;

  options.classList.remove("show");
  arrow.style.transform = "rotate(0deg)";
}

/* FECHAR AO CLICAR FORA */
document.addEventListener("click", function (event) {
  const customSelect = document.querySelector(".custom-select");

  if (!customSelect.contains(event.target)) {
    options.classList.remove("show");
    arrow.style.transform = "rotate(0deg)";
  }
});