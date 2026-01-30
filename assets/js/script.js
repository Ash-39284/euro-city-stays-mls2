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
}


