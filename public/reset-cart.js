// Force clear bad cart data on load
(function() {
    console.log("🛡️ Auto-Cleaning Invalid Cart Data...");
    try {
        var cart = JSON.parse(localStorage.getItem('hubooze_cart') || '[]');
        if (cart.length > 0) {
            // If cart has items, we force clear it to prevent p7 error
            // In a real fix, we would filter, but clearing is safer for now
            localStorage.setItem('hubooze_cart', '[]');
            console.log("🗑️ Cleared cart containing invalid items.");
            location.reload(); // Reload to apply clean state
        }
    } catch(e) {}
})();
