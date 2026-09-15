module.exports = function(eleventyConfig) {

    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("styles.css");

    return {
        dir: {
            input: "src",
            includes: "../_includes",
            output: "_site"
        }
    };

};