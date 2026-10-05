const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = async function () {

    const { data: categories, error: categoryError } =
        await supabase
            .from("explore_categories")
            .select("id, name, slug")
            .eq("active", true)
            .order("sort_order", {
                ascending: true
            });

    const { data: features, error: featureError } =
        await supabase
            .from("explore_features")
            .select("id, name, slug")
            .eq("active", true)
            .order("sort_order", {
                ascending: true
            });

    if (categoryError) {
        console.error(
            "Supabase Explore categories error:",
            categoryError
        );
    }

    if (featureError) {
        console.error(
            "Supabase Explore features error:",
            featureError
        );
    }

    return {
        categories: categories || [],
        features: features || []
    };
};