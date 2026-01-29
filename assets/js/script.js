// google maps API key
// AIzaSyAJoOGB75_bpzjqUae_aj1kBl_JIZJdu4I

$('#searchForm').on('submit', function (e) {
  e.preventDefault();

  const destination = $('#destination').val().trim().toLowerCase();

  if (!destination) {
    alert('Please enter a destination');
    return;
  }

  // Redirect to destinations page with query
  window.location.href = `destinations.html?city=${encodeURIComponent(destination)}`;
});




