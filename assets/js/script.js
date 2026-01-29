// google maps API key
// AIzaSyAJoOGB75_bpzjqUae_aj1kBl_JIZJdu4I


// Home page search feature

$('#searchForm').on('submit', function (e) {
  e.preventDefault();

  localStorage.setItem(
    'searchCity',
    $('#destination').val().toLowerCase().trim()
  );

  localStorage.setItem(
    'searchGuests',
    $('#guests').val()
  );

  window.location.href = 'destinations.html';
});

