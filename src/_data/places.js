const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = async function () {

    const { data, error } = await supabase
        .from("places")
        .select(`
            *,
            place_categories (
                category_id,
                explore_categories (
                    id,
                    name,
                    slug
                )
            ),
            place_features (
                feature_id,
                explore_features (
                    id,
                    name,
                    slug
                )
            )
        `)
        .eq("status", "published")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Supabase places error:",
            error
        );

        return {};
    }

    const {
        data: ratingData,
        error: ratingError
    } = await supabase
        .from("place_rating_summary")
        .select(`
            place_id,
            average_rating,
            rating_count
        `);

    if (ratingError) {
        console.error(
            "Supabase ratings error:",
            ratingError
        );
    }

    const ratingsByPlace = {};

    for (const rating of ratingData || []) {

        ratingsByPlace[rating.place_id] = {
            average: Number(rating.average_rating),
            count: Number(rating.rating_count)
        };

    }

    const places = {};

    for (const place of data || []) {

        place.exploreCategories =
            (place.place_categories || [])
                .map(item => item.explore_categories)
                .filter(Boolean);

        place.features =
            (place.place_features || [])
                .map(item => item.explore_features)
                .filter(Boolean);

        place.exploreCategorySlugs =
            place.exploreCategories.map(
                category => category.slug
            );

        place.featureSlugs =
            place.features.map(
                feature => feature.slug
            );

        place.rating =
            ratingsByPlace[place.id] || {
                average: 0,
                count: 0
            };

        places[place.slug] = place;
    }

    return places;
};