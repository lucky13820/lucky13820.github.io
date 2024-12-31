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
    console.log("Promo type after lowercase:", promoType); // Debug log

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
      case "c99sem":
        price = "$99";
        break;
      case "c139sem":
        price = "$139";
        break;
      case "c169sem":
        price = "$169";
        break;
      case "newyear199":
        price = "$199";
        popupText = `You've unlocked ${price}/mo for your first 3 months`;
        break;
      default:
        console.log("No matching promo type found for:", promoType);
        return false;
    }

    // Set the popup text only if it hasn't been set in the switch statement
    if (!popupText) {
      popupText = `You've unlocked your first month for ${price}`;
    }

    var popupElement = document.querySelector("#offer-popup-open");
    console.log("Popup element found:", !!popupElement); // Debug log

    // Ensure the element exists before attempting to change its properties
    if (popupElement) {
      // Set data attribute if needed
      const popupTextElement = document.querySelector("[data-popup-text]");
      if (popupTextElement) {
        popupTextElement.textContent = popupText;
      }
      
      // Change the text content
      popupElement.textContent = popupText;
      
      // Simulate the click with a slight delay
      setTimeout(function () {
        popupElement.click();
        console.log("Popup click triggered"); // Debug log
      }, 200);
      return true;
    }
    return false;
  }

  // Get the promo value from the URL
  var promoValue = getQueryParam("promo");
  console.log("URL promo value:", promoValue); // Debug log

  // If promoValue is present and valid, call setPopupAndPrice with the promo value
  if (promoValue) {
    const result = setPopupAndPrice(promoValue);
    console.log("setPopupAndPrice result:", result); // Debug log
  }
});