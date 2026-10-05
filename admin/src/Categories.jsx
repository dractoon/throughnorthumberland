import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function Categories() {

    const [categories, setCategories] = useState([]);
    const [features, setFeatures] = useState([]);

    const [newCategory, setNewCategory] = useState("");
    const [newFeature, setNewFeature] = useState("");

    const [message, setMessage] = useState("");

    useEffect(() => {
        loadCategories();
        loadFeatures();
    }, []);

    async function loadCategories() {

        const {
            data,
            error
        } = await supabase
            .from("explore_categories")
            .select("*")
            .order("sort_order", {
                ascending: true
            });

        if (error) {

            console.error(error);

            setMessage(
                "Unable to load categories."
            );

            return;
        }

        setCategories(data || []);
    }

    async function loadFeatures() {

        const {
            data,
            error
        } = await supabase
            .from("explore_features")
            .select("*")
            .order("sort_order", {
                ascending: true
            });

        if (error) {

            console.error(error);

            setMessage(
                "Unable to load features."
            );

            return;
        }

        setFeatures(data || []);
    }

    function createSlug(value) {

        return value
            .toLowerCase()
            .trim()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    async function addCategory(event) {

        event.preventDefault();

        const name =
            newCategory.trim();

        if (!name) return;

        const slug =
            createSlug(name);

        const nextOrder =
            categories.length
                ? Math.max(
                    ...categories.map(
                        item => item.sort_order
                    )
                ) + 10
                : 10;

        const {
            error
        } = await supabase
            .from("explore_categories")
            .insert({
                name,
                slug,
                sort_order: nextOrder
            });

        if (error) {

            console.error(error);

            setMessage(
                error.message
            );

            return;
        }

        setNewCategory("");
        setMessage("");

        loadCategories();
    }

    async function addFeature(event) {

        event.preventDefault();

        const name =
            newFeature.trim();

        if (!name) return;

        const slug =
            createSlug(name);

        const nextOrder =
            features.length
                ? Math.max(
                    ...features.map(
                        item => item.sort_order
                    )
                ) + 10
                : 10;

        const {
            error
        } = await supabase
            .from("explore_features")
            .insert({
                name,
                slug,
                sort_order: nextOrder
            });

        if (error) {

            console.error(error);

            setMessage(
                error.message
            );

            return;
        }

        setNewFeature("");
        setMessage("");

        loadFeatures();
    }

    async function toggleCategory(category) {

        const {
            error
        } = await supabase
            .from("explore_categories")
            .update({
                active: !category.active
            })
            .eq("id", category.id);

        if (error) {

            console.error(error);

            setMessage(
                error.message
            );

            return;
        }

        loadCategories();
    }

    async function toggleFeature(feature) {

        const {
            error
        } = await supabase
            .from("explore_features")
            .update({
                active: !feature.active
            })
            .eq("id", feature.id);

        if (error) {

            console.error(error);

            setMessage(
                error.message
            );

            return;
        }

        loadFeatures();
    }

    async function deleteCategory(category) {

        const confirmed =
            window.confirm(
                `Delete "${category.name}"?`
            );

        if (!confirmed) return;

        const {
            error
        } = await supabase
            .from("explore_categories")
            .delete()
            .eq("id", category.id);

        if (error) {

            console.error(error);

            setMessage(
                error.message
            );

            return;
        }

        loadCategories();
    }

    async function deleteFeature(feature) {

        const confirmed =
            window.confirm(
                `Delete "${feature.name}"?`
            );

        if (!confirmed) return;

        const {
            error
        } = await supabase
            .from("explore_features")
            .delete()
            .eq("id", feature.id);

        if (error) {

            console.error(error);

            setMessage(
                error.message
            );

            return;
        }

        loadFeatures();
    }

    return (
        <section style={styles.section}>

            <div style={styles.header}>

                <div>

                    <p style={styles.eyebrow}>
                        EXPLORE
                    </p>

                    <h2 style={styles.heading}>
                        Categories & Features
                    </h2>

                    <p style={styles.muted}>
                        Manage the categories and features
                        available throughout the website.
                    </p>

                </div>

            </div>


            {message && (
                <div style={styles.message}>
                    {message}
                </div>
            )}


            <div style={styles.columns}>

                {/* CATEGORIES */}

                <div style={styles.panel}>

                    <h3>
                        Categories
                    </h3>

                    <p style={styles.panelText}>
                        Broad types of places shown in Explore.
                    </p>

                    <form
                        onSubmit={addCategory}
                        style={styles.addForm}
                    >

                        <input
                            value={newCategory}
                            onChange={(event) =>
                                setNewCategory(
                                    event.target.value
                                )
                            }
                            placeholder="New category..."
                            style={styles.input}
                        />

                        <button
                            type="submit"
                            style={styles.addButton}
                        >
                            Add
                        </button>

                    </form>


                    <div style={styles.list}>

                        {categories.map(
                            category => (

                                <div
                                    key={category.id}
                                    style={{
                                        ...styles.listItem,
                                        opacity:
                                            category.active
                                                ? 1
                                                : 0.5
                                    }}
                                >

                                    <div>

                                        <strong>
                                            {category.name}
                                        </strong>

                                        <small>
                                            {category.slug}
                                        </small>

                                    </div>

                                    <div
                                        style={
                                            styles.actions
                                        }
                                    >

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleCategory(
                                                    category
                                                )
                                            }
                                            style={
                                                styles.smallButton
                                            }
                                        >
                                            {category.active
                                                ? "Disable"
                                                : "Enable"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteCategory(
                                                    category
                                                )
                                            }
                                            style={
                                                styles.deleteButton
                                            }
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>


                {/* FEATURES */}

                <div style={styles.panel}>

                    <h3>
                        Features
                    </h3>

                    <p style={styles.panelText}>
                        Useful characteristics visitors can filter by.
                    </p>

                    <form
                        onSubmit={addFeature}
                        style={styles.addForm}
                    >

                        <input
                            value={newFeature}
                            onChange={(event) =>
                                setNewFeature(
                                    event.target.value
                                )
                            }
                            placeholder="New feature..."
                            style={styles.input}
                        />

                        <button
                            type="submit"
                            style={styles.addButton}
                        >
                            Add
                        </button>

                    </form>


                    <div style={styles.list}>

                        {features.map(
                            feature => (

                                <div
                                    key={feature.id}
                                    style={{
                                        ...styles.listItem,
                                        opacity:
                                            feature.active
                                                ? 1
                                                : 0.5
                                    }}
                                >

                                    <div>

                                        <strong>
                                            {feature.name}
                                        </strong>

                                        <small>
                                            {feature.slug}
                                        </small>

                                    </div>

                                    <div
                                        style={
                                            styles.actions
                                        }
                                    >

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleFeature(
                                                    feature
                                                )
                                            }
                                            style={
                                                styles.smallButton
                                            }
                                        >
                                            {feature.active
                                                ? "Disable"
                                                : "Enable"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteFeature(
                                                    feature
                                                )
                                            }
                                            style={
                                                styles.deleteButton
                                            }
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>

            </div>

        </section>
    );
}


const styles = {

    section: {
        marginTop: "30px",
    },

    header: {
        marginBottom: "20px",
    },

    eyebrow: {
        color: "#315b55",
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "1px",
        marginBottom: "6px",
    },

    heading: {
        margin: 0,
        color: "#202522",
    },

    muted: {
        color: "#68706b",
        lineHeight: "1.6",
    },

    columns: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "20px",
    },

    panel: {
        background: "#ffffff",
        padding: "25px",
        borderRadius: "16px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
    },

    panelText: {
        color: "#68706b",
        fontSize: "14px",
        marginBottom: "20px",
    },

    addForm: {
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
    },

    input: {
        flex: 1,
        minWidth: 0,
        padding: "11px 12px",
        border: "1px solid #dedbd2",
        borderRadius: "8px",
        fontSize: "14px",
        boxSizing: "border-box",
    },

    addButton: {
        padding: "10px 16px",
        background: "#315b55",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
    },

    list: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },

    listItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
        padding: "12px",
        border: "1px solid #dedbd2",
        borderRadius: "10px",
    },

    actions: {
        display: "flex",
        gap: "6px",
        flexShrink: 0,
    },

    smallButton: {
        padding: "6px 9px",
        background: "#dce7e3",
        color: "#315b55",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "bold",
    },

    deleteButton: {
        padding: "6px 9px",
        background: "#f2d8d3",
        color: "#c85c4a",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "bold",
    },

    message: {
        marginBottom: "20px",
        padding: "12px",
        background: "#f2d8d3",
        color: "#c85c4a",
        borderRadius: "8px",
    },

};

export default Categories;