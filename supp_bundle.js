document.addEventListener('DOMContentLoaded', function() {
    // Select the 3-month option by default when page loads
    const threeMonthRadio = document.querySelector('#month3');
    if (threeMonthRadio) {
        threeMonthRadio.checked = true;
        threeMonthRadio.dispatchEvent(new Event('change'));
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
    const giftImage = document.getElementById('giftImage');

    console.log('Selected period:', period);

    const content = {
        'month3': {
            membership: '3 months of membership',
            gift: 'Free gifts worth $102',
            checkout: '/quiz-s?time=3month',
            image: 'https://cdn.prod.website-files.com/6357d4fbecfafa3f24d20445/67628ced452afe483208aa52_all3.avif'
        },
        'month2': {
            membership: '2 months of membership',
            gift: 'Free gifts worth $67',
            checkout: '/quiz-s?time=2month',
            image: 'https://cdn.prod.website-files.com/6357d4fbecfafa3f24d20445/67636c46f340b0299d729d85_all2.avif'
        },
        'month1': {
            membership: '1 month of membership',
            gift: 'Free gifts worth $27',
            checkout: '/quiz-s?time=1month',
            image: 'https://cdn.prod.website-files.com/6357d4fbecfafa3f24d20445/67636c466c9bf69e5e512f40_all1.avif'
        }
    };

    if (!content[period]) {
        console.error('Invalid period:', period);
        return;
    }

    if (membershipText) membershipText.textContent = content[period].membership;
    if (giftText) giftText.textContent = content[period].gift;
    if (checkoutButton) checkoutButton.href = content[period].checkout;
    if (giftImage) giftImage.src = content[period].image;
}
