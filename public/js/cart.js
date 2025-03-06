// public/js/cart.js
document.addEventListener('DOMContentLoaded', () => {
    const products = JSON.parse(document.getElementById('products').value);
    let totalPrice = 0;

    products.forEach(product => {
        totalPrice += product.price * product.quantity;
    });

    document.getElementById('totalPrice').innerText = 'Total Price: ₹' + totalPrice;
});
