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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const date = document.getElementById("dates")?.value || "";
    const city = document.getElementById("destination")?.value || "";

    // Optional guest selects (only used if they exist)
    const adults = document.getElementById("adults")?.value ?? "";
    const children = document.getElementById("children")?.value ?? "";
    const toddlers = document.getElementById("toddlers")?.value ?? "";
    const babies = document.getElementById("babies")?.value ?? "";

    if (!date) {
      alert("Please choose a date");
      return;
    }

    if (!city) {
      alert("Please select a city");
      return;
    }

    const params = new URLSearchParams();
    params.set("city", city);
    params.set("date", date);

    // Only include guest params if present
    if (adults !== "") params.set("adults", adults);
    if (children !== "") params.set("children", children);
    if (toddlers !== "") params.set("toddlers", toddlers);
    if (babies !== "") params.set("babies", babies);

    window.location.href = `destinations.html?${params.toString()}`;
  });
});

