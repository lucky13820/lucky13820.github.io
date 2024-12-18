document.addEventListener('DOMContentLoaded', function() {
    // Select the 3-month option by default when page loads
    const threeMonthRadio = document.querySelector('#month3');
    if (threeMonthRadio) {
        threeMonthRadio.checked = true;
        updateContent('month3');
    }

    // Add event listeners to all radio buttons
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            updateContent(this.id);
        });
    });
});

function updateContent(period) {
    const membershipText = document.getElementById('membershipText');
    const giftText = document.getElementById('giftText');
    const checkoutButton = document.getElementById('checkoutButton');

    console.log('Selected period:', period);

    const content = {
        'month3': {
            membership: '3 months of membership',
            gift: 'Free gifts worth $102',
            checkout: '/checkout-s?time=3month'
        },
        'month2': {
            membership: '2 months of membership',
            gift: 'Free gifts worth $67',
            checkout: '/checkout-s?time=2month'
        },
        'month1': {
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
