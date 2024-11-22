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
    var planName;

    // Convert promoType to lowercase for case-insensitive comparison
    promoType = promoType.toLowerCase();

    switch (promoType) {
      case "59":
        price = "$59.65";
        break;
      case "49":
        price = "$49";
        break;
      case "39":
        price = "$39";
        break;
      case "29":
        price = "$28.65";
        break;
      case "19":
        price = "$19";
        break;
      case "9":
        price = "$9";
        break;
      default:
        return false;
    }

    // Set the popup text
    popupText = `You've unlocked your first 4 weeks for ${price}`;
    var popupElement = document.querySelector("#offer-popup-open");

    // Ensure the element exists before attempting to change its properties
    if (popupElement) {
      // Simulate the click
      popupElement.click();
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

  const weightLossNumber = document.querySelector("[data-weightloss-number]");

  let weightLossStorage = localStorage.getItem("quiz_prediction");
  if (weightLossStorage) {
    if (weightLossNumber) {
      weightLossNumber.textContent = weightLossStorage;
    }
  } else {
    if (weightLossNumber) {
      weightLossNumber.parentElement.innerHTML =
        "Unlock access to GLP-1 weight loss";
    }
  }
});