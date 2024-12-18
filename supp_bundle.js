document.addEventListener('DOMContentLoaded', function() {
    // Select the 3-month option by default when page loads
    const threeMonthRadio = document.querySelector('[data-id="3month"]');
    if (threeMonthRadio) {
        threeMonthRadio.checked = true;
        updateContent('3month');
    }

    // Add event listeners to all radio buttons
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            updateContent(this.getAttribute('data-id'));
        });
    });
});

function updateContent(period) {
    const membershipText = document.getElementById('membershipText');
    const giftText = document.getElementById('giftText');
    const checkoutButton = document.getElementById('checkoutButton');

    console.log('Selected period:', period);

    const content = {
        '3month': {
            membership: '3 months of membership',
            gift: 'Free gifts worth $102',
            checkout: '/checkout-s?time=3month'
        },
        '2month': {
            membership: '2 months of membership',
            gift: 'Free gifts worth $67',
            checkout: '/checkout-s?time=2month'
        },
        '1month': {
            membership: '1 month of membership',
            gift: 'Free gifts worth $27',
            checkout: '/checkout-s?time=1month'
        }
    };

    if (!content[period]) {
        console.error('Invalid period:', period);
        return;
    }

    if (membershipText) membershipText.textContent = content[period].membership;
    if (giftText) giftText.textContent = content[period].gift;
    if (checkoutButton) checkoutButton.href = content[period].checkout;
}
