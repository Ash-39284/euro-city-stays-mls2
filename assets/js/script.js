// google maps API key
// AIzaSyAJoOGB75_bpzjqUae_aj1kBl_JIZJdu4I

// Search feature (only on HTML)
if (document.getElementById("searchForm")) {
  $('#searchForm').on('submit', function (e) {
    e.preventDefault();

    const destination = $('#destination').val().trim().toLowerCase();
    if (!destination) return alert("Please enter a destination");

    window.location.href =
      `destinations.html?city=${encodeURIComponent(destination)}`;
  });
};

window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");

  if (!city) return;

  const card = document.querySelector(
    `.place-card[data-city="${city.toLowerCase()}"]`
  );

  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    fetchPOIs(card, "tourist_attraction");

    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    map.panTo({ lat, lng });
    map.setZoom(11);
  }
});



