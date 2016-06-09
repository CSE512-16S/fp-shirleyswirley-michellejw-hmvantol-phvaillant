
// When you click the Start tour button, stuff happens
$('.tour').on('click', function () {

    $('#home_info').toggleClass('col-md-5 col-md-0');
    $('#location_info').toggleClass('col-md-5 col-md-0');
});



$( document ).click(function() {
  $( "#toggle.col-md-2 " ).toggle( "slide" );
});