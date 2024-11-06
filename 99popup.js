document.addEventListener("DOMContentLoaded", function () {
  // Helper function to get the value of a URL parameter
  function getQueryParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Function to change the popup text and price based on the promo type
  function setPopupAndPrice(promoType) {
    var popupText;
    var price;

    // Convert promoType to lowercase for case-insensitive comparison
    promoType = promoType.toLowerCase();

    switch (promoType) {
      case "compounded129":
        price = "$129";
        break;
      case "compounded149":
        price = "$149";
        break;
      case "compounded169":
        price = "$169";
        break;
      case "compounded189":
        price = "$189";
        break;
      case "C99SEM":
        price = "$99";
        break;
      case "C139SEM":
        price = "$139";
        break;
      case "C169SEM":
        price = "$169";
        break;
      default:
        return false;
    }

    // Set the popup text
    popupText = `You've unlocked your first month for ${price}`;
    var popupElement = document.querySelector("#offer-popup-open");

    // Ensure the element exists before attempting to change its properties
    if (popupElement) {
      // Set data attribute if needed
      document.querySelector("[data-popup-text]").textContent = popupText;
      // Change the text content
      popupElement.textContent = popupText;
      // Simulate the click

      setTimeout(function () {
        popupElement.click();
      }, 200);
      return true;
    }
    return false;
  }

  // Get the promo value from the URL
  var promoValue = getQueryParam("promo");

  // If promoValue is present and valid, call setPopupAndPrice with the promo value
  if (promoValue) {
    setPopupAndPrice(promoValue);
  }
});