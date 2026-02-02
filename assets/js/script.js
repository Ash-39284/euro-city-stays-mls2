// google maps API key
// AIzaSyAJoOGB75_bpzjqUae_aj1kBl_JIZJdu4I

// Search feature (only on HTML)

const ALLOWED_CITIES = [
  "paris",
  "vienna",
  "copenhagen",
  "london",
  "prague",
  "warsaw",
  "berlin",
  "madrid",
  "lisbon"
];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const city = document
      .getElementById("destination")
      .value
      .trim()
      .toLowerCase();

    if (!city) {
      alert("Please enter a city");
      return;
    }

    if (!ALLOWED_CITIES.includes(city)) {
      alert("This destination is not available yet.");
      return;
    }

    window.location.href =
      `destinations.html?city=${encodeURIComponent(city)}`;
  });
});

