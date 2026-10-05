const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = async function () {

    const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase published places error:", error);
        return [];
    }

    return data || [];
};