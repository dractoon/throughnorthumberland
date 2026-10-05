module.exports = class {

    data() {
        return {
            pagination: {
                data: "publishedPlaces",
                size: 1,
                alias: "current_place"
            },

            layout: "place.njk",

            permalink: data => {
                return `/places/${data.current_place.slug}/`;
            }
        };
    }

    render(data) {
        return "";
    }

};