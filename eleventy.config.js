require("dotenv").config();
module.exports = function(eleventyConfig) {

    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("styles.css");
eleventyConfig.addPassthroughCopy({
    "node_modules/leaflet/dist/leaflet.css": "assets/leaflet.css",
    "node_modules/leaflet/dist/leaflet.js": "assets/leaflet.js",
    "node_modules/leaflet/dist/images/marker-icon.png": "assets/marker-icon.png",
    "node_modules/leaflet/dist/images/marker-icon-2x.png": "assets/marker-icon-2x.png",
    "node_modules/leaflet/dist/images/marker-shadow.png": "assets/marker-shadow.png"
});

    return {
        dir: {
            input: "src",
            includes: "../_includes",
            output: "_site"
        }
    };

};