document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll(".filter-button");
    const cards = document.querySelectorAll(".places-card");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const filter = button.dataset.filter;

            buttons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            cards.forEach(card => {

                const category = card.dataset.category;

                if (filter === "all" || category === filter) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }

            });

        });

    });

});